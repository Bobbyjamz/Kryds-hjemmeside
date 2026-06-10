export type LeadType = "company" | "private" | "employee";

// ── KrydsByg 9 fagområder ───────────────────────────────────────────────────
export type Faggruppe =
  | "Tømrer"
  | "Murer"
  | "VVS"
  | "El"
  | "Maler"
  | "Gulv"
  | "Stillads"
  | "Jord"
  | "Råbyg";

export const ALL_FAGGRUPPER: Faggruppe[] = [
  "Tømrer", "Murer", "VVS", "El", "Maler", "Gulv", "Stillads", "Jord", "Råbyg",
];

/** Faggrupper hvor branchen har størst mangel — Brain prioriterer dem */
export const KRITISKE_FAGGRUPPER: Faggruppe[] = ["VVS", "El", "Stillads"];

// ── Brain Layer types ───────────────────────────────────────────────────────

/** Tæller af leads per kategori (for én dag eller akkumuleret) */
export interface CategoryStats {
  company: number;
  private: number;
  employee: number;
}

/** Tæller af medarbejder-leads per faggruppe */
export type FaggruppeStats = Partial<Record<Faggruppe, number>>;

/** Komplet gårsdags-statistik som Brain modtager */
export interface YesterdayStats extends CategoryStats {
  faggrupper: FaggruppeStats;
  date?: string;          // ISO yyyy-mm-dd
  conversionRate?: number;
}

/** Plan Brain returnerer — bruges af runner og gap-filler */
export interface DailyPlan {
  priorities: LeadType[];                            // Rangordnet kategori-fokus
  scraperOrder: Partial<Record<LeadType, string[]>>; // Hvilke scrapers først
  missingFaggrupper: Faggruppe[];                    // Hvilke faggrupper mangler
  adjustScores: CategoryStats;                       // Dynamiske score-tærskler
  note: string;                                      // Forklaring fra Claude
  dynamicScrapeTargets?: ScrapeTarget[];            // Valgfri: AI-scrape vilkaarlige URLs
}

/** Et enkelt scrape-maal som ScrapeGraphAI-kilden kan koere (kurateret eller Brain-genereret). */
export interface ScrapeTarget {
  url: string;
  prompt: string;
  leadType: LeadType;
  source: string;
}

export interface LeadCandidate {
  companyName: string;       // For private: adresse eller navn
  contactName?: string;
  contactTitle?: string;     // "Direktør", "Formand", "Jobsøger", osv.
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  cvr?: string;
  industry?: string;
  serviceType?: string;
  budget?: string;           // Estimeret budget som "15.000–20.000"
  notes?: string;            // Struktureret Sarah-brief + context
  source: string;
  leadType: LeadType;

  // Qualifier-felter
  score?: number;            // 0-100 — sættes af qualifier.ts
  employees?: number;        // Antal ansatte (fra CVR eller scrape)
  yearFounded?: number;      // Stiftelsesår
  branchekode?: string;      // CVR branchekode fx "43.32"

  // Private-specifikke felter
  buildingPermit?: boolean;  // Har aktiv byggetilladelse (OIS/BBR signal)
  salePrice?: number;        // Salgspris (kr) fra Boligsiden
  propertyType?: string;     // "enfamiliehus", "andelsbolig", osv.

  // Medarbejder-specifikke felter
  openToWork?: boolean;      // Markeret "Open to Work"
  experienceYears?: number;  // Erfaringsår
  tradeCategory?: Faggruppe | string; // 9 fagområder — fri streng for bagudkompat.
  lastActiveDays?: number;   // Dage siden CV/profil sidst aktiv (JobIndex/LinkedIn)
}
