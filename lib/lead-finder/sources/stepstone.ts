/**
 * Stepstone.dk — gratis dansk jobportal
 *
 * Public søgning udstiller jobopslag som vi kan bruge til at finde:
 *  1. Virksomheder der ansætter (= kapacitetsbehov = potentielle KrydsByg-kunder)
 *  2. Per-job kandidat-leads (talent pool — markedet er i bevægelse)
 *
 * Ingen API-key, gratis. Vi parser HTML fra deres søgeresultater.
 */

import type { LeadCandidate } from "../types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const STEPSTONE_QUERIES = [
  "rengøring", "tømrer", "murer", "maler", "VVS", "elektriker",
  "gulvlægger", "håndværker", "byggeplads", "lagermedarbejder",
  "vicevært", "ejendomsservice", "anlægsgartner", "flyttemand",
  "servicemedarbejder", "bygningsservice",
];

interface StepstoneJob {
  title: string;
  company?: string;
  location?: string;
}

export async function fetchStepstoneLeads(
  dayOfYear: number
): Promise<{ companies: LeadCandidate[]; employees: LeadCandidate[] }> {
  const companies: LeadCandidate[] = [];
  const employees: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 6 søgetermer per dag
  const queries = [0, 1, 2, 3, 4, 5].map(
    (o) => STEPSTONE_QUERIES[(dayOfYear + o) % STEPSTONE_QUERIES.length]
  );

  for (const query of queries) {
    if (companies.length >= 30 && employees.length >= 60) break;

    try {
      const url = `https://www.stepstone.dk/jobs/${encodeURIComponent(query)}/i-københavn`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept": "text/html" },
        signal: AbortSignal.timeout(8000),
        redirect: "follow",
      });

      if (!res.ok) continue;
      const html = await res.text();
      const jobs = parseStepstoneHtml(html);

      for (const job of jobs.slice(0, 10)) {
        const title = job.title;
        const company = job.company;
        const city = job.location || "København";

        // Firma-lead
        if (company && companies.length < 30) {
          const cKey = `ss-c-${query}-${company}`.toLowerCase();
          if (!seen.has(cKey)) {
            seen.add(cKey);
            companies.push({
              companyName: company,
              industry: title,
              city,
              source: "Stepstone.dk (rekrutterer)",
              leadType: "company",
              serviceType: getServiceType(query),
              notes: `Virksomhed søger "${title}" på Stepstone — aktivt kapacitetsbehov. KrydsByg kan tilbyde fleksibelt hold uden HR-byrde.`,
            });
          }
        }

        // Medarbejder-lead
        if (employees.length < 60) {
          const eKey = `ss-e-${title}-${city}-${company || ""}`.toLowerCase();
          if (!seen.has(eKey)) {
            seen.add(eKey);
            employees.push({
              companyName: `Kandidat: ${title}${company ? ` (hos ${company})` : ""}`,
              contactTitle: title,
              city,
              source: "Stepstone.dk (talent pool)",
              leadType: "employee",
              tradeCategory: getTradeCategory(query),
              serviceType: getServiceType(query),
              notes: `Aktivt opslag på Stepstone: "${title}"${company ? ` ved ${company}` : ""} i ${city}. KrydsByg kan tilbyde alternativ vej (fleksible timer, varierede opgaver).`,
            });
          }
        }
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch {
      // Stepstone blokerer eller timeout — fortsæt
    }
  }

  return { companies, employees };
}

// ── HTML-parser ──────────────────────────────────────────────────────────

function parseStepstoneHtml(html: string): StepstoneJob[] {
  const jobs: StepstoneJob[] = [];

  // Stepstone bruger article-elementer med data-test attributter
  // Mønster: data-at="job-item-title" → titel, data-at="job-item-company-name" → firma
  const titlePattern = /data-at="job-item-title"[^>]*>([^<]{3,150})</gi;
  const companyPattern = /data-at="job-item-company-name"[^>]*>([^<]{2,100})</gi;
  const locationPattern = /data-at="job-item-location"[^>]*>([^<]{2,80})</gi;

  const titles = [...html.matchAll(titlePattern)].map((m) => m[1].trim());
  const companies = [...html.matchAll(companyPattern)].map((m) => m[1].trim());
  const locations = [...html.matchAll(locationPattern)].map((m) => m[1].trim());

  for (let i = 0; i < Math.min(titles.length, 15); i++) {
    jobs.push({
      title: titles[i],
      company: companies[i] || undefined,
      location: locations[i] || undefined,
    });
  }

  // Fallback: hvis ovenstående mønstre ikke matcher, prøv simple H2/H3 + nærliggende firma
  if (jobs.length === 0) {
    const headingPattern = /<h[2-3][^>]*>([^<]{5,150})<\/h[2-3]>/gi;
    let m: RegExpExecArray | null;
    while ((m = headingPattern.exec(html)) !== null && jobs.length < 12) {
      const title = m[1].trim();
      if (title.length < 5) continue;
      jobs.push({ title });
    }
  }

  return jobs;
}

// ── Helpers (identiske med jobnet.ts) ────────────────────────────────────

function getServiceType(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("maler")) return "Maling & Spartling";
  if (q.includes("gulv")) return "Gulvlægning";
  if (q.includes("rengøring")) return "Rengøring & Oprydning";
  if (q.includes("flytt")) return "Flytning & Transport";
  if (q.includes("tømrer")) return "Tømrerarbejde";
  if (q.includes("murer")) return "Murerarbejde";
  if (q.includes("vvs")) return "VVS";
  if (q.includes("gartner") || q.includes("anlæg")) return "Have & Anlæg";
  if (q.includes("byggep") || q.includes("bygningsservice")) return "Byggepladsbehjælp";
  if (q.includes("lager")) return "Logistik & Lager";
  if (q.includes("vicevært") || q.includes("ejendoms")) return "Ejendomsservice";
  return "Kombineret vedligehold";
}

function getTradeCategory(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("tømrer")) return "Tømrer";
  if (q.includes("murer")) return "Murer";
  if (q.includes("maler")) return "Maler";
  if (q.includes("vvs")) return "VVS";
  if (q.includes("elektri")) return "Elektriker";
  if (q.includes("gulv")) return "Gulvlægger";
  if (q.includes("rengør")) return "Rengøring";
  if (q.includes("flytt")) return "Flytning";
  if (q.includes("gartner")) return "Anlægsgartner";
  return "Håndværk (alm.)";
}
