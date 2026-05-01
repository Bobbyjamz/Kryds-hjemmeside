import { fetchCVRLeads } from "./sources/cvr";
import { fetchGooglePlacesLeads } from "./sources/google-places";
import { fetchBoligsidenLeads } from "./sources/boligsiden";
import { fetchJobindexLeads } from "./sources/jobindex";
import type { LeadCandidate } from "./types";

export interface RunResult {
  candidates: LeadCandidate[];
  bySource: Record<string, number>;
  durationMs: number;
}

export async function runLeadFinder(): Promise<RunResult> {
  const start = Date.now();

  // Dag-index bruges til rotation af søgetermer
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Kør alle kilder parallelt (med timeout fallback)
  const [cvrResults, googleResults, boligsidenResults, jobindexResults] =
    await Promise.allSettled([
      fetchCVRLeads(dayOfYear),
      fetchGooglePlacesLeads(dayOfYear),
      fetchBoligsidenLeads(),
      fetchJobindexLeads(dayOfYear),
    ]);

  const allCandidates: LeadCandidate[] = [
    ...(cvrResults.status === "fulfilled" ? cvrResults.value : []),
    ...(googleResults.status === "fulfilled" ? googleResults.value : []),
    ...(boligsidenResults.status === "fulfilled" ? boligsidenResults.value : []),
    ...(jobindexResults.status === "fulfilled" ? jobindexResults.value : []),
  ];

  // Tæl per kilde til rapport
  const bySource: Record<string, number> = {};
  for (const c of allCandidates) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
  }

  return {
    candidates: allCandidates,
    bySource,
    durationMs: Date.now() - start,
  };
}
