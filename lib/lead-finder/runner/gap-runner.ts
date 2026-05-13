/**
 * Gap Runner — sikrer at vi når 20 leads pr. kategori (company/private/employee).
 *
 * Strategi:
 *   1. Kør `runLeadFinder()` ÉN gang (Brain + alle 13 scrapers + enrichment + AI-noter)
 *   2. Check shortfall per kategori
 *   3. For hver kategori med shortfall:
 *        - `expandFilters(category, attempt)` (sænker score, udvider geo, osv.)
 *        - Kør KUN scrapers relevante for denne kategori
 *        - Dedup mod første pass
 *        - Score + light enrich + flet ind
 *   4. Max 2 retries per kategori (3 totale forsøg) — bounded latency
 *
 * Returnerer udvidet RunResult med `retries` så Sarah/dashboard kan se hvad
 * der skete.
 */

import { runLeadFinder, type RunResult } from "../runner";
import { fetchEmployeeLeads } from "../sources/employees";
import { fetchJobindexLeads } from "../sources/jobindex";
import { fetchJobnetLeads } from "../sources/jobnet";
import { fetchStepstoneLeads } from "../sources/stepstone";
import { fetchCVREnkeltmandsLeads } from "../sources/cvr-enkeltmands";
import { fetchOISLeads } from "../sources/ois";
import { fetchPrivateLeads } from "../sources/private";
import { fetchTinglysningLeads } from "../sources/tinglysning";
import { fetchBoligaListings } from "../sources/boliga";
import { fetchGooglePlacesLeads } from "../sources/google-places";
import { fetchOSMLeads } from "../sources/osm";
import { fetchDirectoryLeads } from "../sources/directories";
import { qualifyLeads } from "../qualifier";
import { enrichEmailsBatch } from "../enrichment/email-finder";
import { expandFilters } from "../filters/filter-config";
import type { LeadCandidate, LeadType, Faggruppe } from "../types";

// ── Konfiguration ────────────────────────────────────────────────────────────

const DAILY_TARGET = 20;
const MAX_RETRIES_PER_CATEGORY = 2;

export interface RetryRecord {
  category: LeadType;
  attempt: number;
  filterChange: string;
  rawFound: number;
  qualifiedAdded: number;
}

export interface GapFillResult extends RunResult {
  retries: RetryRecord[];
  finalShortfall: { company: number; private: number; employee: number };
}

// ── Public entry ─────────────────────────────────────────────────────────────

/**
 * Kør LeadBot med gap-filling. Det er det normale entry point fra cron/api.
 */
export async function runLeadFinderWithGapFilling(): Promise<GapFillResult> {
  const startMs = Date.now();
  const first = await runLeadFinder();

  const retries: RetryRecord[] = [];
  let current = first;

  // Kør gap-filling pr. kategori indtil mål nået eller MAX_RETRIES brugt
  for (const category of ["employee", "private", "company"] as LeadType[]) {
    let attempt = 0;
    while (current.byType[category] < DAILY_TARGET && attempt < MAX_RETRIES_PER_CATEGORY) {
      const filterCategoryKey = mapCategoryToFilterKey(category);
      const change = expandFilters(filterCategoryKey, attempt);
      console.log(
        `[gap-runner] ${category}: ${current.byType[category]}/${DAILY_TARGET} — forsøg ${attempt + 1} (${change.applied})`,
      );

      const topUp = await runCategoryTopUp(category, dayOfYearNow());

      const dedup = dedupeAgainst(topUp, current.candidates);
      const qualified = qualifyLeads(dedup);

      // Light enrichment — kun email, ikke phone (phone-enrichment er dyr)
      const enriched = await enrichEmailsBatch(qualified.slice(0, 30), { maxEnrich: 10 });

      retries.push({
        category,
        attempt: attempt + 1,
        filterChange: change.applied,
        rawFound: topUp.length,
        qualifiedAdded: enriched.length,
      });

      current = mergeIntoResult(current, enriched, category);
      attempt++;
    }
  }

  const finalShortfall = {
    company: Math.max(0, DAILY_TARGET - current.byType.company),
    private: Math.max(0, DAILY_TARGET - current.byType.private),
    employee: Math.max(0, DAILY_TARGET - current.byType.employee),
  };

  const totalMs = Date.now() - startMs;
  console.log(
    `[gap-runner] Færdig efter ${retries.length} retries (${Math.round(totalMs / 1000)}s total). ` +
      `Final: C:${current.byType.company} P:${current.byType.private} E:${current.byType.employee}`,
  );

  return {
    ...current,
    retries,
    finalShortfall,
    durationMs: totalMs,
  };
}

// ── Per-kategori top-up scrapers ─────────────────────────────────────────────

async function runCategoryTopUp(category: LeadType, dayOfYear: number): Promise<LeadCandidate[]> {
  if (category === "employee") return topUpEmployees(dayOfYear);
  if (category === "private") return topUpPrivate(dayOfYear);
  return topUpCompany(dayOfYear);
}

async function topUpEmployees(dayOfYear: number): Promise<LeadCandidate[]> {
  const [empRes, jobindexRes, jobnetRes, stepstoneRes, cvrEnkRes] = await Promise.allSettled([
    fetchEmployeeLeads(dayOfYear),
    fetchJobindexLeads(dayOfYear),
    fetchJobnetLeads(dayOfYear),
    fetchStepstoneLeads(dayOfYear),
    fetchCVREnkeltmandsLeads(dayOfYear),
  ]);

  const raw: LeadCandidate[] = [];
  if (empRes.status === "fulfilled") {
    raw.push(...empRes.value.filter((c) => c.leadType === "employee"));
  }
  if (jobindexRes.status === "fulfilled") {
    raw.push(...jobindexRes.value.map((c) => ({ ...c, leadType: "employee" as const })));
  }
  if (jobnetRes.status === "fulfilled") raw.push(...jobnetRes.value.employees);
  if (stepstoneRes.status === "fulfilled") raw.push(...stepstoneRes.value.employees);
  if (cvrEnkRes.status === "fulfilled") raw.push(...cvrEnkRes.value);

  return raw;
}

async function topUpPrivate(dayOfYear: number): Promise<LeadCandidate[]> {
  const [oisRes, privateRes, tingRes, boligaRes] = await Promise.allSettled([
    fetchOISLeads(dayOfYear),
    fetchPrivateLeads(dayOfYear),
    fetchTinglysningLeads(dayOfYear),
    fetchBoligaListings(dayOfYear),
  ]);

  const raw: LeadCandidate[] = [];
  if (oisRes.status === "fulfilled") {
    raw.push(...oisRes.value.map((c) => ({ ...c, leadType: "private" as const })));
  }
  if (privateRes.status === "fulfilled") raw.push(...privateRes.value);
  if (tingRes.status === "fulfilled") raw.push(...tingRes.value);
  if (boligaRes.status === "fulfilled") raw.push(...boligaRes.value);
  return raw;
}

async function topUpCompany(dayOfYear: number): Promise<LeadCandidate[]> {
  const [googleRes, osmRes, jobnetRes, stepstoneRes, dirRes] = await Promise.allSettled([
    fetchGooglePlacesLeads(dayOfYear),
    fetchOSMLeads(dayOfYear),
    fetchJobnetLeads(dayOfYear),
    fetchStepstoneLeads(dayOfYear),
    fetchDirectoryLeads(dayOfYear),
  ]);

  const raw: LeadCandidate[] = [];
  if (googleRes.status === "fulfilled") {
    raw.push(...googleRes.value.map((c) => ({ ...c, leadType: "company" as const })));
  }
  if (osmRes.status === "fulfilled") raw.push(...osmRes.value);
  if (jobnetRes.status === "fulfilled") raw.push(...jobnetRes.value.companies);
  if (stepstoneRes.status === "fulfilled") raw.push(...stepstoneRes.value.companies);
  if (dirRes.status === "fulfilled") raw.push(...dirRes.value);
  return raw;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapCategoryToFilterKey(category: LeadType): "virksomheder" | "private" | "medarbejdere" {
  if (category === "company") return "virksomheder";
  if (category === "private") return "private";
  return "medarbejdere";
}

function dayOfYearNow(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}

/**
 * Fjern kandidater der allerede findes i eksisterende liste.
 * Dedup-nøgle: email > phone > cvr > companyName (case-insens.).
 */
function dedupeAgainst(
  newCandidates: LeadCandidate[],
  existing: LeadCandidate[],
): LeadCandidate[] {
  const seen = new Set<string>();
  for (const c of existing) {
    if (c.email) seen.add(`email:${c.email.toLowerCase()}`);
    if (c.phone) seen.add(`phone:${c.phone.replace(/\D/g, "")}`);
    if (c.cvr) seen.add(`cvr:${c.cvr}`);
    if (c.companyName) seen.add(`name:${c.companyName.toLowerCase()}`);
  }

  return newCandidates.filter((c) => {
    if (c.email && seen.has(`email:${c.email.toLowerCase()}`)) return false;
    if (c.phone && seen.has(`phone:${c.phone.replace(/\D/g, "")}`)) return false;
    if (c.cvr && seen.has(`cvr:${c.cvr}`)) return false;
    if (c.companyName && seen.has(`name:${c.companyName.toLowerCase()}`)) return false;
    return true;
  });
}

/**
 * Flet nye top-up kandidater ind i RunResult — opdater byType, byFaggruppe,
 * bySource og candidates-listen.
 */
function mergeIntoResult(
  result: RunResult,
  newOnes: LeadCandidate[],
  category: LeadType,
): RunResult {
  const merged = [...result.candidates, ...newOnes];

  const bySource: Record<string, number> = { ...result.bySource };
  for (const c of newOnes) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
  }

  const byFaggruppe: Partial<Record<Faggruppe, number>> = { ...result.byFaggruppe };
  for (const c of newOnes) {
    if (c.leadType === "employee" && c.tradeCategory) {
      const f = c.tradeCategory as Faggruppe;
      byFaggruppe[f] = (byFaggruppe[f] || 0) + 1;
    }
  }

  return {
    ...result,
    candidates: merged,
    bySource,
    byFaggruppe,
    byType: {
      ...result.byType,
      [category]: result.byType[category] + newOnes.length,
    },
    qualifiedCount: result.qualifiedCount + newOnes.length,
  };
}
