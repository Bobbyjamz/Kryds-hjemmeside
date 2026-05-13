/**
 * GET /api/admin/leadbot/status
 *
 * Aggregeret status-endpoint for /debug LeadBot v2 panel.
 * Returnerer:
 *   - Seneste daily-stats (op til 7 dage)
 *   - Seneste feedback-insights (hvis nogen)
 *   - Aktuelle filter-defaults (læsbar version af filter-config)
 *   - Source-helbredstjek (env-flags der gør at scrapers virker)
 *   - Antal leads i KV
 */

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  readLeads,
  readRecentDailyStats,
  readFeedbackInsights,
} from "@/lib/db";
import { DEFAULT_FILTERS, FAGGRUPPE_CONFIG } from "@/lib/lead-finder/filters/filter-config";
import { ALL_FAGGRUPPER, KRITISKE_FAGGRUPPER } from "@/lib/lead-finder/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [leads, recentStats, feedback] = await Promise.all([
    readLeads().catch(() => []),
    readRecentDailyStats(7).catch(() => []),
    readFeedbackInsights().catch(() => null),
  ]);

  // ── Lead-totaler (DB-state) ────────────────────────────────────────────
  const leadCounts = {
    total: leads.length,
    byStatus: {} as Record<string, number>,
    byType: { company: 0, private: 0, employee: 0 },
    withEmail: 0,
    withPhone: 0,
    emailOpened: 0,
    sentLast7Days: 0,
  };

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const lead of leads) {
    leadCounts.byStatus[lead.status] = (leadCounts.byStatus[lead.status] || 0) + 1;
    const lt = lead.leadType || "company";
    if (lt in leadCounts.byType) leadCounts.byType[lt as keyof typeof leadCounts.byType]++;
    if (lead.email) leadCounts.withEmail++;
    if (lead.phone) leadCounts.withPhone++;
    if (lead.emailOpened) leadCounts.emailOpened++;
    if (lead.sentAt && new Date(lead.sentAt).getTime() >= cutoff) leadCounts.sentLast7Days++;
  }

  // ── Trend over de seneste 7 dage ────────────────────────────────────────
  const sevenDayTotals = recentStats.reduce(
    (acc, d) => ({
      company: acc.company + d.company,
      private: acc.private + d.private,
      employee: acc.employee + d.employee,
    }),
    { company: 0, private: 0, employee: 0 },
  );

  const faggruppe7d: Record<string, number> = {};
  for (const day of recentStats) {
    for (const [fag, count] of Object.entries(day.faggrupper || {})) {
      faggruppe7d[fag] = (faggruppe7d[fag] || 0) + (count as number);
    }
  }

  // ── Source-helbred (env-flags) ──────────────────────────────────────────
  const sourceHealth = {
    "CVR (3.part)": process.env.CVRAPI_ENABLED === "true",
    "CVR Enkeltmands": process.env.CVRAPI_ENABLED === "true",
    "Google Places": !!process.env.GOOGLE_PLACES_API_KEY,
    "OIS/BBR (Datafordeler)": !!process.env.DATAFORDELER_USER && !!process.env.DATAFORDELER_PASS,
    "Anthropic (Brain + AI-noter)": !!process.env.ANTHROPIC_API_KEY,
    "Upstash Redis (storage)": !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
    "Cron secret": !!process.env.CRON_SECRET,
  };

  return NextResponse.json({
    leadCounts,
    recentStats,       // nyeste først
    sevenDayTotals,
    faggruppe7d,
    feedback,          // null hvis ikke kørt endnu
    sourceHealth,
    filterDefaults: {
      virksomheder: {
        scoreGrænse: DEFAULT_FILTERS.virksomheder.scoreGrænse,
        antalAnsatteMin: DEFAULT_FILTERS.virksomheder.antalAnsatteMin,
        antalAnsatteMax: DEFAULT_FILTERS.virksomheder.antalAnsatteMax,
        postnrCount: DEFAULT_FILTERS.virksomheder.postnrZoner.length,
        branchekoder: DEFAULT_FILTERS.virksomheder.branchekoder.length,
      },
      private: {
        scoreGrænse: DEFAULT_FILTERS.private.scoreGrænse,
        signalTyper: DEFAULT_FILTERS.private.signalTyper,
        postnrCount: DEFAULT_FILTERS.private.postnrZoner.length,
      },
      medarbejdere: {
        scoreGrænse: DEFAULT_FILTERS.medarbejdere.scoreGrænse,
        dagligtMål: DEFAULT_FILTERS.medarbejdere.dagligtMål,
        geografiRadius: DEFAULT_FILTERS.medarbejdere.geografiRadius,
        erfaringMinimumAar: DEFAULT_FILTERS.medarbejdere.erfaringMinimumAar,
      },
    },
    faggrupperConfig: Object.fromEntries(
      ALL_FAGGRUPPER.map((f) => [
        f,
        {
          terms: FAGGRUPPE_CONFIG[f].terms,
          cvr: FAGGRUPPE_CONFIG[f].cvr,
          critical: KRITISKE_FAGGRUPPER.includes(f),
        },
      ])
    ),
  });
}
