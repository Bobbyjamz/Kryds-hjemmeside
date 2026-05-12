/**
 * Retry email-finding på alle leads uden email.
 *
 * For hvert lead uden email:
 *   1. Prøv at finde website via Google Maps søgning (hvis ingen website)
 *   2. Scrape websitet med vores forbedrede scraper
 *   3. Også prøv Hunter.io og Apollo hvis API-nøgler er sat
 *
 * Returnerer: { enriched: N, skipped: M, errors: [...] }
 *
 * Kører i baggrund. Max 30 leads per kald (timeout-sikring).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readLeads, writeLeads } from "@/lib/db";
import { scrapeWebsite } from "@/lib/lead-finder/enrichment/website-scraper";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface EnrichResult {
  leadId: string;
  companyName: string;
  status: "found" | "guessed" | "failed";
  email?: string;
  source?: string;
  reason?: string;
}

async function tryHunter(domain: string): Promise<string | null> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=3&type=personal`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as { data?: { emails?: Array<{ value: string; confidence: number }> } };
    const emails = data.data?.emails || [];
    const best = emails.filter((e) => e.confidence >= 70).sort((a, b) => b.confidence - a.confidence)[0];
    return best?.value || emails[0]?.value || null;
  } catch {
    return null;
  }
}

function extractDomain(url?: string): string | null {
  if (!url) return null;
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Forsøg at finde et website via Google søgning baseret på firmanavn */
async function guessWebsite(companyName: string): Promise<string | null> {
  // Simpel heuristik: lav et website-gæt baseret på firmanavn
  const cleaned = companyName
    .toLowerCase()
    .replace(/\s*(aps|a\/s|i\/s|ivs|p\/s)\s*$/i, "")
    .replace(/[æø]/g, (m) => m === "æ" ? "ae" : "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]/g, "");

  if (cleaned.length < 3) return null;

  const candidates = [
    `https://www.${cleaned}.dk`,
    `https://${cleaned}.dk`,
    `https://www.${cleaned}.com`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 KrydsByg" },
      });
      if (res.ok && res.url) return res.url;
    } catch { /* prøv næste */ }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadIds, maxLeads = 30 } = await req.json().catch(() => ({}));

  try {
    const allLeads = await readLeads();

    // Filter: enten specifikke leadIds, eller alle uden email
    const toEnrich = Array.isArray(leadIds) && leadIds.length > 0
      ? allLeads.filter((l) => leadIds.includes(l.id) && !l.email)
      : allLeads.filter((l) => !l.email && l.status === "New");

    if (toEnrich.length === 0) {
      return NextResponse.json({ ok: true, enriched: 0, message: "Ingen leads at berige" });
    }

    const batch = toEnrich.slice(0, maxLeads);
    const results: EnrichResult[] = [];
    const updatedLeads = [...allLeads];
    let enriched = 0;
    let guessed = 0;

    const startMs = Date.now();
    const TIME_BUDGET = 270_000; // 4,5 min

    for (const lead of batch) {
      if (Date.now() - startMs > TIME_BUDGET) {
        results.push({ leadId: lead.id, companyName: lead.companyName, status: "failed", reason: "Tidsbudget overskredet" });
        continue;
      }

      try {
        let foundEmail: string | null = null;
        let source: string | undefined;

        // 1. Hvis lead har website → scrape det
        if (lead.website) {
          const scrape = await scrapeWebsite(lead.website);
          if (scrape.emails.length > 0) {
            foundEmail = scrape.emails[0];
            source = `Website-scraper (${scrape.emailSource})`;
          }
        }

        // 2. Hvis ingen website → gæt et fra firmanavn og scrape det
        if (!foundEmail && !lead.website) {
          const guessedSite = await guessWebsite(lead.companyName);
          if (guessedSite) {
            const scrape = await scrapeWebsite(guessedSite);
            if (scrape.emails.length > 0) {
              foundEmail = scrape.emails[0];
              source = `Gættet website + scraper (${scrape.emailSource})`;
              // Gem også det fundne website
              const idx = updatedLeads.findIndex((l) => l.id === lead.id);
              if (idx !== -1) {
                updatedLeads[idx] = { ...updatedLeads[idx], website: guessedSite };
              }
            }
          }
        }

        // 3. Hunter.io som ekstra fallback (hvis API key sat)
        if (!foundEmail) {
          const domain = extractDomain(lead.website);
          if (domain) {
            const hunter = await tryHunter(domain);
            if (hunter) {
              foundEmail = hunter;
              source = "Hunter.io";
            }
          }
        }

        if (foundEmail) {
          const idx = updatedLeads.findIndex((l) => l.id === lead.id);
          if (idx !== -1) {
            updatedLeads[idx] = {
              ...updatedLeads[idx],
              email: foundEmail,
              notes: [
                updatedLeads[idx].notes,
                `✓ Email fundet via ${source}: ${foundEmail}`,
              ].filter(Boolean).join("\n"),
              updatedAt: new Date().toISOString(),
            };
          }
          enriched++;
          if (source?.includes("Gæt") || foundEmail.startsWith("info@") || foundEmail.startsWith("kontakt@")) {
            guessed++;
            results.push({ leadId: lead.id, companyName: lead.companyName, status: "guessed", email: foundEmail, source });
          } else {
            results.push({ leadId: lead.id, companyName: lead.companyName, status: "found", email: foundEmail, source });
          }
        } else {
          results.push({ leadId: lead.id, companyName: lead.companyName, status: "failed", reason: "Ingen email kunne findes" });
        }

        // Pause så vi ikke hammer servere
        await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        results.push({
          leadId: lead.id,
          companyName: lead.companyName,
          status: "failed",
          reason: err instanceof Error ? err.message.slice(0, 80) : "ukendt fejl",
        });
      }
    }

    if (enriched > 0) {
      await writeLeads(updatedLeads);
    }

    return NextResponse.json({
      ok: true,
      processed: batch.length,
      enriched,
      guessed,
      failed: batch.length - enriched,
      remaining: toEnrich.length - batch.length,
      results: results.slice(0, 50), // Returner kun de første 50 for response-størrelse
      hasHunter: !!process.env.HUNTER_API_KEY,
      hasApollo: !!process.env.APOLLO_API_KEY,
    });
  } catch (err) {
    console.error("[leads/enrich-emails]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
