/**
 * Qualifier — scorer hvert lead 0-100 og filtrerer dem der ikke er gode nok.
 *
 * Scoring per kategori:
 *   Virksomheder: email, ansatte, alder, CVR, website, by, kilde
 *   Private:      signal-styrke (byggetilladelse > Boligsiden > Andels), adresse, budget
 *   Medarbejdere: email, kilde, fagkategori, erfaring, openToWork
 *
 * Threshold: leads med score < QUALIFY_THRESHOLD kasseres.
 */

import type { LeadCandidate } from "./types";

/** Minimum score for at et lead medtages */
export const QUALIFY_THRESHOLD = 45;

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

  // Kilde-bonus — Jobindex-firmaer der rekrutterer = klart kapacitetsbehov
  if (c.source.includes("Jobindex")) s += 8;
  if (c.source.includes("Google Places")) s += 3;

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

  // Signal-styrke — byggetilladelse er det stærkeste signal (op til 45 point)
  if (c.buildingPermit) s += 45;
  else if (c.source === "Boligsiden") s += 30;
  else if (c.source === "Andelsguide") s += 20;

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

  // Direkte kontakt = kan kontaktes nu (op til 35 point)
  if (c.email) s += 30;
  if (c.phone) s += 15;

  // Kilde-styrke
  if (c.openToWork) s += 20;
  if (c.source.includes("Jobindex")) s += 20;
  if (c.source.includes("Workindenmark")) s += 15;

  // Fagkategori match — KrydsBygs 9 fagområder
  if (c.tradeCategory || c.industry) {
    const trade = (c.tradeCategory || c.industry || "").toLowerCase();
    const relevantTrades = ["maler", "tømrer", "murer", "vvs", "elektriker",
      "gulv", "gartner", "rengøring", "flytning", "byggeplads", "montør"];
    if (relevantTrades.some((t) => trade.includes(t))) s += 15;
    else s += 5; // Generel profil
  }

  // Erfaring
  if (c.experienceYears !== undefined) {
    if (c.experienceYears >= 3 && c.experienceYears <= 15) s += 10;
    else if (c.experienceYears >= 1) s += 5;
  }

  // Kontaktnavn = ikke bare et anonymt opslag
  if (c.contactName) s += 5;

  return s;
}
