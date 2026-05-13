/**
 * Qualifier — scorer hvert lead 0-100 og filtrerer dem der ikke er gode nok.
 *
 * Scoring per kategori:
 *   Virksomheder: email, ansatte, alder, CVR, website, by, kilde
 *   Private:      signal-styrke (byggetilladelse > Boligsiden > Andels), adresse, budget
 *   Medarbejdere: email, kilde, fagkategori, erfaring, openToWork
 *
 * Threshold: leads med score < QUALIFY_THRESHOLD kasseres.
 *
 * v2-opdatering: scoreEmployee læser også runtime-state fra filter-config
 * (missing faggrupper, dynamiske tærskler fra Brain).
 */

import type { LeadCandidate, Faggruppe } from "./types";
import { KRITISKE_FAGGRUPPER } from "./types";
import { getMissingFaggrupper } from "./filters/filter-config";

/**
 * Minimum score for at et lead medtages.
 *
 * VIGTIGT: Qualifikatoren kører FØR email-enrichment, så de fleste leads
 * har endnu ingen email. Threshold sættes lavt (15) og filtrerer kun helt
 * tomme / meningsløse entries. Email-enrichment løfter leads efterfølgende.
 */
export const QUALIFY_THRESHOLD = 15;

/** Scorer ét lead og sætter `.score` på det */
export function scoreCandidate(c: LeadCandidate): LeadCandidate {
  let score = 0;

  if (c.leadType === "company") score = scoreCompany(c);
  else if (c.leadType === "private") score = scorePrivate(c);
  else score = scoreEmployee(c);

  return { ...c, score: Math.min(100, Math.max(0, score)) };
}

/** Filtrerer liste og scorer — returnerer kun dem over threshold */
export function qualifyLeads(candidates: LeadCandidate[]): LeadCandidate[] {
  return candidates
    .map(scoreCandidate)
    .filter((c) => (c.score ?? 0) >= QUALIFY_THRESHOLD)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); // Bedste leads øverst
}

// ── Virksomheder ──────────────────────────────────────────────────────────────

function scoreCompany(c: LeadCandidate): number {
  let s = 0;

  // Kontaktdata (op til 40 point)
  if (c.email) s += 25;
  if (c.phone) s += 10;
  if (c.website) s += 5;

  // Virksomhedsstørrelse — KrydsByg's sweet spot er 5–200 ansatte (op til 20 point)
  if (c.employees !== undefined) {
    if (c.employees >= 5 && c.employees <= 50) s += 20;
    else if (c.employees > 50 && c.employees <= 200) s += 15;
    else if (c.employees >= 2 && c.employees < 5) s += 10;
    else if (c.employees > 200) s += 5; // Stor = sandsynligvis egne folk
  } else {
    s += 8; // Ingen data = neutral
  }

  // Alder — etablerede virksomheder er bedre prospects (op til 15 point)
  if (c.yearFounded !== undefined) {
    const age = new Date().getFullYear() - c.yearFounded;
    if (age >= 3 && age <= 20) s += 15;
    else if (age >= 1 && age < 3) s += 8;
    else if (age > 20) s += 10; // Gammel = stabil, men måske set-in-ways
  }

  // CVR registreret = mere pålidelig (op til 10 point)
  if (c.cvr) s += 10;

  // Kontaktperson = bedre åbning (op til 5 point)
  if (c.contactName) s += 5;

  // Kilde-bonus — hvem der rekrutterer aktivt = klart kapacitetsbehov
  if (c.source.includes("Jobindex")) s += 8;
  if (c.source.includes("Jobnet")) s += 12;    // Aktiv stillingsopslag = klart behov
  if (c.source.includes("Google Places")) s += 5;
  if (c.source.includes("Proff")) s += 6;
  if (c.source.includes("Degulesider")) s += 6;

  // Branchekode-match — bygge/anlæg/facility er premium leads
  if (c.branchekode) {
    const bc = c.branchekode;
    if (bc.startsWith("41") || bc.startsWith("43")) s += 10; // Bygge/spec. byggeaktiviteter
    if (bc.startsWith("68") || bc.startsWith("81")) s += 8;  // Ejendom/facility
    if (bc.startsWith("55") || bc.startsWith("56")) s += 5;  // Hotel/restaurant
  }

  return s;
}

// ── Private ───────────────────────────────────────────────────────────────────

function scorePrivate(c: LeadCandidate): number {
  let s = 0;

  // Signal-styrke — byggetilladelse er det stærkeste signal
  if (c.buildingPermit) s += 45;

  // Kilde-bonus — alle private-kilder giver signal om behov
  if (c.source === "Boligsiden") s += 30;           // Nyligt solgt = renovering
  else if (c.source.includes("Boliga")) s += 20;    // Til salg = opfriskning
  else if (c.source === "Tinglysning") s += 25;     // Ny ejer = renovering
  else if (c.source === "Andelsguide") s += 20;     // Andelsbestyrelse = vedligehold

  // Kontaktdata
  if (c.email) s += 20;
  if (c.phone) s += 15;

  // Adresse til stede = vi kan kontakte (op til 10 point)
  if (c.address) s += 10;

  // Ejendomstype — hus/villa er bedre end andel til renoveringsopgaver
  if (c.propertyType) {
    const pt = c.propertyType.toLowerCase();
    if (pt.includes("hus") || pt.includes("villa") || pt.includes("rækkehus")) s += 8;
    else if (pt.includes("andel") || pt.includes("ejerlejlighed")) s += 5;
  }

  // Budget estimat til stede
  if (c.budget) s += 5;

  // Salgspris > 3M = stærkt budget signal (folk der køber dyrt renoverer)
  if (c.salePrice && c.salePrice >= 3_000_000) s += 8;
  else if (c.salePrice && c.salePrice >= 1_500_000) s += 4;

  return s;
}

// ── Medarbejdere ──────────────────────────────────────────────────────────────

function scoreEmployee(c: LeadCandidate): number {
  let s = 0;

  // Direkte kontakt = kan kontaktes nu (op til 45 point)
  if (c.email) s += 30;
  if (c.phone) s += 15;

  // Kilde-styrke
  if (c.openToWork) s += 20;
  if (c.source.includes("Jobindex")) s += 20;
  if (c.source.includes("Workindenmark")) s += 15;
  if (c.source.includes("Jobnet")) s += 12;             // Aktiv jobsøgning
  if (c.source.includes("CVR Enkeltmands")) s += 25;    // ★ v2: selvstændig = konverterbar

  // Fagkategori match — KrydsBygs 9 fagområder
  const tradeText = (c.tradeCategory || c.industry || "").toLowerCase();
  if (tradeText) {
    const relevantTrades = ["tømrer", "snedker", "murer", "vvs", "elektriker",
      "el-instal", "maler", "gulv", "stillads", "jord", "anlæg", "råbyg",
      "beton", "armering", "montør", "rørlægger", "blikkenslager"];
    if (relevantTrades.some((t) => tradeText.includes(t))) s += 15;
    else s += 5;
  }

  // ★ v2: Kritisk-faggruppe boost — Brain bestemmer dynamisk hvilke der mangler
  if (c.tradeCategory) {
    const trade = c.tradeCategory as Faggruppe;
    const missing = getMissingFaggrupper();
    if (missing.length > 0 && missing.includes(trade)) {
      s += 20; // Brain har sagt: vi mangler kritisk denne faggruppe i dag
    } else if (KRITISKE_FAGGRUPPER.includes(trade)) {
      s += 15; // Branchen mangler generelt VVS/El/Stillads
    }
  }

  // Erfaring
  if (c.experienceYears !== undefined) {
    if (c.experienceYears >= 5) s += 15;                  // Erfaren mester
    else if (c.experienceYears >= 2) s += 10;             // Solid håndværker
    else if (c.experienceYears >= 1) s += 5;              // Knap nok grøn
    else if (c.experienceYears < 1) s -= 5;               // For grøn
  }

  // Geografi — vi sender folk ud på Sjælland, så lokal er bedst
  if (c.city) {
    const city = c.city.toLowerCase();
    if (city.includes("københavn") || city.includes("frederiksberg")) s += 10;
    else if (city.includes("roskilde") || city.includes("hillerød") || city.includes("helsingør")) s += 5;
  }

  // Sidst aktiv (JobIndex/LinkedIn CV-feltet)
  if (c.lastActiveDays !== undefined) {
    if (c.lastActiveDays <= 30) s += 15;
    else if (c.lastActiveDays <= 90) s += 8;
  }

  // Kontaktnavn = ikke bare et anonymt opslag
  if (c.contactName) s += 5;

  return s;
}
