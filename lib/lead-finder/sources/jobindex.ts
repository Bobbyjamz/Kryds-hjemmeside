import type { LeadCandidate } from "../types";

// Jobindex: firmaer der søger facility/driftsfolk har tydeligvis vedligeholdelsesbehov

interface JobindexJob {
  employer?: { name?: string; url?: string };
  location?: string;
  title?: string;
}

interface JobindexResponse {
  jobs?: JobindexJob[];
}

const JOBINDEX_QUERIES = [
  "facility manager",
  "driftschef ejendom",
  "ejendomsinspektør",
  "vicevært",
  "servicetekniker bygning",
  "driftsleder ejendom",
  "ejendomsservice",
];

export async function fetchJobindexLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seenCompanies = new Set<string>();

  // 4 søgninger per dag (var 2)
  const queries = [0, 1, 2, 3].map((o) => JOBINDEX_QUERIES[(dayOfYear + o) % JOBINDEX_QUERIES.length]);

  for (const query of queries) {
    try {
      const url =
        `https://api.jobindex.dk/api/search/v1/jobs` +
        `?q=${encodeURIComponent(query)}&area=storkøbenhavn&limit=25`;

      const res = await fetch(url, {
        headers: { "User-Agent": "KrydsByg-LeadFinder/1.0" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;
      const data: JobindexResponse = await res.json();

      for (const job of data.jobs || []) {
        const company = job.employer?.name;
        if (!company || seenCompanies.has(company)) continue;
        seenCompanies.add(company);

        results.push({
          companyName: company,
          website: job.employer?.url || undefined,
          city: job.location || "Storkøbenhavn",
          source: "Jobindex",
          leadType: "company",
          serviceType: "Facility / vedligehold",
          notes: `Søger "${job.title}" — har aktivt vedligeholdelsesbehov`,
        });
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch {
      continue;
    }
  }

  return results;
}
