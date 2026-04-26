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
  birthDate: string; // YYYY-MM-DD
  trade: string;
  skills: string[];
  experience?: string;
  notes?: string;
  photoPath?: string;
  cvPath?: string;
  references: Reference[];
  status: "LEDIG" | "UDSENDT" | "INAKTIV";
  employeeType: "MEDARBEJDER" | "KOORDINATOR";
  acceptedTerms: boolean;
  acceptedAt?: string;
  contractVersion?: string;
  confirmationCode?: string;
  confirmed?: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  type: "medarbejder" | "partner";
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
