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
