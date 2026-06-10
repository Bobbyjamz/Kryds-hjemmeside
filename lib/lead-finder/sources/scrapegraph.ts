/**
 * ScrapeGraphAI-kilde - AI-drevet scraping via ekstern Python-proxy.
 *
 * Loeser de 3 doede scrapers (Stepstone, Degulesider/Proff, Jobnet). I stedet for
 * regex der knaekker naar sider redesignes, kalder vi en ScrapeGraphAI-microservice
 * (se /scrape-proxy) der forstaar HTML semantisk via en LLM.
 *
 * AKTIVERING (alt skal vaere sat, ellers returneres [] - bygget forbliver groent):
 *   SCRAPEGRAPH_ENABLED=true
 *   SCRAPEGRAPH_PROXY_URL=https://...railway.app
 *   SCRAPE_PROXY_SECRET=<samme som proxyen>
 *
 * Brain Layer kan sende egne `dynamicScrapeTargets` (vilkaarlige URLs). Uden dem
 * koerer vi en kurateret default-liste der genopliver praecis de kilder der gik i
 * stykker.
 */

import type { LeadCandidate, ScrapeTarget } from "../types";
import { titelTilFaggruppe } from "../filters/filter-config";

const PROXY_URL = process.env.SCRAPEGRAPH_PROXY_URL || "";
const PROXY_SECRET = process.env.SCRAPE_PROXY_SECRET || "";

// Bound LLM-omkostning: max antal proxy-kald per koerse (hvert kald = 1 LLM-kald)
const MAX_TARGETS = 4;

// Roterende fag-soegninger (samme 9 fag som resten af systemet)
const TRADE_QUERIES = ["toemrer", "murer", "vvs", "elektriker", "maler", "gulvlaegger", "stillads"];

interface ProxyItem {
  title?: string;
  company?: string;
  city?: string;
}

interface ProxyResponse {
  ok: boolean;
  items: ProxyItem[];
  error?: string;
}

/**
 * Hovedindgang. `dynamicTargets` kommer fra Brain Layer (valgfri) - ellers
 * bruges kuraterede defaults.
 */
export async function fetchScrapeGraphLeads(
  dayOfYear: number,
  dynamicTargets?: ScrapeTarget[],
): Promise<LeadCandidate[]> {
  if (process.env.SCRAPEGRAPH_ENABLED !== "true") {
    console.log("[scrapegraph] Skipped - SCRAPEGRAPH_ENABLED ikke sat");
    return [];
  }
  if (!PROXY_URL || !PROXY_SECRET) {
    console.log("[scrapegraph] Skipped - PROXY_URL eller SECRET mangler");
    return [];
  }

  const targets = (dynamicTargets && dynamicTargets.length > 0)
    ? dynamicTargets.slice(0, MAX_TARGETS)
    : defaultTargets(dayOfYear);

  const results = await Promise.allSettled(targets.map((t) => scrapeTarget(t)));

  const leads: LeadCandidate[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") leads.push(...r.value);
  }
  console.log(`[scrapegraph] ${targets.length} targets -> ${leads.length} leads`);
  return leads;
}

// -- Kuraterede default-targets (genopliver de doede kilder) -----------------

function defaultTargets(dayOfYear: number): ScrapeTarget[] {
  const t1 = TRADE_QUERIES[dayOfYear % TRADE_QUERIES.length];
  const t2 = TRADE_QUERIES[(dayOfYear + 1) % TRADE_QUERIES.length];

  return [
    // Talent pool (medarbejdere - hoejeste prioritet)
    {
      url: `https://www.stepstone.dk/jobs/${t1}/i-koebenhavn`,
      prompt: `Udtraek alle jobopslag paa siden: jobtitel (title), firmanavn (company), by (city)`,
      leadType: "employee",
      source: "Stepstone.dk (ScrapeGraphAI)",
    },
    {
      url: `https://www.stepstone.dk/jobs/${t2}/i-koebenhavn`,
      prompt: `Udtraek alle jobopslag paa siden: jobtitel (title), firmanavn (company), by (city)`,
      leadType: "employee",
      source: "Stepstone.dk (ScrapeGraphAI)",
    },
    // Virksomheder
    {
      url: `https://www.degulesider.dk/${t1}/koebenhavn`,
      prompt: `Udtraek alle virksomheder paa siden: firmanavn (company), by (city)`,
      leadType: "company",
      source: "Degulesider.dk (ScrapeGraphAI)",
    },
  ];
}

// -- Enkelt target -> proxy-kald -> LeadCandidate[] --------------------------

async function scrapeTarget(target: ScrapeTarget): Promise<LeadCandidate[]> {
  let res: Response;
  try {
    res = await fetch(`${PROXY_URL.replace(/\/$/, "")}/scrape`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-proxy-secret": PROXY_SECRET },
      body: JSON.stringify({ url: target.url, prompt: target.prompt, max_results: 15 }),
      signal: AbortSignal.timeout(45_000), // LLM-scrape tager tid
    });
  } catch (err) {
    console.warn(`[scrapegraph] target fejlede (${target.url}):`, err instanceof Error ? err.message : err);
    return [];
  }

  if (!res.ok) {
    console.warn(`[scrapegraph] proxy svarede ${res.status} for ${target.url}`);
    return [];
  }

  const data = (await res.json()) as ProxyResponse;
  if (!data.ok || !Array.isArray(data.items)) return [];

  const seen = new Set<string>();
  const leads: LeadCandidate[] = [];

  for (const item of data.items) {
    const title = (item.title || "").trim();
    const company = (item.company || "").trim();
    const city = (item.city || "Koebenhavn").trim();

    if (target.leadType === "employee") {
      if (!title) continue;
      const key = `e-${title}-${company}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      leads.push({
        companyName: `Kandidat: ${title}${company ? ` (hos ${company})` : ""}`,
        contactTitle: title,
        city,
        source: target.source,
        leadType: "employee",
        tradeCategory: titelTilFaggruppe(title) || undefined,
        notes: `Aktivt opslag fundet via AI-scraping: "${title}"${company ? ` ved ${company}` : ""} i ${city}. KrydsByg kan tilbyde fleksibelt arbejde.`,
      });
    } else {
      const name = company || title;
      if (!name) continue;
      const key = `c-${name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      leads.push({
        companyName: name,
        city,
        source: target.source,
        leadType: "company",
        notes: `Virksomhed fundet via AI-scraping i ${city}. KrydsByg kan tilbyde fleksibel kapacitet uden HR-byrde.`,
      });
    }
  }

  return leads;
}
