/**
 * Ugentlig feedback-analyse for LeadBot v2.
 *
 * Læser de seneste 7 dages sendte leads, beregner open-rates per
 * kategori/faggruppe/kilde/score-bracket, og lader Claude foreslå
 * justeringer. Resultatet gemmes i Redis så Brain læser det dagen efter.
 *
 * Cron: hver mandag morgen kl 06:00 (sat i vercel.json).
 */

import { NextResponse } from "next/server";
import { runFeedbackAnalysis } from "@/lib/lead-finder/brain/feedback-loop";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authFail = verifyCronAuth(req);
  if (authFail) return authFail;

  try {
    const insights = await runFeedbackAnalysis();
    return NextResponse.json({
      ok: true,
      analyzedAt: insights.analyzedAt,
      periodFrom: insights.periodFrom,
      periodTo: insights.periodTo,
      totalSent: insights.totalSent,
      totalOpened: insights.totalOpened,
      openRate: insights.openRate,
      insights: insights.insights,
      suggestedAdjustments: insights.suggestedAdjustments,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[leadbot-feedback] Fejl:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
