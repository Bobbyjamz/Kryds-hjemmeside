import { fetchCVRLeads } from "./sources/cvr";
import { fetchGooglePlacesLeads } from "./sources/google-places";
import { fetchPrivateLeads } from "./sources/private";
import { fetchEmployeeLeads } from "./sources/employees";
import { fetchJobindexLeads } from "./sources/jobindex";
import { fetchOISLeads } from "./sources/ois";
import { fetchTinglysningLeads } from "./sources/tinglysning";
import { fetchBoligaListings } from "./sources/boliga";
import { fetchJobnetLeads } from "./sources/jobnet";
import { fetchStepstoneLeads } from "./sources/stepstone";
import { fetchDirectoryLeads } from "./sources/directories";
import { getIndustryWeights } from "./scoring";
import { qualifyLeads, QUALIFY_THRESHOLD } from "./qualifier";
import { generateNotes } from "./enrichment/note-generator";
import { enrichEmailsBatch } from "./enrichment/email-finder";
import { enrichPhonesBatch } from "./enrichment/phone-enricher";
import type { LeadCandidate } from "./types";

export interface SourceDiagnostic {
  status: "ok" | "failed" | "empty";
  rawCount: number;
  error?: string;
}

export interface RunResult {
  candidates: LeadCandidate[];
  bySource: Record<string, number>;
  byType: { company: number; private: number; employee: number };
  qualifiedCount: number;
  discardedCount: number;
  durationMs: number;
  industryWeightsApplied: number;
  // Diagnostik per kilde — hjælper med at finde hvilke kilder der svigter
  sourceDiagnostics: Record<string, SourceDiagnostic>;
}

export async function runLeadFinder(): Promise<RunResult> {
  const start = Date.now();

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );

  const weights = await getIndustryWeights().catch(() => ({} as Record<string, number>));

  // ── Kør ALLE 11 kilder parallelt ─────────────────────────────────────────
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
    stepstoneResults,
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
    fetchStepstoneLeads(dayOfYear),
    fetchDirectoryLeads(dayOfYear),
  ]);

  // ── Per-kilde diagnostik så vi kan se hvad der virker ────────────────────
  const sourceDiagnostics: Record<string, SourceDiagnostic> = {};
  const buildDiag = (
    name: string,
    res: PromiseSettledResult<unknown>,
    counter: (v: unknown) => number
  ) => {
    if (res.status === "rejected") {
      sourceDiagnostics[name] = {
        status: "failed",
        rawCount: 0,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason).slice(0, 100),
      };
    } else {
      const c = counter(res.value);
      sourceDiagnostics[name] = { status: c > 0 ? "ok" : "empty", rawCount: c };
    }
  };

  const arrCount = (v: unknown) => Array.isArray(v) ? v.length : 0;
  const dualCount = (v: unknown): number => {
    const x = v as { companies?: unknown[]; employees?: unknown[] };
    return (x.companies?.length || 0) + (x.employees?.length || 0);
  };

  buildDiag("CVR", cvrResults, arrCount);
  buildDiag("Google Places", googleResults, arrCount);
  buildDiag("Boligsiden+Andelsguide", privateResults, arrCount);
  buildDiag("Jobindex+Workindenmark", employeeResults, arrCount);
  buildDiag("Jobindex (firma)", jobindexResults, arrCount);
  buildDiag("OIS/BBR", oisResults, arrCount);
  buildDiag("Tinglysning", tinglysningResults, arrCount);
  buildDiag("Boliga (til salg)", boligaResults, arrCount);
  buildDiag("Jobnet", jobnetResults, dualCount);
  buildDiag("Stepstone", stepstoneResults, dualCount);
  buildDiag("Proff+Degulesider", directoryResults, arrCount);

  // ── Del employee + jobnet op i company + employee leads ───────────────────
  const employeeSourceRaw =
    employeeResults.status === "fulfilled" ? employeeResults.value : [];
  const employeeSourceCompanies = employeeSourceRaw.filter((c) => c.leadType === "company");
  const employeeSourceEmployees = employeeSourceRaw.filter((c) => c.leadType === "employee");

  const jobnetData =
    jobnetResults.status === "fulfilled"
      ? jobnetResults.value
      : { companies: [], employees: [] };

  const stepstoneData =
    stepstoneResults.status === "fulfilled"
      ? stepstoneResults.value
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
    ...stepstoneData.companies,
    ...(directoryResults.status === "fulfilled" ? directoryResults.value : []),
  ].slice(0, 150); // Stort buffer — qualifier kaster dårlige fra

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
    ...stepstoneData.employees,
  ].slice(0, 300); // Tre kilder: Jobindex + Jobnet + Stepstone — stort buffer

  // ── Qualifier: scorer og filtrerer (sorterer bedste øverst) ──────────────
  const companyQ = qualifyLeads(companyRaw).slice(0, 60);
  const privateQ = qualifyLeads(privateRaw).slice(0, 50);
  const employeeQ = qualifyLeads(employeeRaw).slice(0, 150); // BUMP: var 50

  const totalRaw = companyRaw.length + privateRaw.length + employeeRaw.length;
  const totalQ = companyQ.length + privateQ.length + employeeQ.length;

  // ── Email-enrichment (Hunter.io → Apollo → website-scraper) ──────────────
  // Hvert kald tager ~3-5s, så vi holder maxEnrich konservativt for at undgå timeout
  const [companyEnriched, privateEnriched, employeeEnriched] = await Promise.all([
    enrichEmailsBatch(companyQ, { maxEnrich: 18 }),
    enrichEmailsBatch(privateQ, { maxEnrich: 6 }),
    enrichEmailsBatch(employeeQ, { maxEnrich: 22 }),  // var 12 — vi vil have flere medarb. med email
  ]);

  // ── Phone-enrichment (Krak → 118.dk → CVR) — kun company ─────────────────
  const companyPhoneEnriched = await enrichPhonesBatch(companyEnriched, { maxEnrich: 12 });

  const allQualified = [
    ...companyPhoneEnriched.slice(0, 35),
    ...privateEnriched.slice(0, 30),
    ...employeeEnriched.slice(0, 70), // var 35 — vi vil have flere medarbejdere at skrive til
  ]; // Total ~135 leads — passer med Anthropic batch-grænserne

  // ── AI-noter (struktureret Sarah-brief m/ KVALIFIKATION + DECISION-MAKER + TIMING) ─
  // VIGTIGT: vi batcher Anthropic-kald 8 ad gangen for at undgå rate limits +
  // timeout når der er mange leads. Hvis tidsbudget overskrides, dropper vi
  // resten — eksisterende notater fra kilderne bevares.
  const needsNote = allQualified.filter(
    (c) => !c.notes || !c.notes.includes("---SARAH NOTE")
  );
  const NOTE_BATCH = 8;
  const NOTE_TIME_BUDGET_MS = 180_000; // 3 min max på AI-noter
  const noteStart = Date.now();

  for (let i = 0; i < needsNote.length; i += NOTE_BATCH) {
    if (Date.now() - noteStart > NOTE_TIME_BUDGET_MS) {
      console.log(`[runner] AI-note tidsbudget nået ved ${i}/${needsNote.length} — resten beholder kilde-noter`);
      break;
    }
    const batch = needsNote.slice(i, i + NOTE_BATCH);
    try {
      const notes = await generateNotes(batch);
      batch.forEach((c, j) => { if (notes[j]) c.notes = notes[j]; });
    } catch (err) {
      console.warn(`[runner] AI-note batch ${i} fejlede:`, err);
    }
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

  // Log per-kilde diagnostik så det kan ses i Vercel logs
  console.log("[runner] Per-kilde rådata:");
  for (const [name, diag] of Object.entries(sourceDiagnostics)) {
    const icon = diag.status === "ok" ? "✅" : diag.status === "empty" ? "⚪" : "❌";
    const detail = diag.error ? ` — ${diag.error}` : "";
    console.log(`  ${icon} ${name}: ${diag.rawCount} leads${detail}`);
  }

  return {
    candidates: allQualified,
    bySource,
    byType,
    qualifiedCount: totalQ,
    discardedCount: totalRaw - totalQ,
    durationMs: Date.now() - start,
    industryWeightsApplied: Object.keys(weights).length,
    sourceDiagnostics,
  };
}
