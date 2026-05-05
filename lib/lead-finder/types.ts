export type LeadType = "company" | "private" | "employee";

export interface LeadCandidate {
  companyName: string;       // For private: navn eller "Privat — Adresse"
  contactName?: string;      // Kontaktperson / navn
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
  notes?: string;            // AI-genereret "Sarahs noter" note
  source: string;
  leadType: LeadType;        // Hvilken kategori — altid udfyldt
}
