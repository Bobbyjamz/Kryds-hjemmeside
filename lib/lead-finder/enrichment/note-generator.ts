/**
 * Note-generator — bygger strukturerede Sarah-briefs til hvert lead.
 *
 * Format (fra blueprint):
 *   ---SARAH NOTE [TYPE]---
 *   FIRMA / NAVN / KANDIDAT: ...
 *   KONTAKT: ...
 *   BRANCHE / SIGNAL / FAGOMRÅDE: ...
 *   KVALIFIKATION:
 *   - bullet 1
 *   - bullet 2
 *   SARAH — SKRIV EN MAIL DER:
 *   1. ...
 *   TONE: ...
 *   ---
 *
 * AI (Haiku) bruges til KVALIFIKATION-sektionen — resten bygges deterministisk.
 * Det holder token-forbrug lavt og notes hurtige.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { LeadCandidate } from "../types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// AI-prompt — laver dyb kvalifikation Sarah kan handle på
const QUAL_SYSTEM = `Du er en skarp B2B-analytiker for KrydsByg, et dansk bemandingsbureau (rengøring, malerarbejde, flytning, håndværk, byggeplads, montering).

Du modtager rådata om et lead og skriver en konkret, handlingsorienteret kvalifikation som Sarah (assistent) kan bruge til at sende en mail.

OUTPUT FORMAT (præcis som vist, ingen intro/outro):

KVALIFIKATION:
- 3-5 bullets der forklarer HVORFOR dette er et godt lead, baseret på rådata. Vær konkret om branche, størrelse, signaler. Max 180 tegn pr. bullet.

DECISION-MAKER:
- Hvem skal Sarah skrive til? (fx "Direktør / ejer" eller "Formand for andelsforening" eller specifik person hvis kendt). Maks 1 linje.

TIMING:
- Hvornår er det bedst at kontakte? (fx "Mandag morgen", "i denne uge", "efter sommerferie"). Maks 1 linje.

BEDSTE TILGANG:
- Skal Sarah ringe eller maile først? Hvilket vinkel virker bedst? Maks 2 linjer.

VINKEL TIL BREV:
- Den ene konkrete pointe Sarah skal åbne med — noget specifikt om dette lead, ikke generisk. Maks 1 sætning.

Returner KUN ovenstående blokke i nøjagtig denne rækkefølge. Brug danske branche-termer. Vær præcis, ikke forsigtig.`;

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

// ── Virksomheds-note ──────────────────────────────────────────────────────────

function buildCompanyNote(c: LeadCandidate, aiAnalysis: string): string {
  const lines: string[] = [
    `---SARAH NOTE [VIRKSOMHED]---`,
    `FIRMA: ${c.companyName}`,
  ];

  if (c.cvr) lines.push(`CVR: ${c.cvr}`);
  if (c.contactName) lines.push(`KONTAKT: ${c.contactName}${c.contactTitle ? ` (${c.contactTitle})` : ""}`);
  if (c.email) lines.push(`EMAIL: ${c.email}`);
  if (c.phone) lines.push(`TLF: ${c.phone}`);
  if (c.industry) lines.push(`BRANCHE: ${c.industry}${c.branchekode ? ` (${c.branchekode})` : ""}`);
  if (c.employees) lines.push(`STØRRELSE: ${c.employees} ansatte`);
  if (c.city) lines.push(`REGION: ${c.city}`);
  if (c.website) lines.push(`HJEMMESIDE: ${c.website}`);
  if (c.yearFounded) lines.push(`GRUNDLAGT: ${c.yearFounded}`);
  if (c.score) lines.push(`LEAD-SCORE: ${c.score}/100`);
  lines.push(`KILDE: ${c.source}`);

  lines.push(``, aiAnalysis);

  lines.push(``, `HILSEN: "Hej ${c.contactName?.split(" ")[0] || `${c.companyName}-team`},"`);
  lines.push(`AFSLUTNING: "Med venlig hilsen,"`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── Privat-note ───────────────────────────────────────────────────────────────

function buildPrivateNote(c: LeadCandidate, aiAnalysis: string): string {
  const lines: string[] = [
    `---SARAH NOTE [PRIVAT]---`,
    `ADRESSE: ${c.address || c.companyName}`,
  ];

  if (c.contactName) lines.push(`NAVN: ${c.contactName}`);
  if (c.email) lines.push(`EMAIL: ${c.email}`);
  if (c.phone) lines.push(`TLF: ${c.phone}`);

  const signal = c.buildingPermit
    ? "Aktiv byggetilladelse (Datafordeler BBR)"
    : c.source === "Boligsiden"
    ? `Nyligt solgt bolig${c.salePrice ? ` til ${(c.salePrice / 1_000_000).toFixed(1)}M kr.` : ""}`
    : c.source === "Tinglysning"
    ? "Nyligt registreret pant (renovering forventes)"
    : c.source;
  lines.push(`SIGNAL: ${signal}`);

  if (c.propertyType) lines.push(`TYPE: ${c.propertyType}${c.city ? `, ${c.city}` : ""}`);
  if (c.budget) lines.push(`ESTIMERET BUDGET: kr. ${c.budget}`);
  if (c.score) lines.push(`LEAD-SCORE: ${c.score}/100`);

  lines.push(``, aiAnalysis);

  lines.push(``, `HILSEN: "Hej ${c.contactName?.split(" ")[0] || ""}," (eller "Goddag," hvis intet navn)`);
  lines.push(`AFSLUTNING: "Med venlig hilsen,"`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── Medarbejder-note ──────────────────────────────────────────────────────────

function buildEmployeeNote(c: LeadCandidate, aiAnalysis: string): string {
  const lines: string[] = [
    `---SARAH NOTE [MEDARBEJDER]---`,
    `KANDIDAT: ${c.companyName}`,
  ];

  if (c.contactName) lines.push(`NAVN: ${c.contactName}`);
  if (c.contactTitle) lines.push(`TITEL: ${c.contactTitle}`);
  if (c.email) lines.push(`EMAIL: ${c.email}`);
  if (c.phone) lines.push(`TLF: ${c.phone}`);

  const trade = c.tradeCategory || c.industry || c.serviceType || "håndværk";
  lines.push(`FAGOMRÅDE: ${trade}`);

  if (c.city) lines.push(`LOKATION: ${c.city}`);
  if (c.openToWork) lines.push(`OPEN TO WORK: Ja`);
  if (c.experienceYears) lines.push(`ERFARING: ${c.experienceYears} år`);
  if (c.score) lines.push(`LEAD-SCORE: ${c.score}/100`);
  lines.push(`KILDE: ${c.source}`);

  lines.push(``, aiAnalysis);

  lines.push(``, `HILSEN: "Hej ${c.contactName?.split(" ")[0] || ""},"`);
  lines.push(`AFSLUTNING: "Med venlig hilsen,"`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── AI-genereret rig analyse (Sonnet for bedre kvalitet) ──────────────────────

async function generateAIAnalysis(c: LeadCandidate): Promise<string> {
  const context = buildAIContext(c);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-5", // Sonnet for dybde — Haiku misser nuancer
    max_tokens: 600,
    system: QUAL_SYSTEM,
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
    parts.push(`Jobsøger: ${c.companyName}`);
    if (c.contactTitle) parts.push(`Titel: ${c.contactTitle}`);
    if (c.tradeCategory || c.industry) parts.push(`Fag: ${c.tradeCategory || c.industry}`);
    if (c.experienceYears) parts.push(`Erfaring: ${c.experienceYears} år`);
    if (c.openToWork) parts.push(`Status: Aktivt jobsøgende`);
  }

  return parts.join("\n") + "\n\nSkriv 2-3 konkrete bullets om dette lead's potentiale for KrydsByg.";
}

// ── Fallback ──────────────────────────────────────────────────────────────────

function hasEnoughDataForAI(c: LeadCandidate): boolean {
  // Kræv mindst 3 felter med data
  const filledFields = [
    c.industry, c.website, c.employees, c.yearFounded,
    c.contactTitle, c.propertyType, c.salePrice, c.buildingPermit,
    c.tradeCategory, c.experienceYears,
  ].filter(Boolean).length;
  return filledFields >= 2;
}

function buildFallbackAnalysis(c: LeadCandidate): string {
  if (c.leadType === "company") {
    const bullets: string[] = [];
    if (c.source.includes("Jobindex")) bullets.push("- Aktiv rekruttering = klar kapacitetssignal");
    if (c.employees) bullets.push(`- ${c.employees} ansatte — passer til KrydsByg's B2B-model`);
    if (c.city) bullets.push(`- Placeret i ${c.city} — inden for KrydsByg's primærzone`);
    if (!c.email) bullets.push("- Mangler email — tilføj manuelt inden Sarah kører");
    if (bullets.length === 0) bullets.push("- Relevant virksomhed i KrydsByg's målgruppe");
    return [
      "KVALIFIKATION:",
      bullets.join("\n"),
      "",
      "DECISION-MAKER:",
      `- ${c.contactTitle || "Direktør / ejer"}`,
      "",
      "TIMING:",
      "- Hverdage 9-11 (mest svarende tidspunkt for B2B)",
      "",
      "BEDSTE TILGANG:",
      "- Email først, opkald som follow-up efter 2 dage",
      "",
      "VINKEL TIL BREV:",
      `- ${c.serviceType ? `Konkret tilbud om ${c.serviceType.toLowerCase()}` : "Fleksibel kapacitet uden HR-besvær"}`,
    ].join("\n");
  }
  if (c.leadType === "private") {
    const bullets: string[] = [];
    if (c.buildingPermit) bullets.push("- Aktiv byggetilladelse — søger håndværkere NU");
    else bullets.push("- Nyindflyttet / renovering på vej — stærkt signal");
    if (c.budget) bullets.push(`- Estimeret budget kr. ${c.budget}`);
    return [
      "KVALIFIKATION:",
      bullets.join("\n"),
      "",
      "DECISION-MAKER:",
      "- Boligejer (privat)",
      "",
      "TIMING:",
      "- Aften 17-20 eller weekend formiddage",
      "",
      "BEDSTE TILGANG:",
      "- Personlig email — undgå pushy salgssprog",
      "",
      "VINKEL TIL BREV:",
      "- Tilbyd at koordinere alle håndværkere ét sted",
    ].join("\n");
  }
  return [
    "KVALIFIKATION:",
    `- Potentiel medarbejder inden for ${c.tradeCategory || c.industry || "håndværk"}`,
    "- Aktivt jobsøgende eller åben for nye muligheder",
    "",
    "DECISION-MAKER:",
    "- Personen selv",
    "",
    "TIMING:",
    "- Hverdage formiddag (mens de søger jobs)",
    "",
    "BEDSTE TILGANG:",
    "- Kort, kollegial mail med konkret jobtilbud",
    "",
    "VINKEL TIL BREV:",
    "- Fleksibel arbejdstid + varierede opgaver",
  ].join("\n");
}

function buildFallbackNote(c: LeadCandidate): string {
  const type = c.leadType === "company" ? "VIRKSOMHED" : c.leadType === "private" ? "PRIVAT" : "MEDARBEJDER";
  return [
    `---SARAH NOTE [${type}]---`,
    c.leadType === "company" ? `FIRMA: ${c.companyName}` : `ADRESSE/KANDIDAT: ${c.companyName}`,
    c.email ? `EMAIL: ${c.email}` : "EMAIL: mangler — tilføj manuelt",
    c.phone ? `TLF: ${c.phone}` : "",
    `KILDE: ${c.source}`,
    ``,
    buildFallbackAnalysis(c),
    ``,
    `HILSEN: "Hej ${c.contactName?.split(" ")[0] || (c.leadType === "private" ? "" : `${c.companyName}-team`)},"`,
    `AFSLUTNING: "Med venlig hilsen,"`,
    `---`,
  ].filter((l) => l !== "").join("\n");
}
