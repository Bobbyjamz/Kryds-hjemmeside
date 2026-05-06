import { fetchCVRLeads } from "./sources/cvr";
import { fetchGooglePlacesLeads } from "./sources/google-places";
import { fetchPrivateLeads } from "./sources/private";
import { fetchEmployeeLeads } from "./sources/employees";
import { fetchJobindexLeads } from "./sources/jobindex";
import { getIndustryWeights } from "./scoring";
import { generateNotes } from "./enrichment/note-generator";
import type { LeadCandidate } from "./types";

export interface RunResult {
  candidates: LeadCandidate[];
  bySource: Record<string, number>;
  byType: { company: number; private: number; employee: number };
  durationMs: number;
  industryWeightsApplied: number;
}

export async function runLeadFinder(): Promise<RunResult> {
  const start = Date.now();

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Hent industry-weights fra email-hukommelse
  const weights = await getIndustryWeights().catch(() => ({} as Record<string, number>));

  // ── Kør de tre pipelines parallelt ────────────────────────────────────────
  // Target: 30 company / 30 private / 30 employee
  const [
    cvrResults,
    googleResults,
    privateResults,
    employeeResults,
    jobindexResults,
  ] = await Promise.allSettled([
    fetchCVRLeads(dayOfYear, weights),
    fetchGooglePlacesLeads(dayOfYear),
    fetchPrivateLeads(dayOfYear),
    fetchEmployeeLeads(dayOfYear),
    fetchJobindexLeads(dayOfYear),
  ]);

  // Saml company-leads (CVR + Google + Jobindex = company-typen)
  // Employee-source returnerer både company- og employee-leads — split her
  const employeeSourceRaw =
    employeeResults.status === "fulfilled" ? employeeResults.value : [];
  const employeeSourceCompanies = employeeSourceRaw.filter((c) => c.leadType === "company");
  const employeeSourceEmployees = employeeSourceRaw.filter((c) => c.leadType === "employee");

  const companyRaw: LeadCandidate[] = [
    ...(cvrResults.status === "fulfilled" ? cvrResults.value : []),
    ...(googleResults.status === "fulfilled"
      ? googleResults.value.map((c) => ({ ...c, leadType: "company" as const }))
      : []),
    ...(jobindexResults.status === "fulfilled"
      ? jobindexResults.value.map((c) => ({ ...c, leadType: "company" as const }))
      : []),
    ...employeeSourceCompanies, // bonus company-leads fra rekrutteringssignaler
  ].slice(0, 40);

  const privateRaw: LeadCandidate[] =
    (privateResults.status === "fulfilled" ? privateResults.value : []).slice(0, 40);

  const employeeRaw: LeadCandidate[] = employeeSourceEmployees.slice(0, 40);

  // ── Generer AI-noter for alle leads (parallel batch) ──────────────────────
  // Vi kører note-generering kun for leads uden email (de trænger mest til en god note)
  // og for alle employee-leads (der er ikke CVR-data at falde tilbage på)
  const needsNote = [...companyRaw, ...privateRaw, ...employeeRaw].filter(
    (c) => !c.notes || c.notes.length < 80 || c.leadType === "employee"
  );

  if (needsNote.length > 0) {
    const notes = await generateNotes(needsNote).catch(() =>
      needsNote.map(() => "")
    );
    // Skriv noter tilbage på kandidaterne
    needsNote.forEach((c, i) => {
      if (notes[i]) c.notes = notes[i];
    });
  }

  const allCandidates = [...companyRaw, ...privateRaw, ...employeeRaw];

  // Statistik
  const bySource: Record<string, number> = {};
  for (const c of allCandidates) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
  }

  const byType = {
    company: companyRaw.length,
    private: privateRaw.length,
    employee: employeeRaw.length,
  };

  return {
    candidates: allCandidates,
    bySource,
    byType,
    durationMs: Date.now() - start,
    industryWeightsApplied: Object.keys(weights).length,
  };
}
