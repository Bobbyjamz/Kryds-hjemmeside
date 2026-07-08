/**
 * Note-generator — bygger strukturerede Sarah-briefs til hvert lead.
 *
 * v2: Tynd router der delegerer til note-builder/templates/*.ts.
 * Hver template har sin egen `buildXxxNote()` og `buildXxxFallbackAnalysis()`.
 *
 * Format (uændret fra v1, men employee-noter er meget rigere nu):
 *   ---SARAH NOTE [TYPE]---
 *   FIRMA / NAVN / KANDIDAT: ...
 *   KONTAKT: ...
 *   KVALIFIKATION:
 *   - bullet 1
 *   - bullet 2
 *   SARAH — SKRIV EN MAIL DER:
 *   1. ...
 *   ---
 */

import Anthropic from "@anthropic-ai/sdk";
import type { LeadCandidate } from "../types";
import { QUAL_SYSTEM_PROMPT } from "../note-builder/sarah-prompt";
import {
  buildCompanyNote,
  buildCompanyFallbackAnalysis,
} from "../note-builder/templates/company";
import {
  buildPrivateNote,
  buildPrivateFallbackAnalysis,
} from "../note-builder/templates/private";
import {
  buildEmployeeNote,
  buildEmployeeFallbackAnalysis,
} from "../note-builder/templates/employee";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateNotes(candidates: LeadCandidate[]): Promise<string[]> {
  const results = await Promise.allSettled(
    candidates.map((c) => buildStructuredNote(c))
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return buildFallbackNote(candidates[i]);
  });
}

async function buildStructuredNote(c: LeadCandidate): Promise<string> {
  // Generer rig AI-analyse for alle leads med nok data
  let aiAnalysis = "";
  if (hasEnoughDataForAI(c)) {
    aiAnalysis = await generateAIAnalysis(c).catch(() => "");
  }
  if (!aiAnalysis) {
    aiAnalysis = buildFallbackAnalysis(c);
  }

  if (c.leadType === "company") return buildCompanyNote(c, aiAnalysis);
  if (c.leadType === "private") return buildPrivateNote(c, aiAnalysis);
  return buildEmployeeNote(c, aiAnalysis);
}

// ── AI-genereret rig analyse (Sonnet for bedre kvalitet) ──────────────────────

async function generateAIAnalysis(c: LeadCandidate): Promise<string> {
  const context = buildAIContext(c);

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    system: QUAL_SYSTEM_PROMPT,
    messages: [{ role: "user", content: context }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  // Sikr at output indeholder mindst KVALIFIKATION-blokken
  if (!text.includes("KVALIFIKATION:")) return "";
  return text;
}

function buildAIContext(c: LeadCandidate): string {
  const parts: string[] = [];

  if (c.leadType === "company") {
    parts.push(`Virksomhed: ${c.companyName}`);
    if (c.industry) parts.push(`Branche: ${c.industry}`);
    if (c.employees) parts.push(`Ansatte: ${c.employees}`);
    if (c.yearFounded) parts.push(`Grundlagt: ${c.yearFounded}`);
    if (c.website) parts.push(`Website: ${c.website}`);
    if (c.source) parts.push(`Kilde: ${c.source}`);
  } else if (c.leadType === "private") {
    parts.push(`Privat lead: ${c.address || c.companyName}`);
    if (c.buildingPermit) parts.push(`Signal: Aktiv byggesag`);
    if (c.propertyType) parts.push(`Boligtype: ${c.propertyType}`);
    if (c.salePrice) parts.push(`Salgspris: ${(c.salePrice / 1_000_000).toFixed(1)}M kr.`);
  } else {
    parts.push(`Jobsøger: ${c.contactName || c.companyName}`);
    if (c.contactTitle) parts.push(`Titel: ${c.contactTitle}`);
    if (c.tradeCategory) parts.push(`Faggruppe: ${c.tradeCategory}`);
    else if (c.industry) parts.push(`Branche: ${c.industry}`);
    if (c.experienceYears !== undefined) parts.push(`Erfaring: ${c.experienceYears} år`);
    if (c.openToWork) parts.push(`Status: Aktivt jobsøgende`);
    if (c.source.includes("CVR Enkeltmands")) {
      parts.push(`Kontekst: Driver enkeltmandsvirksomhed (selvstændig håndværker)`);
    }
    if (c.city) parts.push(`Lokation: ${c.city}`);
  }

  return parts.join("\n") + "\n\nSkriv 2-3 konkrete bullets om dette lead's potentiale for KrydsByg.";
}

// ── Fallback (delegerer til template fallback) ────────────────────────────────

function hasEnoughDataForAI(c: LeadCandidate): boolean {
  // Kræv mindst 2 felter med data
  const filledFields = [
    c.industry, c.website, c.employees, c.yearFounded,
    c.contactTitle, c.propertyType, c.salePrice, c.buildingPermit,
    c.tradeCategory, c.experienceYears,
  ].filter(Boolean).length;
  return filledFields >= 2;
}

function buildFallbackAnalysis(c: LeadCandidate): string {
  if (c.leadType === "company") return buildCompanyFallbackAnalysis(c);
  if (c.leadType === "private") return buildPrivateFallbackAnalysis(c);
  return buildEmployeeFallbackAnalysis(c);
}

function buildFallbackNote(c: LeadCandidate): string {
  // Hvis hele Promise fejler (sjældent), byg en minimal note via templates
  const analysis = buildFallbackAnalysis(c);
  if (c.leadType === "company") return buildCompanyNote(c, analysis);
  if (c.leadType === "private") return buildPrivateNote(c, analysis);
  return buildEmployeeNote(c, analysis);
}
