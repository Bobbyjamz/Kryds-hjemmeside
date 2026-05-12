export interface Reference {
  name: string;
  phone?: string;
  company?: string;
  relation?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  emailVerified?: boolean;
  birthDate: string; // YYYY-MM-DD
  trade: string;
  skills: string[];
  experience?: string;
  notes?: string;
  photoPath?: string;
  cvPath?: string;
  references: Reference[];
  status: "LEDIG" | "UDSENDT" | "INAKTIV" | "AFVENTER_BEKRÆFTELSE";
  employeeType: "MEDARBEJDER" | "KOORDINATOR";
  acceptedTerms: boolean;
  acceptedAt?: string;
  contractVersion?: string;
  acceptedMedarbejderVilkaar?: boolean;
  acceptedGdpr?: boolean;
  confirmedAge?: boolean;
  confirmationCode?: string;
  confirmed?: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Kompetence-profil
  desiredTrades?: string[];
  employmentType?: "fuldtid" | "deltid" | "begge";
  hoursPerWeek?: number;
  availableFrom?: string;
  driverLicense?: boolean;
  ownTools?: boolean;
  languages?: string[];
  certifications?: string[];
  preferredAreas?: string[];
  salaryExpectation?: number;
  bio?: string;
  // Onboarding-mail (Sarah skriver, admin bekræfter inden afsendelse)
  onboardingDraftSubject?: string;
  onboardingDraftBody?: string;
  onboardingDraftCreatedAt?: string;
  onboardingApprovedAt?: string;
  onboardingSentAt?: string;
  // Vagt-historik
  completedShifts?: number;        // Antal vagter fuldført (til performance-tracking)
  rating?: number;                  // 1-5 baseret på admin-vurdering efter vagter
}

export interface Shift {
  id: string;
  title: string;
  trade: string;
  location: string;
  startAt: string; // ISO datetime
  endAt: string;
  hourlyRate?: number;
  description?: string;
  signups: string[]; // employee ids
  assignedTo?: string; // employee id
  status: "OPEN" | "FILLED" | "CANCELLED" | "COMPLETED";
  autoMatchSent?: boolean;
  matchedEmployeeIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedMessage {
  id: string;
  title: string;
  body: string;
  authorName: string;
  priority: "normal" | "urgent";
  createdAt: string;
}

export type AdvisorRole = "economy" | "marketing" | "operations" | "risk";

export interface CouncilMessage {
  role: "user" | "assistant";
  advisorRole: AdvisorRole;
  content: string;
  createdAt: string;
}

export interface CouncilSession {
  id: string;
  advisorRole: AdvisorRole;
  messages: CouncilMessage[];
  createdAt: string;
  updatedAt: string;
}

export const ADVISORS: Record<AdvisorRole, { label: string; description: string }> = {
  economy:    { label: "Økonomi",    description: "Budgetter, priser, lønsomhed" },
  marketing:  { label: "Marketing",  description: "Synlighed, brand, leadgenerering" },
  operations: { label: "Drift",      description: "Processer, vagter, koordinering" },
  risk:       { label: "Risiko",     description: "Juridisk, forsikring, compliance" },
};

// ── Sarah – Autonom Outreach ────────────────────────────────────────────────

export type SarahStatus =
  | "pending"
  | "emailed"
  | "followed_up"
  | "replied"
  | "meeting"
  | "closed";

export interface SarahContact {
  id: string;
  name: string;
  email: string;
  company: string;
  trade: string;
  type: "medarbejder" | "partner" | "privat";
  status: SarahStatus;
  emailSentAt?: string;
  followUpSentAt?: string;
  repliedAt?: string;
  meetingAt?: string;
  notes?: string;
  generatedEmail?: string;
  councilAdvice?: string;
  createdAt: string;
}

export interface SarahLog {
  id: string;
  timestamp: string;
  action: "email_sent" | "followup_sent" | "reply_received" | "meeting_created" | "notification_sent";
  contactId: string;
  contactName: string;
  contactEmail: string;
  details?: string;
}

export interface SarahRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  emailsSent: number;
  followUpsSent: number;
  status: "running" | "completed" | "error";
}

// ── Reset tokens – glemt kode ──────────────────────────────────────────────

export interface ResetToken {
  token: string;
  email?: string;
  phone?: string;
  expiresAt: string;
  used: boolean;
  type: "admin" | "employee";
  userId?: string;
}

// ── Customer – CRM ─────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  type: "privat" | "virksomhed";
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  cvr?: string;
  address?: string;
  trade?: string;
  notes?: string;
  status: "lead" | "aktiv" | "inaktiv";
  createdAt: string;
  lastContactedAt?: string;
  source?: string;
}

// ── Email verification ─────────────────────────────────────────────────────

export interface EmailVerificationToken {
  token: string;
  email: string;
  employeeId: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

// ── Leads – Sarah & Council ────────────────────────────────────────────────

export type LeadStatus =
  | "New"
  | "Analyzed"
  | "Drafted"
  | "Approved"
  | "Sent"
  | "Rejected"
  | "Needs Review";

export interface SarahBriefing {
  openingLine: string;        // Foreslået åbnings-sætning (første linje i body)
  painPoints: string[];       // 2-3 specifikke pain points der skal adresseres
  keyServices: string[];      // 1-2 KrydsByg-ydelser der er mest relevante for dette lead
  subjectOptions: string[];   // 2 forslag til emnelinje (Sarah vælger den bedste)
  callToAction: string;       // Præcis CTA i sidste linje (f.eks. "Ring torsdag kl. 14")
}

export interface CouncilAnalysis {
  leadScore: number;
  customerType: string;
  recommendedAngle: string;
  tone: string;
  risks: string[];
  salesAdvice: string;
  brandAdvice: string;
  operationsAdvice: string;
  financeAdvice: string;
  finalRecommendation: string;
  sarahBriefing?: SarahBriefing;  // Konkret skrive-instruktion til Sarah
  analyzedAt: string;
}

// Email-hukommelse: gemmer metadata fra hver afsendt mail så Sarah lærer hvad der virker
export interface EmailMemoryEntry {
  industry?: string;
  serviceType?: string;
  angle: string;            // Den vinkel Council anbefalede
  tone: string;
  subjectLine: string;
  bodyLength: number;       // Antal tegn i body — fortæller om kort/lang virker bedst
  councilScore: number;
  customerType: string;
  sentAt: string;
  leadId: string;
  // Lærings-signal: sættes hvis admin manuelt rettede Sarahs udkast inden afsendelse
  wasEdited?: boolean;
  editSummary?: string;     // Kort tekst der beskriver hvad der blev ændret
}

export interface ExcelColumnMapping {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  industry?: string;
  city?: string;
  website?: string;
  notes?: string;
  serviceType?: string;
  personalAngle?: string;
}

export type LeadType = "company" | "private" | "employee";

export interface Lead {
  id: string;
  companyName: string;
  contactName?: string;
  contactTitle?: string;     // Direktør, Formand, Jobsøger, osv.
  email: string;
  phone?: string;
  industry?: string;
  city?: string;
  website?: string;
  notes?: string;
  serviceType?: string;
  personalAngle?: string;
  budget?: string;           // Estimeret budget
  leadType?: LeadType;       // company | private | employee (valgfri for bagudkompatibilitet)
  status: LeadStatus;
  qualifierScore?: number;      // 0-100 — sat af qualifier.ts ved scraping
  councilScore?: number;
  councilAnalysis?: CouncilAnalysis;
  draftSubject?: string;
  draftBody?: string;
  draftCreatedAt?: string;
  approvedAt?: string;
  sentAt?: string;
  // Opfølgnings-tracking (Sarah email pipeline)
  followUp1SentAt?: string;   // 5-dages opfølgning
  followUp2SentAt?: string;   // 14-dages sidste forsøg (m. retainer-pitch)
  emailOpened?: boolean;      // Sat af Resend webhook
  emailOpenedAt?: string;
  // SMS-outreach (leads med telefon men ingen email)
  smsSentAt?: string;         // Dag 0 SMS — Sarah's korte besked
  smsBody?: string;           // Teksten der blev sendt
  sourceFile?: string;
  createdAt: string;
  updatedAt: string;
}

// ── LeadBot – ekstern scraper-konfiguration ────────────────────────────────

export interface LeadBotConfig {
  updatedAt: string;
  updatedBy?: string;

  /** Fritekst-fokus som Sarah skriver til LeadBot — "lige nu vil vi gerne…" */
  focus: string;

  /** Søgeord der skal prioriteres på alle kilder. Tomt = brug adapters defaults. */
  priorityQueries: string[];

  /** Søgeord/firmanavne der skal filtreres fra. */
  excludeQueries: string[];

  /** Geografiske områder (byer/kommuner). Tomt = hele DK. */
  cities: string[];

  /** Hvilken lead-type vil vi helst have? */
  leadTypeFocus: "company" | "employee" | "both";

  /** Toggle hver kilde til/fra. */
  enabledSources: {
    jobindex: boolean;
    linkedin: boolean;
    facebook: boolean;
    cvr: boolean;
    googlemaps: boolean;
    thehub: boolean;
    jobnet: boolean;
    indeed: boolean;
  };

  /** Kvalitetsfilter — 0–1, default 0.5 (kun emails ≥ denne tærskel pushes). */
  minEmailConfidence: number;

  /** Max antal leads pr. døgn — hvis 0 = ingen begrænsning. */
  dailyLeadCap: number;
}

export const DEFAULT_LEADBOT_CONFIG: LeadBotConfig = {
  updatedAt: "1970-01-01T00:00:00.000Z",
  focus: "",
  priorityQueries: [],
  excludeQueries: [],
  cities: [],
  leadTypeFocus: "both",
  enabledSources: {
    jobindex: true,
    linkedin: true,
    facebook: true,
    cvr: true,
    googlemaps: true,
    thehub: true,
    jobnet: true,
    indeed: false, // lavt volumen, proxy-only — default fra
  },
  minEmailConfidence: 0.5,
  dailyLeadCap: 100,
};

// ── Tilbud – Council-assisteret ────────────────────────────────────────────

export type TilbudStatus = "draft" | "sent" | "accepted" | "rejected";

export interface Tilbud {
  id: string;
  clientName: string;
  clientEmail: string;
  taskDescription: string;
  trade: string;
  estimatedHours: number;
  hourlyRate: number;
  materialsCost: number;
  totalExVat: number;
  totalIncVat: number;
  councilNotes?: string;
  generatedText?: string;
  status: TilbudStatus;
  validDays: number;
  createdAt: string;
  sentAt?: string;
}
