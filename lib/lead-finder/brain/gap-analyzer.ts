/**
 * Gap Analyzer — tæller hvad vi mangler.
 *
 * To kilder til "yesterday stats":
 *   1. Vores daglige snapshot (leadbot:daily-stats:YYYY-MM-DD) — pålideligt
 *   2. Faldback: tæl direkte i leads-arrayet (Lead.createdAt findes ikke,
 *      så vi gætter ud fra sentAt — mindre præcist)
 *
 * Returnerer altid noget brugbart — falder tilbage til 0/0/0 hvis intet data.
 */

import { readDailyStats, readLeads, readRecentDailyStats } from "@/lib/db";
import type {
  YesterdayStats,
  FaggruppeStats,
  Faggruppe,
} from "../types";
import { ALL_FAGGRUPPER } from "../types";

/** ISO yyyy-mm-dd for N dage siden (default: igår) */
function isoDaysAgo(daysAgo: number = 1): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Hent gårsdagens statistik. Brain bruger denne til at beslutte dagens prioritet.
 *
 * Strategi:
 *   1. Læs gemt snapshot for igår
 *   2. Hvis intet snapshot, falder vi tilbage til at tælle leads.sentAt fra igår
 *   3. Hvis stadig intet (dag 1), returnér nuller — Brain'en håndterer det
 */
export async function getYesterdayStats(): Promise<YesterdayStats> {
  const yesterdayIso = isoDaysAgo(1);

  // Primær: gemt snapshot
  const snapshot = await readDailyStats(yesterdayIso);
  if (snapshot) {
    return {
      date: snapshot.date,
      company: snapshot.company,
      private: snapshot.private,
      employee: snapshot.employee,
      faggrupper: snapshot.faggrupper as FaggruppeStats,
    };
  }

  // Fallback: tæl leads sendt igår
  return await deriveStatsFromLeads(yesterdayIso);
}

/**
 * Fallback når daily-stats mangler. Tæller leads i KV hvor sentAt = givet dato.
 * Mindre præcis — fortæller hvad Sarah sendte, ikke hvad bot fandt — men bedre end ingenting.
 */
async function deriveStatsFromLeads(targetDate: string): Promise<YesterdayStats> {
  const leads = await readLeads().catch(() => []);
  const stats: YesterdayStats = {
    date: targetDate,
    company: 0,
    private: 0,
    employee: 0,
    faggrupper: {},
  };

  for (const lead of leads) {
    const sentDate = lead.sentAt?.slice(0, 10);
    if (sentDate !== targetDate) continue;

    if (lead.leadType === "company") stats.company++;
    else if (lead.leadType === "private") stats.private++;
    else if (lead.leadType === "employee") {
      stats.employee++;
      const fag = inferFaggruppeFromLead(lead.industry, lead.notes);
      if (fag) stats.faggrupper[fag] = (stats.faggrupper[fag] || 0) + 1;
    }
  }

  return stats;
}

/** Gæt faggruppe fra industry/notes-tekst når feltet ikke er sat */
function inferFaggruppeFromLead(industry?: string, notes?: string): Faggruppe | null {
  const text = `${industry || ""} ${notes || ""}`.toLowerCase();
  if (text.includes("tømrer") || text.includes("snedker")) return "Tømrer";
  if (text.includes("murer")) return "Murer";
  if (text.includes("vvs") || text.includes("rørlægger") || text.includes("blikkenslager")) return "VVS";
  if (text.includes("elektriker") || text.includes("el-instal") || text.includes("elinstal")) return "El";
  if (text.includes("maler")) return "Maler";
  if (text.includes("gulv")) return "Gulv";
  if (text.includes("stillads")) return "Stillads";
  if (text.includes("jord") || text.includes("anlæg")) return "Jord";
  if (text.includes("råbyg") || text.includes("beton") || text.includes("armering")) return "Råbyg";
  return null;
}

// ── Gap calculations ─────────────────────────────────────────────────────────

export interface GapReport {
  /** Mål: 20 per kategori */
  shortfall: {
    company: number;
    private: number;
    employee: number;
  };
  /** Faggrupper der ligger under deres mål (mål = dagligtMål / 9) */
  missingFaggrupper: Faggruppe[];
  /** Total leads i går (alle kategorier) */
  totalYesterday: number;
}

/**
 * Beregn hvor langt vi var fra at ramme 20/20/20 igår + per-faggruppe mangler.
 */
export function calculateGaps(
  stats: YesterdayStats,
  dailyTarget: number = 20,
): GapReport {
  const perFaggruppeTarget = Math.ceil(dailyTarget / ALL_FAGGRUPPER.length); // 20/9 ≈ 3

  const missingFaggrupper: Faggruppe[] = [];
  for (const f of ALL_FAGGRUPPER) {
    if ((stats.faggrupper[f] || 0) < perFaggruppeTarget) {
      missingFaggrupper.push(f);
    }
  }

  return {
    shortfall: {
      company: Math.max(0, dailyTarget - stats.company),
      private: Math.max(0, dailyTarget - stats.private),
      employee: Math.max(0, dailyTarget - stats.employee),
    },
    missingFaggrupper,
    totalYesterday: stats.company + stats.private + stats.employee,
  };
}

/**
 * Hurtigt overblik over ugens performance (bruges af feedback-loop).
 */
export async function getWeeklyTrend(): Promise<{
  totalLeads: number;
  byCategory: { company: number; private: number; employee: number };
  byFaggruppe: FaggruppeStats;
  daysWithData: number;
}> {
  const recent = await readRecentDailyStats(7);

  const sum = {
    company: 0,
    private: 0,
    employee: 0,
    byFaggruppe: {} as FaggruppeStats,
  };

  for (const day of recent) {
    sum.company += day.company;
    sum.private += day.private;
    sum.employee += day.employee;
    for (const [fag, count] of Object.entries(day.faggrupper)) {
      const f = fag as Faggruppe;
      sum.byFaggruppe[f] = (sum.byFaggruppe[f] || 0) + count;
    }
  }

  return {
    totalLeads: sum.company + sum.private + sum.employee,
    byCategory: {
      company: sum.company,
      private: sum.private,
      employee: sum.employee,
    },
    byFaggruppe: sum.byFaggruppe,
    daysWithData: recent.length,
  };
}
