/**
 * Bulk-firma-søgning — paste firmanavne, få email/telefon/website tilbage.
 *
 * Bruges når du har en liste af firmaer/medarbejdere du gerne vil have ind i systemet
 * men ikke vil oprette dem manuelt én ad gangen.
 *
 * Per firma:
 *   1. Søg via OSM Overpass for at finde struktureret data
 *   2. Hvis ikke fundet: gæt website + scrape det
 *   3. Hvis stadig intet: tilføj som lead uden email (Sarah kan SMS'e dem)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readLeads, writeLeads, generateId } from "@/lib/db";
import { scrapeWebsite } from "@/lib/lead-finder/enrichment/website-scraper";
import type { Lead, LeadType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface CompanyResult {
  companyName: string;
  status: "added" | "skipped" | "failed";
  email?: string;
  phone?: string;
  website?: string;
  reason?: string;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const STORKBH_BBOX = "55.55,12.30,55.85,12.75";

/** Søg på firmanavn i OSM Overpass */
async function searchOSMByName(name: string): Promise<{ email?: string; phone?: string; website?: string; address?: string } | null> {
  // Escape regex special chars for Overpass
  const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const query = `
[out:json][timeout:15];
(
  nwr["name"~"^${safeName}",i](${STORKBH_BBOX});
);
out center tags;
`;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(18000),
    });

    if (!res.ok) return null;
    const data = await res.json() as { elements?: Array<{ tags?: Record<string, string> }> };
    const first = data.elements?.find((el) => el.tags?.name?.toLowerCase().includes(name.toLowerCase()));
    if (!first?.tags) return null;

    const tags = first.tags;
    return {
      email: tags.email || tags["contact:email"],
      phone: tags.phone || tags["contact:phone"],
      website: tags.website || tags["contact:website"],
      address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  }
}

/** Gæt et website baseret på firmanavn — prøv .dk og .com varianter */
async function guessWebsite(name: string): Promise<string | null> {
  const cleaned = name
    .toLowerCase()
    .replace(/\s*(aps|a\/s|i\/s|ivs|p\/s)\s*$/i, "")
    .replace(/[æ]/g, "ae").replace(/[ø]/g, "oe").replace(/[å]/g, "aa")
    .replace(/[^a-z0-9]/g, "");

  if (cleaned.length < 3) return null;

  for (const url of [`https://www.${cleaned}.dk`, `https://${cleaned}.dk`, `https://www.${cleaned}.com`]) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 KrydsByg" },
      });
      if (res.ok && res.url) return res.url;
    } catch { /* skip */ }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { names, leadType = "company", serviceType, city } = body;

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json({ error: "Forventer 'names' array af firmanavne" }, { status: 400 });
    }

    const cleanedNames = names
      .map((n) => String(n).trim())
      .filter((n) => n.length >= 3)
      .slice(0, 50); // Max 50 per kald

    const existingLeads = await readLeads();
    const existingNames = new Set(existingLeads.map((l) => l.companyName.toLowerCase()));

    const results: CompanyResult[] = [];
    const newLeads: Lead[] = [];

    const startMs = Date.now();
    const TIME_BUDGET = 270_000;

    for (const name of cleanedNames) {
      if (Date.now() - startMs > TIME_BUDGET) {
        results.push({ companyName: name, status: "failed", reason: "Tidsbudget overskredet" });
        continue;
      }

      // Skip dubletter
      if (existingNames.has(name.toLowerCase())) {
        results.push({ companyName: name, status: "skipped", reason: "Eksisterer allerede" });
        continue;
      }

      try {
        // 1. Prøv OSM først
        let info = await searchOSMByName(name);

        // 2. Hvis intet i OSM: gæt website + scrape
        if (!info?.email && !info?.phone) {
          const website = info?.website || await guessWebsite(name);
          if (website) {
            const scrape = await scrapeWebsite(website).catch(() => null);
            if (scrape) {
              info = {
                email: scrape.emails[0] || info?.email,
                phone: scrape.phones[0] || info?.phone,
                website,
                address: info?.address,
              };
            }
          }
        }

        // Opret altid leadet — selv uden email, kan vi måske SMS'e
        const now = new Date().toISOString();
        const lead: Lead = {
          id: generateId(),
          companyName: name,
          email: info?.email || "",
          phone: info?.phone,
          website: info?.website,
          city: city || "København",
          leadType: leadType as LeadType,
          serviceType,
          notes: [
            info?.address ? `Adresse: ${info.address}` : "",
            info?.email ? `Email fundet automatisk` : "⚠ Ingen email — overvej SMS eller manuel udfyldelse",
          ].filter(Boolean).join("\n"),
          status: "New",
          sourceFile: "bulk-search",
          createdAt: now,
          updatedAt: now,
        };

        newLeads.push(lead);
        existingNames.add(name.toLowerCase());

        results.push({
          companyName: name,
          status: "added",
          email: info?.email,
          phone: info?.phone,
          website: info?.website,
        });

        await new Promise((r) => setTimeout(r, 800));
      } catch (err) {
        results.push({
          companyName: name,
          status: "failed",
          reason: err instanceof Error ? err.message.slice(0, 80) : "fejl",
        });
      }
    }

    if (newLeads.length > 0) {
      await writeLeads([...existingLeads, ...newLeads]);
    }

    const withEmail = results.filter((r) => r.status === "added" && r.email).length;
    const withoutEmail = results.filter((r) => r.status === "added" && !r.email).length;

    return NextResponse.json({
      ok: true,
      total: cleanedNames.length,
      added: newLeads.length,
      withEmail,
      withoutEmail,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (err) {
    console.error("[leads/bulk-search]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
