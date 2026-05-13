/**
 * Feedback Loop — ugentlig analyse af hvad der konverterer.
 *
 * Strategi:
 *   1. Læs alle leads sendt i de seneste 7 dage
 *   2. Beregn open-rate per kategori / per faggruppe / per kilde / per score-bracket
 *   3. Lad Claude analysere mønstrene og foreslå justeringer
 *   4. Gem `LeadBotFeedbackInsights` til Redis så Brain (decideTodaysPlan) læser
 *      dem næste morgen
 *
 * Vi bruger `emailOpened` som primær signal — det er det stærkeste vi har
 * uden manuelle replies. Når reply-tracking kommer på plads, kan vi tilføje
 * `replied` til metrikkerne.
 *
 * Køres typisk via cron 1x/uge (mandag morgen).
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  readLeads,
  writeFeedbackInsights,
  type LeadBotFeedbackInsights,
} from "@/lib/db";
import type { Lead } from "@/lib/types";
import { ALL_FAGGRUPPER, type Faggruppe } from "../types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANALYSIS_WINDOW_DAYS = 7;

interface BucketStats {
  sent: number;
  opened: number;
}

/** Hovedindgang — kør én gang om ugen */
export async function runFeedbackAnalysis(): Promise<LeadBotFeedbackInsights> {
  const leads = await readLeads();

  // Filtrér til leads sendt inden for vinduet
  const cutoff = Date.now() - ANALYSIS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentSent = leads.filter((l) => {
    if (!l.sentAt) return false;
    const ts = new Date(l.sentAt).getTime();
    return ts >= cutoff;
  });

  console.log(`[feedback-loop] Analyserer ${recentSent.length} leads sendt i de seneste ${ANALYSIS_WINDOW_DAYS} dage`);

  // ── Buckets ────────────────────────────────────────────────────────────
  const byCategory: Record<string, BucketStats> = {
    company: { sent: 0, opened: 0 },
    private: { sent: 0, opened: 0 },
    employee: { sent: 0, opened: 0 },
  };

  const byFaggruppe: Record<string, BucketStats> = {};
  const bySource: Record<string, BucketStats> = {};
  const byScoreBracket: Record<string, BucketStats> = {
    "<50": { sent: 0, opened: 0 },
    "50-59": { sent: 0, opened: 0 },
    "60-69": { sent: 0, opened: 0 },
    "70-79": { sent: 0, opened: 0 },
    "80+": { sent: 0, opened: 0 },
  };

  for (const lead of recentSent) {
    const opened = lead.emailOpened ? 1 : 0;
    const category = lead.leadType || "company";

    // By category
    if (byCategory[category]) {
      byCategory[category].sent++;
      byCategory[category].opened += opened;
    }

    // By faggruppe (medarbejdere)
    if (category === "employee") {
      const fag = inferFaggruppe(lead);
      if (fag) {
        if (!byFaggruppe[fag]) byFaggruppe[fag] = { sent: 0, opened: 0 };
        byFaggruppe[fag].sent++;
        byFaggruppe[fag].opened += opened;
      }
    }

    // By source — vi har ikke source direkte på Lead, men i notes
    const source = inferSourceFromLead(lead);
    if (source) {
      if (!bySource[source]) bySource[source] = { sent: 0, opened: 0 };
      bySource[source].sent++;
      bySource[source].opened += opened;
    }

    // By score bracket
    const bracket = scoreBracket(lead.qualifierScore);
    byScoreBracket[bracket].sent++;
    byScoreBracket[bracket].opened += opened;
  }

  // ── Beregn open rates ────────────────────────────────────────────────────
  const finalize = (b: BucketStats) => ({
    sent: b.sent,
    opened: b.opened,
    openRate: b.sent > 0 ? b.opened / b.sent : 0,
  });

  const totalSent = recentSent.length;
  const totalOpened = recentSent.filter((l) => l.emailOpened).length;

  // ── Claude-analyse + suggestions ─────────────────────────────────────────
  const claudeResult = await askClaudeForInsights({
    totalSent,
    totalOpened,
    byCategory,
    byFaggruppe,
    bySource,
    byScoreBracket,
  }).catch((err) => {
    console.warn("[feedback-loop] Claude-analyse fejlede, bruger heuristisk fallback:", err);
    return heuristicInsights({ byCategory, byFaggruppe, byScoreBracket });
  });

  const now = new Date();
  const periodFrom = new Date(cutoff).toISOString().slice(0, 10);
  const periodTo = now.toISOString().slice(0, 10);

  const insights: LeadBotFeedbackInsights = {
    analyzedAt: now.toISOString(),
    periodFrom,
    periodTo,
    totalSent,
    totalOpened,
    openRate: totalSent > 0 ? totalOpened / totalSent : 0,
    byCategory: {
      company: finalize(byCategory.company),
      private: finalize(byCategory.private),
      employee: finalize(byCategory.employee),
    },
    byFaggruppe: Object.fromEntries(
      Object.entries(byFaggruppe).map(([k, v]) => [k, finalize(v)])
    ),
    bySource: Object.fromEntries(
      Object.entries(bySource).map(([k, v]) => [k, finalize(v)])
    ),
    byScoreBracket: Object.fromEntries(
      Object.entries(byScoreBracket).map(([k, v]) => [k, finalize(v)])
    ),
    insights: claudeResult.insights,
    suggestedAdjustments: claudeResult.suggestedAdjustments,
  };

  await writeFeedbackInsights(insights);
  console.log(`[feedback-loop] Gemt insights. Open-rate: ${(insights.openRate * 100).toFixed(1)}% (${totalOpened}/${totalSent})`);
  return insights;
}

// ── Claude analyse ──────────────────────────────────────────────────────────

interface ClaudeAnalysisInput {
  totalSent: number;
  totalOpened: number;
  byCategory: Record<string, BucketStats>;
  byFaggruppe: Record<string, BucketStats>;
  bySource: Record<string, BucketStats>;
  byScoreBracket: Record<string, BucketStats>;
}

interface ClaudeAnalysisResult {
  insights: string;
  suggestedAdjustments: LeadBotFeedbackInsights["suggestedAdjustments"];
}

async function askClaudeForInsights(input: ClaudeAnalysisInput): Promise<ClaudeAnalysisResult> {
  if (input.totalSent < 10) {
    // For lidt data — sleep
    return {
      insights: `Kun ${input.totalSent} leads sendt i perioden. Ikke nok data til pålidelig analyse — fortsæt med nuværende strategi.`,
      suggestedAdjustments: {},
    };
  }

  const systemPrompt = `Du er performance-analytiker for KrydsByg LeadBot.

Du modtager open-rate statistik for de seneste 7 dage og foreslår justeringer til lead-strategien.

KrydsByg's 9 fagområder: Tømrer, Murer, VVS, El, Maler, Gulv, Stillads, Jord, Råbyg.
Tre kategorier: company (B2B), private (husejere), employee (rekruttering).

Svar KUN i JSON uden markdown-fences:
{
  "insights": "2-3 sætninger på dansk om hvad du ser i data. Vær konkret om mønstre.",
  "suggestedAdjustments": {
    "thresholdDelta": { "company": -5, "private": 0, "employee": +3 },   // negative = sænk tærskel (mere kvantitet), positive = hæv (mere kvalitet)
    "boostFaggrupper": ["VVS", "El"],         // faggrupper med god open-rate
    "deboostFaggrupper": ["Jord"],            // faggrupper med dårlig open-rate
    "boostSources": ["CVR Enkeltmands"]       // kilder med god open-rate
  }
}

Regler:
- thresholdDelta i intervallet [-10, +10]
- Kun fag fra de 9 godkendte i boost/deboost
- Vær konservativ: hvis et bucket har <5 leads, ignorér det (insufficient data)
- Hvis intet skiller sig ud, returnér tomt suggestedAdjustments-objekt`;

  const userMessage = `Total: ${input.totalSent} sendt, ${input.totalOpened} åbnet (open-rate ${((input.totalOpened / input.totalSent) * 100).toFixed(1)}%)

Per kategori:
${JSON.stringify(input.byCategory, null, 2)}

Per faggruppe (medarbejdere):
${JSON.stringify(input.byFaggruppe, null, 2)}

Per kilde:
${JSON.stringify(input.bySource, null, 2)}

Per score-bracket:
${JSON.stringify(input.byScoreBracket, null, 2)}

Analysér og foreslå konkrete justeringer.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  if (!text) throw new Error("Claude returnerede tom respons");

  const json = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(json) as ClaudeAnalysisResult;

  // Sanitér deltas
  if (parsed.suggestedAdjustments?.thresholdDelta) {
    const td = parsed.suggestedAdjustments.thresholdDelta;
    if (td.company !== undefined) td.company = clamp(td.company, -10, 10);
    if (td.private !== undefined) td.private = clamp(td.private, -10, 10);
    if (td.employee !== undefined) td.employee = clamp(td.employee, -10, 10);
  }

  return parsed;
}

// ── Heuristisk fallback (når Claude ikke kan kaldes) ─────────────────────────

function heuristicInsights(input: {
  byCategory: Record<string, BucketStats>;
  byFaggruppe: Record<string, BucketStats>;
  byScoreBracket: Record<string, BucketStats>;
}): ClaudeAnalysisResult {
  const boostFaggrupper: string[] = [];
  const deboostFaggrupper: string[] = [];

  // Find faggrupper med ekstrem performance (kræver min 5 sendt)
  for (const [fag, stats] of Object.entries(input.byFaggruppe)) {
    if (stats.sent < 5) continue;
    const rate = stats.opened / stats.sent;
    if (rate >= 0.4) boostFaggrupper.push(fag);
    else if (rate < 0.15) deboostFaggrupper.push(fag);
  }

  // Sammenlign score-brackets — hvis 60-69 åbner næsten lige så meget som 80+,
  // kan vi sænke threshold uden tab af kvalitet
  const bracket7080 = input.byScoreBracket["70-79"];
  const bracket80 = input.byScoreBracket["80+"];
  const bracket6069 = input.byScoreBracket["60-69"];

  const thresholdDelta: { company?: number; private?: number; employee?: number } = {};
  if (bracket6069?.sent >= 5 && bracket80?.sent >= 5) {
    const rate6069 = bracket6069.opened / bracket6069.sent;
    const rate80 = bracket80.opened / bracket80.sent;
    if (Math.abs(rate6069 - rate80) < 0.1) {
      // Lavscore-leads konverterer næsten lige så godt — sænk threshold
      thresholdDelta.employee = -5;
    }
  }

  // Bracket 70-79 vs 80+ proxy for kvalitets-trend
  void bracket7080;

  return {
    insights: `Heuristisk analyse (Claude utilgængelig). ${boostFaggrupper.length} faggrupper med høj open-rate, ${deboostFaggrupper.length} med lav.`,
    suggestedAdjustments: {
      thresholdDelta: Object.keys(thresholdDelta).length > 0 ? thresholdDelta : undefined,
      boostFaggrupper: boostFaggrupper.length > 0 ? boostFaggrupper : undefined,
      deboostFaggrupper: deboostFaggrupper.length > 0 ? deboostFaggrupper : undefined,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  if (typeof n !== "number" || isNaN(n)) return 0;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function scoreBracket(score: number | undefined): string {
  if (score === undefined || score < 50) return "<50";
  if (score < 60) return "50-59";
  if (score < 70) return "60-69";
  if (score < 80) return "70-79";
  return "80+";
}

/** Forsøg at gætte faggruppe ud fra Lead's industry/notes/serviceType */
function inferFaggruppe(lead: Lead): Faggruppe | null {
  const text = `${lead.industry || ""} ${lead.notes || ""} ${lead.serviceType || ""}`.toLowerCase();
  for (const fag of ALL_FAGGRUPPER) {
    if (text.includes(fag.toLowerCase())) return fag;
  }
  // Aliaser
  if (text.includes("snedker")) return "Tømrer";
  if (text.includes("rørlægger") || text.includes("blikkenslager")) return "VVS";
  if (text.includes("elektriker") || text.includes("elinstal")) return "El";
  if (text.includes("anlæg")) return "Jord";
  if (text.includes("beton") || text.includes("armering")) return "Råbyg";
  return null;
}

/** Forsøg at gætte source fra notes-feltet (Lead har ikke source-felt) */
function inferSourceFromLead(lead: Lead): string | null {
  if (!lead.notes) return null;
  // Notes indeholder typisk en "KILDE:"-linje
  const m = lead.notes.match(/KILDE:\s*([^\n]+)/i);
  if (m) return m[1].trim();
  return null;
}
