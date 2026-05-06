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

// Minimal AI-prompt — kun til at skrive 2-3 konkrete KVALIFIKATION-bullets
const QUAL_SYSTEM = `Du er en skarp B2B-analytiker. Du skriver 2-3 korte, konkrete bullets om et leads potentiale for KrydsByg (dansk bemandingsbureau: rengøring, malerarbejde, flytning, håndværk, byggeplads).
Returner KUN bullets som ren tekst med "- " foran, ét per linje. Ingen intro, ingen afslutning. Max 200 tegn per bullet.`;

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
  // Generer AI-kvalifikation kun for leads med nok data
  let qualBullets = "";
  if (hasEnoughDataForAI(c)) {
    qualBullets = await generateQualBullets(c).catch(() => "");
  }
  if (!qualBullets) {
    qualBullets = buildFallbackQualBullets(c);
  }

  if (c.leadType === "company") return buildCompanyNote(c, qualBullets);
  if (c.leadType === "private") return buildPrivateNote(c, qualBullets);
  return buildEmployeeNote(c, qualBullets);
}

// ── Virksomheds-note ──────────────────────────────────────────────────────────

function buildCompanyNote(c: LeadCandidate, qualBullets: string): string {
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

  lines.push(``, `KVALIFIKATION:`);
  lines.push(qualBullets);

  lines.push(``, `SARAH — SKRIV EN MAIL DER:`);
  lines.push(...getCompanyInstructions(c));
  lines.push(`TONE: Professionel, direkte, B2B`);
  lines.push(`---`);

  return lines.join("\n");
}

function getCompanyInstructions(c: LeadCandidate): string[] {
  const serviceType = c.serviceType || "vedligehold og service";
  const isRecruiting = c.source.includes("Jobindex");

  if (isRecruiting) {
    return [
      `1. Nævn at de søger folk og at KrydsByg kan supplere med fleksibel kapacitet`,
      `2. Fremhæv at vi håndterer løn, skat og forsikring — ingen HR-besvær`,
      `3. Foreslå en hurtig snak om kapacitetsbehov (opkald inden for 2 dage)`,
    ];
  }
  return [
    `1. Nævn KrydsByg som bemandingspartner til ${serviceType}`,
    `2. Fremhæv fleksibel arbejdskraft — de betaler kun for de timer de bruger`,
    `3. Tilbyd et konkret opkald — foreslå dato (i dag + 3 arbejdsdage)`,
  ];
}

// ── Privat-note ───────────────────────────────────────────────────────────────

function buildPrivateNote(c: LeadCandidate, qualBullets: string): string {
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
    : c.source;
  lines.push(`SIGNAL: ${signal}`);

  if (c.propertyType) lines.push(`TYPE: ${c.propertyType}${c.city ? `, ${c.city}` : ""}`);
  if (c.budget) lines.push(`ESTIMERET BUDGET: kr. ${c.budget}`);
  if (c.score) lines.push(`LEAD-SCORE: ${c.score}/100`);

  lines.push(``, `KVALIFIKATION:`);
  lines.push(qualBullets);

  lines.push(``, `SARAH — SKRIV EN BESKED DER:`);
  lines.push(
    `1. Er meget personlig — nævn adressen eller bydelen`,
    `2. Tilbyder hjælp til at finde de rigtige håndværkere via KrydsByg`,
    `3. Nævner at KrydsByg kan levere hurtigt og klare hele koordineringen`,
  );
  lines.push(`TONE: Varm, hjælpsom, lokal — ikke pushy`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── Medarbejder-note ──────────────────────────────────────────────────────────

function buildEmployeeNote(c: LeadCandidate, qualBullets: string): string {
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

  lines.push(``, `KVALIFIKATION:`);
  lines.push(qualBullets);

  lines.push(``, `SARAH — SKRIV EN MAIL DER:`);
  lines.push(
    `1. Præsenterer KrydsByg som bemandingsbureau med varierede opgaver i KBH`,
    `2. Fremhæver fleksibel arbejdstid, god timeløn og stable opgaver`,
    `3. Inviterer til 15 min. uforpligtende snak — foreslå konkret tid`,
  );
  lines.push(`TONE: Kollegial, respektfuld, ikke-pushy`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── AI-genereret kvalifikation ────────────────────────────────────────────────

async function generateQualBullets(c: LeadCandidate): Promise<string> {
  const context = buildAIContext(c);

  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 250,
    system: QUAL_SYSTEM,
    messages: [{ role: "user", content: context }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  // Sikr at output er bullet-format
  if (!text.includes("- ")) return "";
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

function buildFallbackQualBullets(c: LeadCandidate): string {
  if (c.leadType === "company") {
    const bullets: string[] = [];
    if (c.source.includes("Jobindex")) bullets.push("- Aktiv rekruttering = klar kapacitetssignal");
    if (c.employees) bullets.push(`- ${c.employees} ansatte — passer til KrydsByg's B2B-model`);
    if (c.city) bullets.push(`- Placeret i ${c.city} — inden for KrydsByg's primærzone`);
    if (!c.email) bullets.push("- Mangler email — tilføj manuelt inden Sarah kører");
    return bullets.join("\n") || "- Relevant virksomhed i KrydsByg's målgruppe";
  }
  if (c.leadType === "private") {
    const bullets: string[] = [];
    if (c.buildingPermit) bullets.push("- Aktiv byggetilladelse — søger håndværkere NU");
    else bullets.push("- Nyindflyttet / renovering på vej — stærkt signal");
    if (c.budget) bullets.push(`- Estimeret budget kr. ${c.budget}`);
    return bullets.join("\n");
  }
  return `- Potentiel medarbejder inden for ${c.tradeCategory || c.industry || "håndværk"}\n- Klar til opkald fra Sarah`;
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
    `KVALIFIKATION:`,
    buildFallbackQualBullets(c),
    ``,
    `SARAH: Skriv en kort, personlig mail baseret på ovenstående info.`,
    `TONE: Professionel, direkte`,
    `---`,
  ].filter((l) => l !== "").join("\n");
}
