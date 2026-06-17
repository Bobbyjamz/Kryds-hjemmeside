/**
 * Employee-kilde — finder 30+ leads per dag:
 * 1. Jobindex job-opslag: TO resultater per opslag:
 *    a) Firma-lead: virksomheden der ansætter (= potentiel KrydsByg-kunde)
 *    b) Medarbejder-lead: én per JOB-opslag (talent-pool inkl. titel + lokation)
 * 2. Workindenmark.dk: internationale jobsøgere i DK (employee-leads)
 */

import type { LeadCandidate } from "../types";
import { titelTilFaggruppe } from "../filters/filter-config";

const EMPLOYEE_QUERIES = [
  "maler erfaring", "gulvlægger", "rengøringsassistent", "servicemedarbejder",
  "chauffør transport", "lagermedarbejder", "tømrer", "murer erfaring",
  "VVS montør", "elektriker", "gartner anlæg", "bygningsarbejder",
  "flyttemand", "bud transport", "anlægsgartner", "malerlærling",
  "rengøringshjælper", "bygningsservice medhjælper",
  "håndværker deltid", "byggepladsmedhjælper", "vicevært medhjælper",
  "rengøring weekend", "lagermedhjælper deltid", "rengøringsleder",
  "ejendomsservicemedarbejder", "facility medarbejder", "spartling lærling",
  "tømrermedhjælper", "murermedhjælper", "byggehjælper",
];

interface JobindexJob {
  employer?: { name?: string; url?: string };
  location?: string;
  title?: string;
}

interface JobindexResponse {
  jobs?: JobindexJob[];
}

const CV_SEARCH_URLS = [
  "https://www.jobindex.dk/jobsoegning?q={query}&format=rss",
];

export async function fetchEmployeeLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const companyResults: LeadCandidate[] = [];
  const employeeResults: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 12 søgninger per dag — roterer (var 6)
  const queries = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(
    (o) => EMPLOYEE_QUERIES[(dayOfYear + o) % EMPLOYEE_QUERIES.length]
  );

  for (const query of queries) {
    for (const urlTemplate of CV_SEARCH_URLS) {
      const url = urlTemplate.replace("{query}", encodeURIComponent(query));
      const { companies, employees } = await fetchJobindexResults(url, query, seen);
      companyResults.push(...companies);
      employeeResults.push(...employees);

      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Suppler altid med Workindenmark — internationale kandidater
  const wid = await fetchWorkindenmark(dayOfYear, seen);
  employeeResults.push(...wid);

  // Returner generøst — runner slicer til de endelige tal selv
  return [...companyResults.slice(0, 80), ...employeeResults.slice(0, 120)];
}

async function fetchJobindexResults(
  url: string,
  query: string,
  seen: Set<string>
): Promise<{ companies: LeadCandidate[]; employees: LeadCandidate[] }> {
  const companies: LeadCandidate[] = [];
  const employees: LeadCandidate[] = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "KrydsByg-LeadFinder/1.0 (kontakt@krydsbyg.com)",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      if (!res.ok) break;

      const xmlText = await res.text();
      const data: JobindexResponse = { jobs: parseJobindexRss(xmlText) };

      for (const job of data.jobs || []) {
        const company = job.employer?.name;
        const title = job.title || query;
        const location = job.location || "Storkøbenhavn";

        // ── Firma-lead: virksomhed der rekrutterer = kapacitetsbehov ──
        if (company) {
          const cKey = `company-${query}-${company}`.toLowerCase();
          if (!seen.has(cKey)) {
            seen.add(cKey);
            companies.push({
              companyName: company,
              industry: title,
              city: location,
              website: job.employer?.url || undefined,
              source: "Jobindex (rekrutteringssignal)",
              leadType: "company",
              serviceType: getServiceType(query),
              notes: `Virksomhed der ansætter "${title}" — signalerer kapacitetsbehov. KrydsByg kan supplere med fleksible hold og spare dem for fast ansættelse.`,
            });
          }
        }

        // ── Medarbejder-lead PER jobopslag (én per job, ikke per søgning) ──
        const eKey = `emp-${title}-${location}-${company || ""}`.toLowerCase();
        if (!seen.has(eKey)) {
          seen.add(eKey);
          employees.push({
            companyName: `Kandidat: ${title}${company ? ` (hos ${company})` : ""}`,
            contactTitle: title,
            city: location,
            source: "Jobindex (talent pool)",
            leadType: "employee",
            tradeCategory: titelTilFaggruppe(title) ?? titelTilFaggruppe(query) ?? undefined,
            serviceType: getServiceType(query),
            notes: `Aktivt jobopslag: "${title}"${company ? ` ved ${company}` : ""} i ${location}. Marked har kandidater i bevægelse — KrydsByg kan tilbyde alternativ vej (fleksible timer, varierede opgaver).`,
          });
        }
      }

      break;
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return { companies, employees };
}

// Workindenmark: udenlandske jobsøgere der ønsker arbejde i DK
async function fetchWorkindenmark(dayOfYear: number, seen: Set<string>): Promise<LeadCandidate[]> {
  // ⚠️ DEAKTIVERET: Workindenmark API-endpoint er væk (returnerer tom respons).
  // Sæt WORKINDENMARK_ENABLED=true hvis vi skal prøve igen efter rebuild.
  if (process.env.WORKINDENMARK_ENABLED !== "true") {
    return [];
  }

  const results: LeadCandidate[] = [];

  const searches = [
    { q: "cleaning", label: "Rengøringshjælper (international)" },
    { q: "moving", label: "Flyttemand (international)" },
    { q: "painting", label: "Malerlærling (international)" },
    { q: "construction helper", label: "Bygningsmedhjælper (international)" },
    { q: "garden", label: "Gartnermedhjælper (international)" },
    { q: "warehouse", label: "Lagermedhjælper (international)" },
    { q: "kitchen helper", label: "Køkkenhjælper (international)" },
  ];

  // Kør 6 forskellige søgninger per dag (var 3)
  const todaySearches = [0, 1, 2, 3, 4, 5].map((o) => searches[(dayOfYear + o) % searches.length]);

  for (const { q, label } of todaySearches) {
    try {
      const url = `https://www.workindenmark.dk/api/jobad/search?q=${encodeURIComponent(q)}&area=capital&limit=20`;
      const res = await fetch(url, {
        headers: { "User-Agent": "KrydsByg-LeadFinder/1.0", "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      type JobAd = { title?: string; location?: string; company?: string };
      type ApiResp = { jobs?: JobAd[]; results?: JobAd[] };
      const data: ApiResp = await res.json();
      const jobs = (data.jobs || data.results || []) as JobAd[];

      let count = 0;
      for (const job of jobs.slice(0, 20)) {
        const key = `wid-${q}-${job.title || ""}-${job.location || ""}-${count++}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          companyName: label,
          contactTitle: job.title || q,
          city: job.location || "Storkøbenhavn",
          source: "Workindenmark",
          leadType: "employee",
          tradeCategory: getTradeFromQuery(q),
          serviceType: getServiceType(q),
          notes: `International jobsøger med erfaring inden for "${q}"${job.title ? ` (søger ${job.title})` : ""}. Søger arbejde i ${job.location || "Storkøbenhavn"}. KrydsByg kan tilbyde fleksible timer, god timeløn og varierede opgaver.`,
        });
      }

      await new Promise((r) => setTimeout(r, 400));
    } catch { /* ikke kritisk */ }
  }

  return results;
}

function getTradeFromQuery(q: string): string {
  const query = q.toLowerCase();
  if (query.includes("paint") || query.includes("maler")) return "Maler";
  if (query.includes("clean") || query.includes("rengør")) return "Rengøring";
  if (query.includes("moving") || query.includes("flytt")) return "Flytning";
  if (query.includes("construction") || query.includes("bygg")) return "Byggepladsbehjælp";
  if (query.includes("garden") || query.includes("gartner")) return "Anlægsgartner";
  if (query.includes("warehouse") || query.includes("lager")) return "Lager";
  if (query.includes("kitchen") || query.includes("køkken")) return "Køkken";
  if (query.includes("tømrer") || query.includes("carpenter")) return "Tømrer";
  if (query.includes("murer")) return "Murer";
  if (query.includes("vvs") || query.includes("plumb")) return "VVS";
  if (query.includes("electr") || query.includes("elektri")) return "Elektriker";
  return "Håndværk (alm.)";
}

function getServiceType(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("maler") || q.includes("paint")) return "Maling & Spartling";
  if (q.includes("gulv")) return "Gulvlægning";
  if (q.includes("rengøring") || q.includes("clean")) return "Rengøring & Oprydning";
  if (q.includes("chauffør") || q.includes("transport") || q.includes("moving")) return "Flytning & Transport";
  if (q.includes("tømrer")) return "Tømrerarbejde";
  if (q.includes("murer")) return "Murerarbejde";
  if (q.includes("vvs")) return "VVS";
  if (q.includes("gartner") || q.includes("garden")) return "Have & Anlæg";
  if (q.includes("bygning") || q.includes("construction")) return "Byggepladsbehjælp";
  if (q.includes("flyt")) return "Flytning & Transport";
  if (q.includes("warehouse") || q.includes("lager")) return "Logistik & Lager";
  if (q.includes("kitchen") || q.includes("køkken")) return "Rengøring & Oprydning";
  return "Kombineret vedligehold";
}

// -- Jobindex RSS-parser (API doede -> bruger det offentlige RSS-feed) --------
function parseJobindexRss(xml: string): JobindexJob[] {
  const jobs: JobindexJob[] = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const item of items) {
    const rawTitle = (item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
    const title = decodeEntities(stripCdata(rawTitle)).trim();
    if (!title) continue;
    // Firmanavn staar typisk efter sidste komma eller tankestreg i RSS-titlen
    let jobTitle = title;
    let company: string | undefined;
    const sep = Math.max(title.lastIndexOf(", "), title.lastIndexOf(" – "), title.lastIndexOf(" - "));
    if (sep > 0) {
      const after = title.slice(sep).replace(/^[,\s–-]+/, "").trim();
      if (after.length >= 2 && after.length <= 60) {
        company = after;
        jobTitle = title.slice(0, sep).trim();
      }
    }
    jobs.push({ title: jobTitle, employer: company ? { name: company } : undefined, location: "Storkøbenhavn" });
  }
  return jobs;
}

function stripCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : s;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&aelig;/gi, "æ").replace(/&oslash;/gi, "ø").replace(/&aring;/gi, "å");
}
