import { fetchCVRLeads } from "./sources/cvr";
import { fetchGooglePlacesLeads } from "./sources/google-places";
import { fetchPrivateLeads } from "./sources/private";
import { fetchEmployeeLeads } from "./sources/employees";
import { fetchJobindexLeads } from "./sources/jobindex";
import { fetchOISLeads } from "./sources/ois";
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

  // Hent industry-weights fra email-hukommelse
  const weights = await getIndustryWeights().catch(() => ({} as Record<string, number>));

  // ── Kør alle pipelines parallelt ─────────────────────────────────────────
  const [
    cvrResults,
    googleResults,
    privateResults,
    employeeResults,
    jobindexResults,
    oisResults,
  ] = await Promise.allSettled([
    fetchCVRLeads(dayOfYear, weights),
    fetchGooglePlacesLeads(dayOfYear),
    fetchPrivateLeads(dayOfYear),
    fetchEmployeeLeads(dayOfYear),
    fetchJobindexLeads(dayOfYear),
    fetchOISLeads(dayOfYear),          // Ny: Datafordeler BBR byggesager
  ]);

  // ── Del employee-source op i company + employee leads ─────────────────────
  const employeeSourceRaw =
    employeeResults.status === "fulfilled" ? employeeResults.value : [];
  const employeeSourceCompanies = employeeSourceRaw.filter((c) => c.leadType === "company");
  const employeeSourceEmployees = employeeSourceRaw.filter((c) => c.leadType === "employee");

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
  ].slice(0, 60); // Buffer over 40 — qualifier kaster dårlige fra

  const privateRaw: LeadCandidate[] = [
    ...(oisResults.status === "fulfilled"
      ? oisResults.value.map((c) => ({ ...c, leadType: "private" as const }))
      : []),
    ...(privateResults.status === "fulfilled" ? privateResults.value : []),
  ].slice(0, 60);

  const employeeRaw: LeadCandidate[] = employeeSourceEmployees.slice(0, 60);

  // ── Qualifier: scorer og filtrerer ───────────────────────────────────────
  const companyQ = qualifyLeads(companyRaw).slice(0, 40);
  const privateQ = qualifyLeads(privateRaw).slice(0, 40);
  const employeeQ = qualifyLeads(employeeRaw).slice(0, 40);

  const totalRaw = companyRaw.length + privateRaw.length + employeeRaw.length;
  const totalQ = companyQ.length + privateQ.length + employeeQ.length;

  // ── Email-enrichment (Hunter.io → Apollo → website-scraper) ──────────────
  // Kør parallelt per kategori for at spare tid
  const [companyEnriched, privateEnriched, employeeEnriched] = await Promise.all([
    enrichEmailsBatch(companyQ, { maxEnrich: 15 }),
    enrichEmailsBatch(privateQ, { maxEnrich: 5 }),
    enrichEmailsBatch(employeeQ, { maxEnrich: 10 }),
  ]);

  // ── Phone-enrichment (Krak → 118.dk → CVR) ───────────────────────────────
  // Kun på company-leads — private og employees scraper vi ikke telefon
  const companyPhoneEnriched = await enrichPhonesBatch(companyEnriched, { maxEnrich: 10 });

  const allQualified = [...companyPhoneEnriched, ...privateEnriched, ...employeeEnriched];

  // ── AI-noter i struktureret Sarah-brief format ────────────────────────────
  // Generer kun noter for leads der ikke allerede har en struktureret note
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

  const byType = {
    company: companyPhoneEnriched.length,
    private: privateEnriched.length,
    employee: employeeEnriched.length,
  };

  // Log dashboard til Vercel-logs (synlig i dashboard)
  const duration = Math.round((Date.now() - start) / 1000);
  console.log([
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  KRYDSBYG LEADBOT — ${now.toLocaleDateString("da-DK")}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  🏢 Virksomheder:  ${companyRaw.length} fundet / ${byType.company} kvalificeret ${byType.company >= 20 ? "✅" : "⚠️"}`,
    `  🏠 Private:       ${privateRaw.length} fundet / ${byType.private} kvalificeret ${byType.private >= 20 ? "✅" : "⚠️"}`,
    `  👷 Medarbejdere:  ${employeeRaw.length} fundet / ${byType.employee} kvalificeret ${byType.employee >= 20 ? "✅" : "⚠️"}`,
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
