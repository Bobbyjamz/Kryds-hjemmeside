/**
 * Master filter-konfiguration for LeadBot v2.
 *
 * Alle søgeparametre samlet ét sted. Tune dette uden at røre scraper-koden.
 * Brain Layer kan dynamisk justere `scoreGrænse` per kategori i runtime via
 * `setScoreThreshold()` — efter en kørsel reset'es til DEFAULT.
 */

import type { Faggruppe } from "../types";

// ── Hjælpere ─────────────────────────────────────────────────────────────────

/** Postnr-range som flat array: range(2600, 2700) → ["2600","2601",…,"2699"] */
function range(from: number, to: number): string[] {
  return Array.from({ length: to - from }, (_, i) => String(from + i));
}

// ── Faggruppe-konfiguration ──────────────────────────────────────────────────

export interface FaggruppeConfig {
  /** Søgetermer brugt til JobIndex, LinkedIn, Facebook-grupper */
  terms: string[];
  /** CVR-branchekoder for enkeltmandsvirksomheder i faget */
  cvr: string[];
}

/**
 * KrydsBygs 9 fagområder med søge- og branchekode-mapping.
 * Bruges af cvr-enkeltmands.ts, jobindex.ts og scoreEmployee.
 */
export const FAGGRUPPE_CONFIG: Record<Faggruppe, FaggruppeConfig> = {
  Tømrer:   { terms: ["tømrer", "snedker", "carpenter"],            cvr: ["43.32"] },
  Murer:    { terms: ["murer", "muraarbejde", "bricklayer"],        cvr: ["43.99", "43.31"] },
  VVS:      { terms: ["VVS", "vvs-montør", "rørlægger", "plumber"], cvr: ["43.22"] },
  El:       { terms: ["elektriker", "elinstallatør", "electrician"], cvr: ["43.21"] },
  Maler:    { terms: ["maler", "malersvend", "painter"],            cvr: ["43.34"] },
  Gulv:     { terms: ["gulvlægger", "parketlægger", "flooring"],    cvr: ["43.33"] },
  Stillads: { terms: ["stilladsarbejder", "stillads", "scaffolder"], cvr: ["43.99"] },
  Jord:     { terms: ["jordarbejde", "anlæg", "gravemaskine"],      cvr: ["43.12"] },
  Råbyg:    { terms: ["råbyg", "betonstøber", "armering"],          cvr: ["41.20"] },
};

// ── Master filter config ─────────────────────────────────────────────────────

export interface FilterConfig {
  virksomheder: {
    branchekoder: string[];
    postnrZoner: string[];
    antalAnsatteMin: number;
    antalAnsatteMax: number;
    minimumAlder: number;
    kræverHjemmeside: boolean;
    /** Score-tærskel POST-enrichment (default 65) */
    scoreGrænse: number;
  };
  private: {
    signalTyper: string[];
    postnrZoner: string[];
    boligTyper: string[];
    scoreGrænse: number;
  };
  medarbejdere: {
    faggrupper: Record<Faggruppe, FaggruppeConfig>;
    dagligtMål: number;
    fordeling: "behovsstyret" | "ligevægt";
    geografiRadius: "København" | "Sjælland" | "Danmark";
    åbenForArbejde: boolean;
    erfaringMinimumAar: number;
    /** Score-tærskel POST-enrichment (default 55 — lavere fordi vi mangler folk) */
    scoreGrænse: number;
  };
}

/**
 * DEFAULT filter-værdier. Brain Layer kan ændre runtime via `setScoreThreshold()`,
 * `setMissingFaggrupper()` osv. — men resettes ved næste kørsel.
 */
export const DEFAULT_FILTERS: FilterConfig = {
  virksomheder: {
    branchekoder: [
      "41.10", "41.20",
      "43.11", "43.12", "43.13",
      "43.21", "43.22", "43.29",
      "43.31", "43.32", "43.33",
      "43.34", "43.39", "43.41",
      "43.99",
    ],
    postnrZoner: [
      ...range(1000, 1100),      // 1000-1099 indre København
      ...range(1100, 2000),      // 1100-1999 ydre indre by
      ...range(2000, 3000),      // 2000-2999 Storkøbenhavn + omegn
    ],
    antalAnsatteMin: 3,
    antalAnsatteMax: 250,
    minimumAlder: 1,
    kræverHjemmeside: false,
    scoreGrænse: 65,
  },

  private: {
    signalTyper: [
      "byggetilladelse_aktiv",
      "byggetilladelse_ny",
      "nysolgt_enfamilie",
      "facebook_søger_håndværker",
    ],
    postnrZoner: [
      "2300", "2400", "2450", "2500",
      "2100", "2200",
      ...range(1000, 2000),
    ],
    boligTyper: ["enfamiliehus", "rækkehus", "villa"],
    scoreGrænse: 60,
  },

  medarbejdere: {
    faggrupper: FAGGRUPPE_CONFIG,
    dagligtMål: 20,
    fordeling: "behovsstyret",
    geografiRadius: "Sjælland",
    åbenForArbejde: true,
    erfaringMinimumAar: 2,
    scoreGrænse: 55,
  },
};

// ── Runtime mutable state ────────────────────────────────────────────────────
// Brain Layer skriver hertil før en kørsel; runner.ts og qualifier.ts læser.

let runtimeFilters: FilterConfig = structuredClone(DEFAULT_FILTERS);

/** Hent nuværende filter-state (mutationer fra Brain er allerede applied) */
export function getCurrentFilters(): FilterConfig {
  return runtimeFilters;
}

/** Reset til defaults (kald ved start af hver scheduled run) */
export function resetFilters(): void {
  runtimeFilters = structuredClone(DEFAULT_FILTERS);
}

/** Brain justerer score-tærskel for én kategori */
export function setScoreThreshold(
  category: "virksomheder" | "private" | "medarbejdere",
  value: number,
): void {
  runtimeFilters[category].scoreGrænse = Math.max(0, Math.min(100, value));
}

/** Brain markerer hvilke faggrupper der mangler — bruges af scoreEmployee */
let currentMissingFaggrupper: Faggruppe[] = [];

export function setMissingFaggrupper(list: Faggruppe[]): void {
  currentMissingFaggrupper = list;
}

export function getMissingFaggrupper(): Faggruppe[] {
  return currentMissingFaggrupper;
}

// ── Gap Filler: progressiv filter-udvidelse ──────────────────────────────────

/**
 * Udvider filtre for én kategori, kaldt af gap-runner når vi rammer under 20 leads.
 * Hvert attempt-trin gør filtrene mere "generøse" — accept lavere score, bredere
 * geografi, drop nice-to-have krav.
 *
 * @param category "virksomheder" | "private" | "medarbejdere"
 * @param attempt  0 = første retry, 1 = anden, osv. (max 2 anbefalet)
 */
export function expandFilters(
  category: "virksomheder" | "private" | "medarbejdere",
  attempt: number,
): { applied: string; threshold: number } {
  if (category === "medarbejdere") {
    const m = runtimeFilters.medarbejdere;
    if (attempt === 0) {
      m.scoreGrænse = Math.max(40, m.scoreGrænse - 8);
      return { applied: `medarbejdere.scoreGrænse → ${m.scoreGrænse} (−8)`, threshold: m.scoreGrænse };
    }
    if (attempt === 1) {
      m.geografiRadius = "Danmark";
      m.scoreGrænse = Math.max(40, m.scoreGrænse - 5);
      return { applied: `medarbejdere.geografi → Danmark, scoreGrænse → ${m.scoreGrænse}`, threshold: m.scoreGrænse };
    }
    // attempt 2+: drop åbenForArbejde
    m.åbenForArbejde = false;
    m.scoreGrænse = Math.max(40, m.scoreGrænse - 5);
    return { applied: `medarbejdere.åbenForArbejde=false, scoreGrænse → ${m.scoreGrænse}`, threshold: m.scoreGrænse };
  }

  if (category === "private") {
    const p = runtimeFilters.private;
    if (attempt === 0) {
      p.scoreGrænse = Math.max(40, p.scoreGrænse - 8);
      return { applied: `private.scoreGrænse → ${p.scoreGrænse} (−8)`, threshold: p.scoreGrænse };
    }
    if (attempt === 1) {
      // Udvid postnr-zoner til hele Sjælland
      p.postnrZoner = [...p.postnrZoner, ...range(3000, 5000)];
      p.scoreGrænse = Math.max(40, p.scoreGrænse - 5);
      return { applied: `private.postnr → Sjælland udvidet, scoreGrænse → ${p.scoreGrænse}`, threshold: p.scoreGrænse };
    }
    p.scoreGrænse = Math.max(40, p.scoreGrænse - 5);
    return { applied: `private.scoreGrænse → ${p.scoreGrænse}`, threshold: p.scoreGrænse };
  }

  // virksomheder
  const v = runtimeFilters.virksomheder;
  if (attempt === 0) {
    v.scoreGrænse = Math.max(45, v.scoreGrænse - 8);
    return { applied: `virksomheder.scoreGrænse → ${v.scoreGrænse} (−8)`, threshold: v.scoreGrænse };
  }
  if (attempt === 1) {
    v.antalAnsatteMin = Math.max(1, v.antalAnsatteMin - 1);
    v.scoreGrænse = Math.max(45, v.scoreGrænse - 5);
    return { applied: `virksomheder.antalAnsatteMin → ${v.antalAnsatteMin}, scoreGrænse → ${v.scoreGrænse}`, threshold: v.scoreGrænse };
  }
  v.scoreGrænse = Math.max(45, v.scoreGrænse - 5);
  return { applied: `virksomheder.scoreGrænse → ${v.scoreGrænse}`, threshold: v.scoreGrænse };
}

// ── Lookup helpers ───────────────────────────────────────────────────────────

/**
 * Slå op hvilken faggruppe en CVR-branchekode hører til.
 * Returnerer null hvis koden ikke matcher nogen af vores 9 fag.
 */
export function branchekodeTilFaggruppe(branchekode: string): Faggruppe | null {
  for (const [faggruppe, cfg] of Object.entries(FAGGRUPPE_CONFIG) as [Faggruppe, FaggruppeConfig][]) {
    if (cfg.cvr.includes(branchekode)) return faggruppe;
  }
  return null;
}

/**
 * Slå op hvilken faggruppe en fri-tekst titel/industry matcher (case-insens.).
 * Returnerer null hvis ingen match.
 */
export function titelTilFaggruppe(text: string): Faggruppe | null {
  const lower = text.toLowerCase();
  for (const [faggruppe, cfg] of Object.entries(FAGGRUPPE_CONFIG) as [Faggruppe, FaggruppeConfig][]) {
    if (cfg.terms.some((t) => lower.includes(t.toLowerCase()))) return faggruppe;
  }
  return null;
}
