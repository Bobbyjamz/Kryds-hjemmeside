/**
 * Business directories — proff.dk + degulesider.dk
 *
 * Begge er offentlige danske firmaregistre med kontaktoplysninger
 * (telefon, adresse, ofte email). Gratis, ingen API-key.
 *
 * Strategi: Søg efter relevante brancher i KBH-zoner og udtræk firmadata.
 */

import type { LeadCandidate } from "../types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const DIRECTORY_QUERIES = [
  "ejendomsadministration",
  "facility management",
  "bygningsservice",
  "vicevært",
  "rengøring erhverv",
  "ejendomsservice",
  "boligforening",
  "andelsboligforening",
  "boligselskab",
  "bygherrerådgiver",
  "byggefirma",
  "håndværker",
  "tagrenovering",
  "facaderenovering",
  "kontorrengøring",
  "messerengøring",
  "eventbureau",
  "konferencecenter",
  "hotel",
  "plejehjem",
  "børnehave",
  "fitnesscenter",
  "kontorhotel",
  "coworking",
];

const KBH_AREAS_DIR = ["københavn", "frederiksberg", "amager", "valby", "nørrebro", "østerbro", "vesterbro", "lyngby", "gentofte"];

export async function fetchDirectoryLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 4 søgetermer × 2 områder per dag = 8 søgninger
  const queries = [0, 1, 2, 3].map(
    (o) => DIRECTORY_QUERIES[(dayOfYear + o) % DIRECTORY_QUERIES.length]
  );
  const areas = [
    KBH_AREAS_DIR[dayOfYear % KBH_AREAS_DIR.length],
    KBH_AREAS_DIR[(dayOfYear + 1) % KBH_AREAS_DIR.length],
  ];

  for (const query of queries) {
    for (const area of areas) {
      if (results.length >= 30) break;

      // Kør Proff og Degulesider parallelt
      const [proff, dgs] = await Promise.allSettled([
        fetchProffLeads(query, area, seen),
        fetchDegulesiderLeads(query, area, seen),
      ]);

      if (proff.status === "fulfilled") results.push(...proff.value);
      if (dgs.status === "fulfilled") results.push(...dgs.value);

      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results.slice(0, 35);
}

// ── Proff.dk ──────────────────────────────────────────────────────────────────

async function fetchProffLeads(
  query: string,
  area: string,
  seen: Set<string>
): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  try {
    const url = `https://www.proff.dk/finn?query=${encodeURIComponent(query + " " + area)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

    if (!res.ok) return results;
    const html = await res.text();

    // Proff bruger strukturerede company-cards: navn + adresse + telefon
    const companies = parseProffHtml(html);

    for (const c of companies.slice(0, 5)) {
      const key = `proff-${c.name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        companyName: c.name,
        phone: c.phone,
        website: c.website,
        address: c.address,
        city: c.city || area,
        cvr: c.cvr,
        industry: c.industry || query,
        source: "Proff.dk",
        leadType: "company",
        serviceType: getServiceType(query),
        notes: `Fundet via Proff.dk søgning på "${query}" i ${area}. ${c.industry ? `Branche: ${c.industry}.` : ""} KrydsByg kan tilbyde fleksibel kapacitet i fagområdet.`,
      });
    }
  } catch {
    // Proff blokerer eller timeout
  }

  return results;
}

interface ParsedCompany {
  name: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  cvr?: string;
  industry?: string;
}

function parseProffHtml(html: string): ParsedCompany[] {
  const companies: ParsedCompany[] = [];

  // Proff har company cards med klassen 'company-result' eller link til /selskab/
  const cardPattern = /<a[^>]+href="\/selskab\/[^"]+"[^>]*>([^<]{3,80})<\/a>/gi;
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(html)) !== null && companies.length < 8) {
    const name = match[1].trim();
    if (name.length < 3 || seen.has(name)) continue;
    seen.add(name);

    // Find nærliggende telefon
    const startIdx = match.index;
    const slice = html.slice(startIdx, startIdx + 1500);
    const phone = extractPhone(slice);
    const cvr = extractCVR(slice);

    companies.push({ name, phone, cvr });
  }

  return companies;
}

// ── Degulesider.dk ────────────────────────────────────────────────────────────

async function fetchDegulesiderLeads(
  query: string,
  area: string,
  seen: Set<string>
): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  try {
    const url = `https://www.degulesider.dk/${encodeURIComponent(query)}/${encodeURIComponent(area)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

    if (!res.ok) return results;
    const html = await res.text();

    const companies = parseDegulesiderHtml(html);

    for (const c of companies.slice(0, 5)) {
      const key = `dgs-${c.name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        companyName: c.name,
        phone: c.phone,
        website: c.website,
        address: c.address,
        city: c.city || area,
        industry: query,
        source: "Degulesider.dk",
        leadType: "company",
        serviceType: getServiceType(query),
        notes: `Listet i Degulesider for "${query}" i ${area}. Etableret virksomhed med fysisk adresse — passende mål for KrydsByg's bemandingsservice.`,
      });
    }
  } catch {
    // Degulesider blokerer eller timeout
  }

  return results;
}

function parseDegulesiderHtml(html: string): ParsedCompany[] {
  const companies: ParsedCompany[] = [];

  // Degulesider har itemtype="LocalBusiness" microdata
  const businessPattern = /itemtype="https?:\/\/schema\.org\/LocalBusiness"[^>]*>[\s\S]*?<\/article>/gi;
  const businesses = html.match(businessPattern) || [];

  for (const block of businesses.slice(0, 8)) {
    const name = extractTagAttr(block, "itemprop=\"name\"") || extractFirstHeading(block);
    if (!name || name.length < 3) continue;

    const phone = extractTagAttr(block, "itemprop=\"telephone\"") || extractPhone(block);
    const website = extractTagAttr(block, "itemprop=\"url\"");
    const address = extractTagAttr(block, "itemprop=\"streetAddress\"");

    companies.push({ name, phone, website, address });
  }

  // Fallback: hvis ingen microdata-blokke, prøv simple mønstre
  if (companies.length === 0) {
    const linkPattern = /<a[^>]+href="\/firma\/[^"]+"[^>]*>([^<]{3,80})<\/a>/gi;
    const seen2 = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = linkPattern.exec(html)) !== null && companies.length < 8) {
      const name = m[1].trim();
      if (seen2.has(name) || name.length < 3) continue;
      seen2.add(name);

      const slice = html.slice(m.index, m.index + 1500);
      const phone = extractPhone(slice);
      companies.push({ name, phone });
    }
  }

  return companies;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractPhone(html: string): string | undefined {
  const m = html.match(/(?:\+45[\s\-]?)?\b\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}\b/);
  if (!m) return undefined;
  const cleaned = m[0].replace(/[\s\-]/g, "").replace(/^\+45/, "");
  if (cleaned.length !== 8) return undefined;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
}

function extractCVR(html: string): string | undefined {
  const m = html.match(/CVR[\s:]*(\d{8})/i);
  return m ? m[1] : undefined;
}

function extractTagAttr(html: string, prop: string): string | undefined {
  const idx = html.indexOf(prop);
  if (idx === -1) return undefined;
  // Find nærmeste content/textContent
  const after = html.slice(idx);
  const contentMatch = after.match(/content="([^"]+)"/);
  if (contentMatch) return contentMatch[1].trim();
  const textMatch = after.match(/>([^<]{2,200})</);
  return textMatch ? textMatch[1].trim() : undefined;
}

function extractFirstHeading(html: string): string | undefined {
  const m = html.match(/<h[1-3][^>]*>([^<]{3,100})<\/h[1-3]>/i);
  return m ? m[1].trim() : undefined;
}

function getServiceType(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("ejendom") || q.includes("vicevært") || q.includes("facility"))
    return "Malerarbejde + facility services";
  if (q.includes("bolig") || q.includes("andel"))
    return "Vedligehold + opgangsmaling";
  if (q.includes("hotel") || q.includes("plejehjem") || q.includes("børneh"))
    return "Rengøring + vedligehold";
  if (q.includes("event") || q.includes("konference"))
    return "Op- og nedrigning + rengøring";
  if (q.includes("rengør")) return "Rengøring & Oprydning";
  if (q.includes("byg") || q.includes("renover"))
    return "Byggepladsbehjælp + håndværk";
  return "Kombineret vedligehold";
}
