/**
 * Employee-kilde — finder ~30 leads per dag:
 * 1. Jobindex job-opslag: TO resultater per opslag:
 *    a) Firma-lead: virksomheden der ansætter (= potentiel KrydsByg-kunde)
 *    b) Medarbejder-lead: én per søgetype (= der er aktive kandidater i dette fag)
 * 2. Workindenmark.dk: internationale jobsøgere i DK (employee-leads)
 */

import type { LeadCandidate } from "../types";

const EMPLOYEE_QUERIES = [
  "maler erfaring", "gulvlægger", "rengøringsassistent", "servicemedarbejder",
  "chauffør transport", "lagermedarbejder", "tømrer", "murer erfaring",
  "VVS montør", "elektriker", "gartner anlæg", "bygningsarbejder",
  "flyttemand", "bud transport", "anlægsgartner", "malerlærling",
  "rengøringshjælper", "bygningsservice medhjælper",
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
  "https://api.jobindex.dk/api/search/v1/jobs?q={query}&area=storkøbenhavn&limit=8",
  "https://api.jobindex.dk/api/search/v1/jobs?q={query}&area=sjælland&limit=5",
];

export async function fetchEmployeeLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const companyResults: LeadCandidate[] = [];
  const employeeResults: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 4 søgninger per dag — roterer
  const queries = [0, 1, 2, 3].map(
    (o) => EMPLOYEE_QUERIES[(dayOfYear + o) % EMPLOYEE_QUERIES.length]
  );

  for (const query of queries) {
    for (const urlTemplate of CV_SEARCH_URLS) {
      const url = urlTemplate.replace("{query}", encodeURIComponent(query));
      const { companies, employeeLead } = await fetchJobindexResults(url, query, seen);
      companyResults.push(...companies);

      // Ét medarbejder-lead per søgetype (talent pool signal)
      if (employeeLead && !seen.has(`emp-pool-${query}`)) {
        seen.add(`emp-pool-${query}`);
        employeeResults.push(employeeLead);
      }

      await new Promise((r) => setTimeout(r, 600));
    }
  }

  // Suppler medarbejder-leads med Workindenmark
  if (employeeResults.length < 8) {
    const extra = await fetchWorkindenmark(dayOfYear, seen);
    employeeResults.push(...extra);
  }

  // Kombiner: prioritér virksomheder, men sørg for at medarbejdere er med
  return [...companyResults.slice(0, 20), ...employeeResults.slice(0, 10)];
}

async function fetchJobindexResults(
  url: string,
  query: string,
  seen: Set<string>
): Promise<{ companies: LeadCandidate[]; employeeLead: LeadCandidate | null }> {
  const companies: LeadCandidate[] = [];
  let employeeLead: LeadCandidate | null = null;
  let jobCount = 0;

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
        jobCount++;

        // ── Firma-lead: virksomhed der rekrutterer = kapacitetsbehov ──
        if (company) {
          const key = `company-${query}-${company}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            companies.push({
              companyName: company,
              industry: job.title || query,
              city: job.location || "Storkøbenhavn",
              website: job.employer?.url || undefined,
              source: "Jobindex (rekrutteringssignal)",
              leadType: "company",
              serviceType: getServiceType(query),
              notes: `Virksomhed der ansætter "${job.title || query}" — signalerer kapacitetsbehov. KrydsByg kan supplere med fleksible hold og spare dem for fast ansættelse.`,
            });
          }
        }
      }

      // ── Medarbejder-lead: talent pool-signal baseret på søgetype ──
      if (jobCount > 0 && !employeeLead) {
        employeeLead = {
          companyName: `Kandidat søges: ${capitalise(query)}`,
          contactTitle: query,
          city: "Storkøbenhavn",
          source: "Jobindex (talent pool)",
          leadType: "employee",
          serviceType: getServiceType(query),
          notes: `${jobCount} aktive stillingsopslag inden for "${query}" i Storkøbenhavn. Der er kandidater i markedet — god mulighed for rekruttering til KrydsByg's hold.`,
        };
      }

      break;
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return { companies, employeeLead };
}

// Workindenmark: udenlandske jobsøgere der ønsker arbejde i DK
async function fetchWorkindenmark(dayOfYear: number, seen: Set<string>): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  const searches = [
    { q: "cleaning", label: "Rengøringshjælper (international)" },
    { q: "moving", label: "Flyttemand (international)" },
    { q: "painting", label: "Malerlærling (international)" },
    { q: "construction helper", label: "Bygningsmedhjælper (international)" },
    { q: "garden", label: "Gartnermedhjælper (international)" },
  ];
  const { q, label } = searches[dayOfYear % searches.length];

  try {
    const url = `https://www.workindenmark.dk/api/jobad/search?q=${encodeURIComponent(q)}&area=capital&limit=10`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KrydsByg-LeadFinder/1.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return results;

    type JobAd = { title?: string; location?: string; company?: string };
    type ApiResp = { jobs?: JobAd[]; results?: JobAd[] };
    const data: ApiResp = await res.json();
    const jobs = (data.jobs || data.results || []) as JobAd[];

    let count = 0;
    for (const job of jobs.slice(0, 6)) {
      const key = `wid-${q}-${job.company || count++}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        companyName: label,
        contactTitle: job.title || q,
        city: job.location || "Storkøbenhavn",
        source: "Workindenmark",
        leadType: "employee",
        serviceType: getServiceType(q),
        notes: `International jobsøger med erfaring inden for "${q}". Søger arbejde i ${job.location || "Storkøbenhavn"}. KrydsByg kan tilbyde fleksible timer, god timeløn og varierede opgaver.`,
      });
    }
  } catch { /* ikke kritisk */ }

  return results;
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
  return "Kombineret vedligehold";
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
