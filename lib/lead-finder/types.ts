export type LeadType = "company" | "private" | "employee";

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
  tradeCategory?: string;    // "Tømrer", "Murer", "VVS", osv.
}
