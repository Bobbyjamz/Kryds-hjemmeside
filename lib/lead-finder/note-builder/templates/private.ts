/**
 * Privat-note template — husejere med byggesag, nysolgt bolig, eller nyt pant.
 *
 * Tone: Varm, lokal, hjælpsom. Nævner IKKE priser — invitér til samtale.
 */

import type { LeadCandidate } from "../../types";
import { getSourceContext } from "../sarah-prompt";

export function buildPrivateNote(c: LeadCandidate, aiAnalysis: string): string {
  const sourceContext = getSourceContext(c.source, "private");

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
  else if (c.city) lines.push(`OMRÅDE: ${c.city}`);
  if (c.budget) lines.push(`ESTIMERET BUDGET: kr. ${c.budget}`);
  if (c.score !== undefined) lines.push(`LEAD-SCORE: ${c.score}/100`);
  lines.push(`KILDE: ${c.source}`);
  lines.push(`KONTEKST: ${sourceContext}`);

  lines.push(``, aiAnalysis);

  lines.push(``, `SARAH — SKRIV EN MAIL DER:`);
  lines.push(`  1. Åbner med en varm, lokal hilsen (intet generisk salgs-sprog)`);
  lines.push(`  2. Nævner kort hvad KrydsByg gør (vi koordinerer håndværkere til private byggesager)`);
  lines.push(`  3. Tilbyder at sende de RIGTIGE folk hurtigt — vi har allerede et team`);
  lines.push(`  4. Slutter med invitation til en uforpligtende snak (NÆVN IKKE PRISER)`);
  lines.push(``);
  lines.push(`TONE: Varm, lokal, hjælpsom — ikke pushy`);
  lines.push(`MAKS: 110 ord`);
  lines.push(``);
  lines.push(`HILSEN: "Hej ${c.contactName?.split(" ")[0] || ""}," (eller "Goddag," hvis intet navn)`);
  lines.push(`AFSLUTNING: "Med venlig hilsen,"`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── Fallback ─────────────────────────────────────────────────────────────────

export function buildPrivateFallbackAnalysis(c: LeadCandidate): string {
  const bullets: string[] = [];

  if (c.buildingPermit) {
    bullets.push("- Aktiv byggetilladelse — søger håndværkere NU");
  } else if (c.source === "Boligsiden") {
    bullets.push("- Nyligt solgt — typisk renoveringsperiode 1-6 måneder efter");
  } else if (c.source === "Tinglysning") {
    bullets.push("- Nyt pant — finansiering tilgængelig til renovering");
  } else {
    bullets.push("- Nyindflyttet / renovering på vej — stærkt signal");
  }

  if (c.salePrice) {
    bullets.push(`- Salgspris ${(c.salePrice / 1_000_000).toFixed(1)}M kr. — solidt budget tilgængeligt`);
  }
  if (c.propertyType) bullets.push(`- Boligtype: ${c.propertyType}`);
  if (c.city) bullets.push(`- Område: ${c.city}`);
  if (c.budget) bullets.push(`- Estimeret budget: kr. ${c.budget}`);

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
