/**
 * Medarbejder-note template (v2-spec).
 *
 * Det vigtigste template — vi har 0 medarbejdere og noten skal hjælpe Sarah
 * skrive mails der konverterer. Indeholder:
 *   - Faggruppe med criticality (★ KRITISK / ↑ PRIORITET)
 *   - Kilde-specifik context-sætning
 *   - "Hvad KrydsByg kan tilbyde" block (Sarah refererer hertil)
 *   - Specifikke skrive-instruktioner per kilde
 */

import type { LeadCandidate, Faggruppe } from "../../types";
import { KRITISKE_FAGGRUPPER } from "../../types";
import {
  getCriticalityLabel,
  getSourceContext,
  formatFaggruppeLine,
} from "../sarah-prompt";

export function buildEmployeeNote(c: LeadCandidate, aiAnalysis: string): string {
  const faggruppe = (c.tradeCategory as Faggruppe) || undefined;
  const fagLabel = formatFaggruppeLine(faggruppe);
  const sourceContext = getSourceContext(c.source, "employee");
  const isCritical = !!faggruppe && KRITISKE_FAGGRUPPER.includes(faggruppe);

  const tradeHeader = faggruppe ? `[MEDARBEJDER · ${faggruppe.toUpperCase()}]` : `[MEDARBEJDER]`;

  const lines: string[] = [
    `---SARAH NOTE ${tradeHeader}---`,
    `KANDIDAT: ${c.contactName || c.companyName}`,
  ];

  if (c.contactName && c.companyName !== c.contactName) {
    lines.push(`VIRKSOMHED: ${c.companyName}`);
  }
  if (c.contactTitle) lines.push(`TITEL: ${c.contactTitle}`);

  lines.push(`FAGGRUPPE: ${fagLabel}`);

  if (c.email) lines.push(`EMAIL: ${c.email}`);
  else lines.push(`EMAIL: IKKE FUNDET — brug telefon eller find via firmaets hjemmeside`);
  if (c.phone) lines.push(`TLF: ${c.phone}`);

  if (c.city || c.address) lines.push(`LOKATION: ${c.city || c.address}`);
  if (c.openToWork) lines.push(`OPEN TO WORK: Ja (aktivt jobsøgende)`);
  if (c.experienceYears !== undefined) lines.push(`ERFARING: ${c.experienceYears} år`);
  if (c.lastActiveDays !== undefined) lines.push(`SIDST AKTIV: ${c.lastActiveDays} dage siden`);
  if (c.cvr) lines.push(`CVR: ${c.cvr}`);
  if (c.score !== undefined) lines.push(`LEAD-SCORE: ${c.score}/100`);
  lines.push(`KILDE: ${c.source}`);
  lines.push(`KONTEKST: ${sourceContext}`);

  // Hvad KrydsByg kan tilbyde — Sarah refererer hertil når hun skriver mailen
  lines.push(``, `HVAD KRYDSBYG KAN TILBYDE DENNE PERSON:`);
  const offer = buildOfferBlock(faggruppe, c.source, isCritical);
  for (const o of offer) lines.push(`  - ${o}`);

  // AI-analyse (KVALIFIKATION/TIMING/DECISION-MAKER/etc.)
  lines.push(``, aiAnalysis);

  // Specifikke skrive-instruktioner — kraftigere end company/private
  lines.push(``, `SARAH — SKRIV EN MAIL DER:`);
  const instructions = buildSarahInstructions(faggruppe, c.source, isCritical);
  instructions.forEach((instr, i) => lines.push(`  ${i + 1}. ${instr}`));

  lines.push(``);
  lines.push(`TONE: Kollegial, respektfuld af håndværket — som fra en der respekterer faget`);
  lines.push(`MAKS: 120 ord`);
  lines.push(`EMNE: "Arbejde som ${faggruppe ? faggruppe.toLowerCase() : "håndværker"} via KrydsByg — Sjælland"`);
  lines.push(``);
  lines.push(`HILSEN: "Hej ${c.contactName?.split(" ")[0] || ""},"`);
  lines.push(`AFSLUTNING: "Med venlig hilsen,"`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── Offer block (hvad KrydsByg tilbyder denne person) ────────────────────────

function buildOfferBlock(
  faggruppe: Faggruppe | undefined,
  source: string,
  isCritical: boolean,
): string[] {
  const offers: string[] = [];

  if (faggruppe) {
    offers.push(`Fleksibelt arbejde i ${faggruppe.toLowerCase()}-faget på Sjælland`);
  } else {
    offers.push(`Fleksibelt håndværker-arbejde på Sjælland`);
  }

  offers.push(`Konkurrencedygtig timeløn (bureau-fastsat, ikke arbejdsgiver-fastsat)`);
  offers.push(`Vi håndterer kontrakt, forsikring og skattekort`);
  offers.push(`Varierede opgaver hos forskellige firmaer`);

  if (isCritical && faggruppe) {
    offers.push(`Vi søger AKTIVT efter ${faggruppe.toLowerCase()}ere LIGE NU — du kommer hurtigt i gang`);
  } else if (faggruppe) {
    offers.push(`Løbende projekter i ${faggruppe.toLowerCase()}-faget`);
  }

  if (source.includes("CVR Enkeltmands")) {
    offers.push(`Du kan beholde dit CVR og arbejde gennem os som freelancer hvis du foretrækker det`);
  }

  return offers;
}

// ── Sarah skrive-instruktioner (per kilde) ───────────────────────────────────

function buildSarahInstructions(
  faggruppe: Faggruppe | undefined,
  source: string,
  isCritical: boolean,
): string[] {
  const fagText = faggruppe ? faggruppe.toLowerCase() : "håndværker";

  const intro =
    source.includes("CVR Enkeltmands")
      ? `Åbner med direkte reference til at de driver eget firma som ${fagText}`
      : source.includes("Jobindex")
      ? `Åbner med reference til deres CV på JobIndex`
      : source.includes("Jobnet")
      ? `Åbner med reference til deres aktive Jobnet-profil`
      : `Åbner med en direkte reference til ${fagText}-faget`;

  const honesty = isCritical
    ? `Er ærlig om at vi mangler ${faggruppe?.toLowerCase()}ere AKTIVT lige nu — det er en styrke, ikke en svaghed`
    : `Nævner at vi har løbende projekter inden for ${fagText}-faget`;

  return [
    intro,
    `Præsenterer KrydsByg kort (1 sætning): bemandingsbureau for byggeri og håndværk, Sjælland`,
    honesty,
    `Vælger ÉN konkret fordel fra "Hvad KrydsByg kan tilbyde" og nævner den specifikt`,
    `Slutter med: "Har du 10 minutter til en hurtig snak i denne uge?"`,
  ];
}

// ── Fallback analyse (når AI ikke kan kaldes) ────────────────────────────────

export function buildEmployeeFallbackAnalysis(c: LeadCandidate): string {
  const faggruppe = (c.tradeCategory as Faggruppe) || undefined;
  const bullets: string[] = [];

  if (faggruppe) {
    bullets.push(`- Faggruppe: ${faggruppe}${getCriticalityLabel(faggruppe) ? " " + getCriticalityLabel(faggruppe) : ""}`);
  } else if (c.industry) {
    bullets.push(`- Branche: ${c.industry}`);
  }

  if (c.source.includes("CVR Enkeltmands")) {
    bullets.push(`- Driver enkeltmandsvirksomhed — sandsynligvis åben for bureau-arbejde`);
  } else if (c.openToWork) {
    bullets.push(`- Aktivt jobsøgende ("Open to Work")`);
  } else {
    bullets.push(`- Potentiel kandidat i KrydsByg's målgruppe`);
  }

  if (c.experienceYears !== undefined && c.experienceYears >= 3) {
    bullets.push(`- ${c.experienceYears} års erfaring — solid håndværker, ikke grøn`);
  }

  if (c.city && (c.city.toLowerCase().includes("københav") || c.city.toLowerCase().includes("frederiksb"))) {
    bullets.push(`- Lokal kandidat (${c.city}) — passer perfekt geografisk`);
  }

  if (!c.email) bullets.push(`- Mangler email — find på firmaets hjemmeside eller ring direkte`);

  const timing = c.source.includes("CVR Enkeltmands")
    ? "Hverdage formiddag — selvstændige har typisk fleksibel tid"
    : "Hverdage 10-12 (mens de aktivt søger)";

  const tilgang = c.phone
    ? "Ring først — håndværkere svarer hurtigere på opkald end på email"
    : "Email først, ring som follow-up efter 2 dage";

  const vinkel = faggruppe && KRITISKE_FAGGRUPPER.includes(faggruppe)
    ? `Vi mangler ${faggruppe.toLowerCase()}ere AKTIVT — du kan starte hurtigt`
    : faggruppe
    ? `Løbende projekter i ${faggruppe.toLowerCase()}-faget på Sjælland`
    : `Fleksibelt arbejde med varierede opgaver`;

  return [
    "KVALIFIKATION:",
    bullets.join("\n"),
    "",
    "DECISION-MAKER:",
    "- Personen selv (håndværker)",
    "",
    "TIMING:",
    `- ${timing}`,
    "",
    "BEDSTE TILGANG:",
    `- ${tilgang}`,
    "",
    "VINKEL TIL BREV:",
    `- ${vinkel}`,
  ].join("\n");
}
