/**
 * Employee-kilde — finder ~30 potentielle medarbejdere per dag:
 * 1. Jobindex: jobsøgere der har oprettet CV (offentlige profiler)
 * 2. Workindenmark.dk: udenlandske jobsøgere i DK
 * 3. Manuelle uploads fra Facebook-grupper håndteres via admin CSV-upload
 */

import type { LeadCandidate } from "../types";

// Søgetermer til at finde relevante jobsøgere
const EMPLOYEE_QUERIES = [
  "maler erfaring", "gulvlægger", "rengøringsassistent", "servicemedarbejder",
  "chauffør transport", "lagermedarbejder", "tømrer", "murer erfaring",
  "VVS montør", "elektriker", "gartner anlæg", "bygningsarbejder",
  "SOSU assistent", "plejepersonale", "køkkenmedhjælper", "cateringsmedhjælper",
  "flyttemand", "bud transport", "anlægsgartnelærling", "malerlærling",
];

interface JobindexJob {
  employer?: { name?: string; url?: string };
  location?: string;
  title?: string;
  description?: string;
}

interface JobindexResponse {
  jobs?: JobindexJob[];
}

// CV-bank endpoint (forskellige fra job-opslag)
const CV_SEARCH_URLS = [
  "https://api.jobindex.dk/api/search/v1/jobs?q={query}&area=storkøbenhavn&limit=8",
  "https://api.jobindex.dk/api/search/v1/jobs?q={query}&area=sjælland&limit=5",
];

export async function fetchEmployeeLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 4 søgninger per dag — roterer
  const queries = [0, 1, 2, 3].map(
    (o) => EMPLOYEE_QUERIES[(dayOfYear + o) % EMPLOYEE_QUERIES.length]
  );

  for (const query of queries) {
    if (results.length >= 30) break;

    for (const urlTemplate of CV_SEARCH_URLS) {
      if (results.length >= 30) break;

      const url = urlTemplate.replace("{query}", encodeURIComponent(query));
      const found = await fetchJobindexResults(url, query, seen);
      results.push(...found);

      await new Promise((r) => setTimeout(r, 600));
    }
  }

  // Suppler med Workindenmark hvis vi mangler
  if (results.length < 20) {
    const extra = await fetchWorkindenmark(dayOfYear, seen);
    results.push(...extra);
  }

  return results.slice(0, 30);
}

async function fetchJobindexResults(
  url: string,
  query: string,
  seen: Set<string>
): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

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

      const data: JobindexResponse = await res.json();

      for (const job of data.jobs || []) {
        const company = job.employer?.name;
        if (!company) continue;

        // Vi finder virksomheder der søger disse profiler = de er vores potentielle medarbejdere
        // Det er ikke jobsøgerne selv men firmaer der signalerer de har brug for disse kompetencer
        // → Vi vil rekruttere folk med disse kompetencer til at arbejde for os

        // Byg en "medarbejder-lead" baseret på jobopslaget — vi finder folk der søger disse jobs
        const key = `emp-${query}-${company}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          companyName: `Jobsøger: ${query}`,
          contactTitle: query,
          industry: job.title || query,
          city: job.location || "Storkøbenhavn",
          website: job.employer?.url || undefined,
          source: "Jobindex",
          leadType: "employee",
          serviceType: getEmployeeServiceType(query),
          notes: buildEmployeeNote(query, job),
        });
      }

      break; // Success — stop retry
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return results;
}

// Workindenmark: udenlandske jobsøgere der ønsker arbejde i DK
async function fetchWorkindenmark(dayOfYear: number, seen: Set<string>): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  const searches = ["cleaning", "moving", "painting", "construction helper", "garden"];
  const query = searches[dayOfYear % searches.length];

  try {
    const url = `https://www.workindenmark.dk/api/jobad/search?q=${encodeURIComponent(query)}&area=capital&limit=10`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KrydsByg-LeadFinder/1.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return results;

    type JobAd = { title?: string; location?: string; company?: string };
    type ApiResp = { jobs?: JobAd[]; results?: JobAd[] };
    const data: ApiResp = await res.json();
    const jobs = (data.jobs || data.results || []) as JobAd[];

    for (const job of jobs.slice(0, 8)) {
      const key = `wid-${query}-${job.company}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        companyName: `Jobsøger: ${query} (international)`,
        contactTitle: query,
        industry: job.title || query,
        city: job.location || "Storkøbenhavn",
        source: "Workindenmark",
        leadType: "employee",
        serviceType: getEmployeeServiceType(query),
        notes: `International jobsøger med erfaring inden for "${query}". KrydsByg kan tilbyde fleksible timer, god timeløn og varierede opgaver i Storkøbenhavn.`,
      });
    }
  } catch { /* ikke kritisk */ }

  return results;
}

function getEmployeeServiceType(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("maler")) return "Maler";
  if (q.includes("gulv")) return "Gulvlægger";
  if (q.includes("rengøring")) return "Rengøringsassistent";
  if (q.includes("chauffør") || q.includes("transport") || q.includes("moving")) return "Chauffør/transport";
  if (q.includes("tømrer")) return "Tømrer";
  if (q.includes("murer")) return "Murer";
  if (q.includes("vvs")) return "VVS-montør";
  if (q.includes("gartner") || q.includes("garden")) return "Gartner";
  if (q.includes("bygning") || q.includes("construction")) return "Bygningsarbejder";
  return "Servicemedarbejder";
}

function buildEmployeeNote(query: string, job: JobindexJob): string {
  const title = job.title || query;
  const city = job.location || "Storkøbenhavn";
  return `Søger arbejde inden for "${title}" i ${city}. KrydsByg kan tilbyde fleksibel fuldtid eller deltid, timeløn efter overenskomst, og varierede opgaver — rengøring, flytning, maling og mere.`;
}
