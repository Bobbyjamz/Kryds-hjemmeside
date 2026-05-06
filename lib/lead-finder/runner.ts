import { fetchCVRLeads } from "./sources/cvr";
import { fetchGooglePlacesLeads } from "./sources/google-places";
import { fetchPrivateLeads } from "./sources/private";
import { fetchEmployeeLeads } from "./sources/employees";
import { fetchJobindexLeads } from "./sources/jobindex";
import { fetchOISLeads } from "./sources/ois";
import { fetchTinglysningLeads } from "./sources/tinglysning";
import { fetchBoligaListings } from "./sources/boliga";
import { fetchJobnetLeads } from "./sources/jobnet";
import { fetchDirectoryLeads } from "./sources/directories";
import { getIndustryWeights } from "./scoring";
import { qualifyLeads, QUALIFY_THRESHOLD } from "./qualifier";
import { generateNotes } from "./enrichment/note-generator";
import { enrichEmailsBatch } from "./enrichment/email-finder";
import { enrichPhonesBatch } from "./enrichment/phone-enricher";
import type { LeadCandidate } from "./types";

export interface RunResult {
  candidates: LeadCandidate[];
  bySource: Record<string, number>;
  byType: { company: number; private: number; employee: number };
  qualifiedCount: number;
  discardedCount: number;
  durationMs: number;
  industryWeightsApplied: number;
}

export async function runLeadFinder(): Promise<RunResult> {
  const start = Date.now();

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );

  const weights = await getIndustryWeights().catch(() => ({} as Record<string, number>));

  // ── Kør ALLE 10 kilder parallelt ─────────────────────────────────────────
  const [
    cvrResults,
    googleResults,
    privateResults,
    employeeResults,
    jobindexResults,
    oisResults,
    tinglysningResults,
    boligaResults,
    jobnetResults,
    directoryResults,
  ] = await Promise.allSettled([
    fetchCVRLeads(dayOfYear, weights),
    fetchGooglePlacesLeads(dayOfYear),
    fetchPrivateLeads(dayOfYear),
    fetchEmployeeLeads(dayOfYear),
    fetchJobindexLeads(dayOfYear),
    fetchOISLeads(dayOfYear),
    fetchTinglysningLeads(dayOfYear),
    fetchBoligaListings(dayOfYear),
    fetchJobnetLeads(dayOfYear),
    fetchDirectoryLeads(dayOfYear),
  ]);

  // ── Del employee + jobnet op i company + employee leads ───────────────────
  const employeeSourceRaw =
    employeeResults.status === "fulfilled" ? employeeResults.value : [];
  const employeeSourceCompanies = employeeSourceRaw.filter((c) => c.leadType === "company");
  const employeeSourceEmployees = employeeSourceRaw.filter((c) => c.leadType === "employee");

  const jobnetData =
    jobnetResults.status === "fulfilled"
      ? jobnetResults.value
      : { companies: [], employees: [] };

  // ── Saml rådata per kategori ──────────────────────────────────────────────
  const companyRaw: LeadCandidate[] = [
    ...(cvrResults.status === "fulfilled" ? cvrResults.value : []),
    ...(googleResults.status === "fulfilled"
      ? googleResults.value.map((c) => ({ ...c, leadType: "company" as const }))
      : []),
    ...(jobindexResults.status === "fulfilled"
      ? jobindexResults.value.map((c) => ({ ...c, leadType: "company" as const }))
      : []),
    ...employeeSourceCompanies,
    ...jobnetData.companies,
    ...(directoryResults.status === "fulfilled" ? directoryResults.value : []),
  ].slice(0, 100); // Stort buffer — qualifier kaster dårlige fra

  const privateRaw: LeadCandidate[] = [
    ...(oisResults.status === "fulfilled"
      ? oisResults.value.map((c) => ({ ...c, leadType: "private" as const }))
      : []),
    ...(privateResults.status === "fulfilled" ? privateResults.value : []),
    ...(tinglysningResults.status === "fulfilled" ? tinglysningResults.value : []),
    ...(boligaResults.status === "fulfilled" ? boligaResults.value : []),
  ].slice(0, 80);

  const employeeRaw: LeadCandidate[] = [
    ...employeeSourceEmployees,
    ...jobnetData.employees,
  ].slice(0, 80);

  // ── Qualifier: scorer og filtrerer (sorterer bedste øverst) ──────────────
  const companyQ = qualifyLeads(companyRaw).slice(0, 50);
  const privateQ = qualifyLeads(privateRaw).slice(0, 50);
  const employeeQ = qualifyLeads(employeeRaw).slice(0, 50);

  const totalRaw = companyRaw.length + privateRaw.length + employeeRaw.length;
  const totalQ = companyQ.length + privateQ.length + employeeQ.length;

  // ── Email-enrichment (Hunter.io → Apollo → website-scraper) ──────────────
  const [companyEnriched, privateEnriched, employeeEnriched] = await Promise.all([
    enrichEmailsBatch(companyQ, { maxEnrich: 20 }),
    enrichEmailsBatch(privateQ, { maxEnrich: 8 }),
    enrichEmailsBatch(employeeQ, { maxEnrich: 12 }),
  ]);

  // ── Phone-enrichment (Krak → 118.dk → CVR) — kun company ─────────────────
  const companyPhoneEnriched = await enrichPhonesBatch(companyEnriched, { maxEnrich: 12 });

  const allQualified = [
    ...companyPhoneEnriched.slice(0, 35),
    ...privateEnriched.slice(0, 35),
    ...employeeEnriched.slice(0, 35),
  ];

  // ── AI-noter (struktureret Sarah-brief m/ KVALIFIKATION + DECISION-MAKER + TIMING) ─
  const needsNote = allQualified.filter(
    (c) => !c.notes || !c.notes.includes("---SARAH NOTE")
  );
  if (needsNote.length > 0) {
    const notes = await generateNotes(needsNote).catch(() =>
      needsNote.map(() => "")
    );
    needsNote.forEach((c, i) => {
      if (notes[i]) c.notes = notes[i];
    });
  }

  // ── Statistik ─────────────────────────────────────────────────────────────
  const bySource: Record<string, number> = {};
  for (const c of allQualified) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
  }

  const finalCompanies = allQualified.filter((c) => c.leadType === "company");
  const finalPrivate = allQualified.filter((c) => c.leadType === "private");
  const finalEmployees = allQualified.filter((c) => c.leadType === "employee");

  const byType = {
    company: finalCompanies.length,
    private: finalPrivate.length,
    employee: finalEmployees.length,
  };

  const duration = Math.round((Date.now() - start) / 1000);
  console.log([
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  KRYDSBYG LEADBOT — ${now.toLocaleDateString("da-DK")}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  🏢 Virksomheder:  ${companyRaw.length} fundet / ${byType.company} kvalificeret ${byType.company >= 30 ? "✅" : byType.company >= 20 ? "⚠️" : "❌"}`,
    `  🏠 Private:       ${privateRaw.length} fundet / ${byType.private} kvalificeret ${byType.private >= 30 ? "✅" : byType.private >= 20 ? "⚠️" : "❌"}`,
    `  👷 Medarbejdere:  ${employeeRaw.length} fundet / ${byType.employee} kvalificeret ${byType.employee >= 30 ? "✅" : byType.employee >= 20 ? "⚠️" : "❌"}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  📧 Klar til Sarah: ${allQualified.length} leads`,
    `  🔁 Kasseret (score < ${QUALIFY_THRESHOLD}): ${totalRaw - totalQ}`,
    `  ⏱  Køretid: ${Math.floor(duration / 60)}m ${duration % 60}s`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n"));

  return {
    candidates: allQualified,
    bySource,
    byType,
    qualifiedCount: totalQ,
    discardedCount: totalRaw - totalQ,
    durationMs: Date.now() - start,
    industryWeightsApplied: Object.keys(weights).length,
  };
}
