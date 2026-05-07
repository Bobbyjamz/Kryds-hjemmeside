/**
 * Jobnet.dk — Statens Jobbank
 *
 * Danmarks officielle jobportal med ~50.000 stillinger. Vi får TO output per
 * søgning: virksomheder der ansætter (= leads) + employee-leads (talent pool).
 *
 * API: Public Open Job Search API på workindenmark.dk's bagvedliggende AMS-tjeneste.
 * Gratis, ingen API-key.
 *
 * Endpoint:
 *   https://job.jobnet.dk/CV/FindWork/Search
 *
 * Søgeområde: Hovedstaden region.
 */

import type { LeadCandidate } from "../types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Søgetermer for KrydsByg's 9 fagområder
const TRADE_QUERIES = [
  "rengøring",
  "tømrer",
  "murer",
  "maler",
  "VVS",
  "elektriker",
  "gulvlægger",
  "flyttemand",
  "håndværker",
  "bygningsservice",
  "ejendomsservice",
  "vicevært",
  "anlægsgartner",
  "byggepladsmedhjælper",
  "lagermedhjælper",
];

interface JobnetJob {
  Title?: string;
  HiringOrgName?: string;
  WorkPlaceCity?: string;
  WorkPlacePostalCode?: string;
  PostingCreated?: string;
  Url?: string;
  ApplicationDeadline?: string;
}

interface JobnetResponse {
  JobPositionPostings?: JobnetJob[];
  TotalResultCount?: number;
}

export async function fetchJobnetLeads(
  dayOfYear: number
): Promise<{ companies: LeadCandidate[]; employees: LeadCandidate[] }> {
  // ⚠️ DEAKTIVERET: Jobnet er flyttet til STAR Login (kræver auth).
  // Det offentlige search-endpoint er væk. Vi henter employee-leads fra
  // Jobindex HTML-scraping i stedet — se employees.ts.
  if (process.env.JOBNET_ENABLED !== "true") {
    console.log("[jobnet] Skipped — flyttet til STAR Login (kræver auth)");
    return { companies: [], employees: [] };
  }

  const companies: LeadCandidate[] = [];
  const employees: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 10 søgetermer per dag (var 5)
  const queries = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    (o) => TRADE_QUERIES[(dayOfYear + o) % TRADE_QUERIES.length]
  );

  for (const query of queries) {
    const jobs = await fetchJobnetJobs(query);

    for (const job of jobs) {
      const company = job.HiringOrgName?.trim();
      const title = job.Title?.trim() || query;
      const city = job.WorkPlaceCity?.trim() || "Storkøbenhavn";

      // Firma-lead — virksomhed der rekrutterer = klart kapacitetsbehov
      if (company && companies.length < 60) {
        const cKey = `jobnet-c-${query}-${company}`.toLowerCase();
        if (!seen.has(cKey)) {
          seen.add(cKey);
          companies.push({
            companyName: company,
            industry: title,
            city,
            source: "Jobnet (Statens Jobbank)",
            leadType: "company",
            serviceType: getServiceType(query),
            notes: `Virksomhed slår op på Jobnet: "${title}" — aktivt kapacitetsbehov. KrydsByg kan tilbyde fleksibelt mandskab uden HR-besvær.`,
          });
        }
      }

      // Medarbejder-lead per stilling — talent pool signal
      if (employees.length < 120) {
        const eKey = `jobnet-e-${title}-${city}-${company || ""}`.toLowerCase();
        if (!seen.has(eKey)) {
          seen.add(eKey);
          employees.push({
            companyName: `Kandidat: ${title}${company ? ` (hos ${company})` : ""}`,
            contactTitle: title,
            city,
            source: "Jobnet (talent pool)",
            leadType: "employee",
            tradeCategory: getTradeCategory(query),
            serviceType: getServiceType(query),
            notes: `Aktivt jobopslag på Jobnet: "${title}"${company ? ` ved ${company}` : ""} i ${city}. Markedet bevæger sig — KrydsByg kan tilbyde alternativ vej (fleksible timer, varierede opgaver).`,
          });
        }
      }
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  return { companies, employees };
}

async function fetchJobnetJobs(query: string): Promise<JobnetJob[]> {
  const candidates = [
    `https://job.jobnet.dk/CV/FindWork/SearchAjax?Offset=0&SortValue=BestMatch&Region=H&SearchString=${encodeURIComponent(query)}`,
    `https://job.jobnet.dk/CV/FindWork/Search?SearchString=${encodeURIComponent(query)}&Region=H`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          "Accept": "application/json,text/html",
          "Accept-Language": "da,en;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json() as JobnetResponse;
        if (data.JobPositionPostings?.length) return data.JobPositionPostings.slice(0, 15);
      } else {
        // HTML fallback — parse jobtitler og firmanavne fra HTML
        const html = await res.text();
        const parsed = parseJobnetHtml(html);
        if (parsed.length > 0) return parsed.slice(0, 15);
      }
    } catch {
      // Prøv næste
    }
  }

  return [];
}

function parseJobnetHtml(html: string): JobnetJob[] {
  const jobs: JobnetJob[] = [];

  // Mønster: <h3>...title...</h3> efterfulgt af firma + by
  const titleMatches = html.matchAll(/<h3[^>]*>([^<]{5,150})<\/h3>/gi);
  const companyMatches = html.matchAll(/data-employer="([^"]{2,100})"/gi);

  const titles = [...titleMatches].map((m) => m[1].trim());
  const cos = [...companyMatches].map((m) => m[1].trim());

  for (let i = 0; i < Math.min(titles.length, 15); i++) {
    jobs.push({
      Title: titles[i],
      HiringOrgName: cos[i] || undefined,
      WorkPlaceCity: "Storkøbenhavn",
    });
  }

  return jobs;
}

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
