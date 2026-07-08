/**
 * Brain Layer — Claude bestemmer dagens prioritet for LeadBot v2.
 *
 * Input:  Gårsdagens statistik + nuværende filter-state
 * Output: DailyPlan med:
 *   - priorities          (rangordnet kategori-fokus)
 *   - scraperOrder        (hvilke scrapers først per kategori)
 *   - missingFaggrupper   (hvilke fag mangler vi mest)
 *   - adjustScores        (dynamiske score-tærskler)
 *   - note                (forklaring vi logger)
 *
 * Robusthed: Hvis Claude fejler/timer ud, returnerer vi en sensibel default-plan
 * baseret på gap-analyzer alene — bot stopper aldrig pga. Brain.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { DailyPlan, Faggruppe, LeadType, ScrapeTarget, YesterdayStats } from "../types";
import { ALL_FAGGRUPPER, KRITISKE_FAGGRUPPER } from "../types";
import { getCurrentFilters, setScoreThreshold, setMissingFaggrupper } from "../filters/filter-config";
import { getYesterdayStats, calculateGaps } from "./gap-analyzer";
import { readFeedbackInsights, type LeadBotFeedbackInsights } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du er lead-strateg for KrydsByg ApS, et bemandingsbureau inden for byggeri og håndværk på Sjælland.

KrydsBygs 9 fagområder:
Tømrer, Murer, VVS, El, Maler, Gulv, Stillads, Jord, Råbyg.

Branchens kritiske mangelområder (sværest at finde folk i):
VVS, El, Stillads.

Du modtager gårsdagens lead-statistik og beslutter dagens prioritet.
Mål: 20 leads pr. kategori (virksomheder, private, medarbejdere) — i alt 60/dag.
Medarbejdere er VIGTIGST: KrydsByg har stadig under-bemandet roster.

Du svarer KUN i ren JSON uden markdown-fences.
Felter du SKAL returnere:
{
  "priorities": ["employee", "private", "company"],   // rangordnet, alle 3 med
  "scraperOrder": {
    "employee": ["cvr-enkeltmands", "jobindex", "jobnet"],
    "private":  ["ois", "boliga"],
    "company":  ["google-places", "osm"]
  },
  "missingFaggrupper": ["VVS", "El"],   // max 5, kun fra de 9 ovenfor
  "adjustScores": { "company": 65, "private": 60, "employee": 55 },
  "note": "Forklaring i 1-2 sætninger om hvad du har valgt og hvorfor.",
  "dynamicScrapeTargets": []
}

VALGFRI "dynamicScrapeTargets" (0-4 maal): tilfoej KUN hvis du kender en konkret dansk
job- eller firmaside der rammer en mangel-faggruppe. Format pr. maal:
{ "url": "https://...", "prompt": "Udtraek jobtitel/firma/by", "leadType": "employee" eller "company", "source": "Sitenavn (ScrapeGraphAI)" }
Er du i tvivl: returner [] - saa koerer systemet kuraterede default-kilder.`;

interface BrainInputContext {
  yesterday: YesterdayStats;
  currentThresholds: { company: number; private: number; employee: number };
  shortfall: { company: number; private: number; employee: number };
  missingFaggrupperFromGap: Faggruppe[];
  /** Seneste feedback fra ugentlig analyse — kan være null hvis ikke kørt endnu */
  feedback: LeadBotFeedbackInsights | null;
}

/**
 * Hovedindgang — kald før hver lead-run.
 * Returnerer en plan + APPLIES den til runtime filter-state (setScoreThreshold,
 * setMissingFaggrupper) så scrapers og qualifier automatisk respekterer den.
 */
export async function decideTodaysPlan(): Promise<DailyPlan> {
  const yesterday = await getYesterdayStats();
  const gaps = calculateGaps(yesterday, 20);
  const filters = getCurrentFilters();
  const feedback = await readFeedbackInsights().catch(() => null);

  const inputCtx: BrainInputContext = {
    yesterday,
    currentThresholds: {
      company: filters.virksomheder.scoreGrænse,
      private: filters.private.scoreGrænse,
      employee: filters.medarbejdere.scoreGrænse,
    },
    shortfall: gaps.shortfall,
    missingFaggrupperFromGap: gaps.missingFaggrupper,
    feedback,
  };

  let plan: DailyPlan;

  try {
    plan = await askClaudeForPlan(inputCtx);
  } catch (err) {
    console.warn("[brain] Claude-kald fejlede, bruger default plan:",
      err instanceof Error ? err.message : err);
    plan = defaultPlan(inputCtx);
  }

  // Validér og rens output før vi applicerer
  plan = sanitizePlan(plan, inputCtx);

  // Applikér plan til runtime filter-state — scrapers og qualifier ser det automatisk
  setScoreThreshold("virksomheder", plan.adjustScores.company);
  setScoreThreshold("private", plan.adjustScores.private);
  setScoreThreshold("medarbejdere", plan.adjustScores.employee);
  setMissingFaggrupper(plan.missingFaggrupper);

  console.log("[brain] Dagens plan:", JSON.stringify({
    priorities: plan.priorities,
    missingFaggrupper: plan.missingFaggrupper,
    adjustScores: plan.adjustScores,
  }));
  console.log("[brain] Note:", plan.note);

  return plan;
}

// ── Claude-kald ──────────────────────────────────────────────────────────────

async function askClaudeForPlan(ctx: BrainInputContext): Promise<DailyPlan> {
  const feedbackBlock = ctx.feedback
    ? `

Ugentlig feedback-analyse (fra ${ctx.feedback.periodFrom} til ${ctx.feedback.periodTo}):
Open-rate: ${(ctx.feedback.openRate * 100).toFixed(1)}% (${ctx.feedback.totalOpened}/${ctx.feedback.totalSent})
Insights: ${ctx.feedback.insights}
Foreslåede justeringer fra forrige uge: ${JSON.stringify(ctx.feedback.suggestedAdjustments)}

Overvej disse signaler — særligt boostFaggrupper bør prioriteres højere, deboostFaggrupper kan nedprioriteres.`
    : `

(Ingen feedback-data tilgængelig endnu — første uge kører blind.)`;

  const userMessage = `Gårsdagens resultater:
${JSON.stringify(ctx.yesterday, null, 2)}

Mangel i forhold til mål (20/kategori):
${JSON.stringify(ctx.shortfall, null, 2)}

Faggrupper hvor vi var under 3 leads igår:
${ctx.missingFaggrupperFromGap.join(", ") || "(ingen — vi fik vores fag-fordeling)"}

Nuværende score-tærskler:
${JSON.stringify(ctx.currentThresholds, null, 2)}
${feedbackBlock}

Beslut dagens plan. Husk:
- Hvis vi var langt under målet i én kategori, prioritér den øverst og overvej at sænke score-tærsklen.
- Kritiske branchemangler (VVS/El/Stillads) skal ALTID med i missingFaggrupper hvis de er under 3 leads.
- Score-tærskler holdes i intervallet 40-80.
- Hvis feedback peger på en faggruppe med høj open-rate, prioritér den selvom kvantiteten er OK.`;

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  if (!text) throw new Error("Claude returnerede tom respons");

  // Tillad evt. markdown-fences (defensiv parsing)
  const json = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(json) as DailyPlan;
}

// ── Default plan (fallback) ──────────────────────────────────────────────────

function defaultPlan(ctx: BrainInputContext): DailyPlan {
  // Sortér kategorier efter mangel — størst mangel først
  const ranked = (["employee", "private", "company"] as LeadType[])
    .sort((a, b) => ctx.shortfall[b] - ctx.shortfall[a]);

  // Sænk score-tærskel hvis stor mangel, og applicér evt. feedback-delta
  const fbDelta = ctx.feedback?.suggestedAdjustments?.thresholdDelta;
  const adjust = (current: number, shortfall: number, delta?: number) => {
    let v = current;
    if (shortfall >= 15) v = Math.max(40, v - 10);
    else if (shortfall >= 8) v = Math.max(45, v - 5);
    if (delta) v = Math.max(40, Math.min(80, v + delta));
    return v;
  };

  // Missing faggrupper: gap først, derefter feedback's boostFaggrupper, ellers kritiske
  const fbBoost = (ctx.feedback?.suggestedAdjustments?.boostFaggrupper || [])
    .filter((f): f is Faggruppe => (ALL_FAGGRUPPER as string[]).includes(f));
  const missing: Faggruppe[] =
    ctx.missingFaggrupperFromGap.length > 0
      ? [...new Set([...ctx.missingFaggrupperFromGap, ...fbBoost])].slice(0, 5)
      : fbBoost.length > 0
      ? fbBoost.slice(0, 5)
      : [...KRITISKE_FAGGRUPPER];

  return {
    priorities: ranked,
    scraperOrder: {
      employee: ["cvr-enkeltmands", "jobindex", "jobnet", "stepstone"],
      private: ["ois", "boliga", "tinglysning"],
      company: ["google-places", "osm", "directories"],
    },
    missingFaggrupper: missing,
    adjustScores: {
      company: adjust(ctx.currentThresholds.company, ctx.shortfall.company, fbDelta?.company),
      private: adjust(ctx.currentThresholds.private, ctx.shortfall.private, fbDelta?.private),
      employee: adjust(ctx.currentThresholds.employee, ctx.shortfall.employee, fbDelta?.employee),
    },
    note: `Default-plan (Claude utilgængelig). Prioritet: ${ranked.join(" → ")}. ` +
          `Mangler: ${missing.join(", ")}.` +
          (ctx.feedback ? ` Feedback applied.` : ""),
  };
}

// ── Validering ───────────────────────────────────────────────────────────────

/** Sikrer at planen er internt konsistent og ikke har vilde værdier */
function sanitizePlan(plan: DailyPlan, ctx: BrainInputContext): DailyPlan {
  // Faggrupper skal være fra de 9 godkendte
  const validFaggrupper = (plan.missingFaggrupper || [])
    .filter((f): f is Faggruppe => (ALL_FAGGRUPPER as string[]).includes(f))
    .slice(0, 5);

  // Sikr at alle 3 kategorier er med i priorities
  const allCategories: LeadType[] = ["company", "private", "employee"];
  const priorities = (plan.priorities || []).filter((p) => allCategories.includes(p));
  for (const c of allCategories) {
    if (!priorities.includes(c)) priorities.push(c);
  }

  // Clamp score-tærskler til [40, 80]
  const clamp = (n: number, fallback: number) => {
    if (typeof n !== "number" || isNaN(n)) return fallback;
    return Math.max(40, Math.min(80, Math.round(n)));
  };

  return {
    priorities,
    scraperOrder: plan.scraperOrder || {},
    missingFaggrupper: validFaggrupper.length > 0 ? validFaggrupper : KRITISKE_FAGGRUPPER,
    adjustScores: {
      company: clamp(plan.adjustScores?.company, ctx.currentThresholds.company),
      private: clamp(plan.adjustScores?.private, ctx.currentThresholds.private),
      employee: clamp(plan.adjustScores?.employee, ctx.currentThresholds.employee),
    },
    note: typeof plan.note === "string" ? plan.note.slice(0, 500) : "(ingen note)",
    dynamicScrapeTargets: sanitizeTargets(plan.dynamicScrapeTargets),
  };
}


/** Validér Brain's valgfrie scrape-targets - dropper alt der ikke er en gyldig http(s)-URL. */
function sanitizeTargets(raw: unknown): ScrapeTarget[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const valid: ScrapeTarget[] = [];
  for (const t of raw) {
    if (!t || typeof t !== "object") continue;
    const o = t as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url : "";
    const prompt = typeof o.prompt === "string" ? o.prompt : "";
    const leadType =
      o.leadType === "company" || o.leadType === "employee" ? o.leadType : null;
    const source =
      typeof o.source === "string" && o.source ? o.source : "Brain (ScrapeGraphAI)";
    if (!/^https?:\/\//.test(url) || !prompt || !leadType) continue;
    valid.push({ url, prompt, leadType, source });
    if (valid.length >= 4) break;
  }
  return valid.length > 0 ? valid : undefined;
}
