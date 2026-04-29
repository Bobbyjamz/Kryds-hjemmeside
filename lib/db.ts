import { kv } from "@vercel/kv";
import crypto from "crypto";
import type {
  Employee,
  Shift,
  FeedMessage,
  CouncilSession,
  SarahContact,
  SarahLog,
  SarahRun,
  Tilbud,
  ResetToken,
  Customer,
  EmailVerificationToken,
  Lead,
} from "./types";

// ── Generic helpers ────────────────────────────────────────────────────────

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const val = await kv.get<T>(key);
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

async function kvSet<T>(key: string, data: T): Promise<void> {
  await kv.set(key, data);
}

// ── ID generator ──────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomBytes(8).toString("hex");
}

// ── Employees ─────────────────────────────────────────────────────────────

export async function readEmployees(): Promise<Employee[]> {
  return kvGet<Employee[]>("employees", []);
}
export async function writeEmployees(employees: Employee[]): Promise<void> {
  return kvSet("employees", employees);
}

// Normalize phone numbers — strip non-digits, compare last 8 digits
function normalizePhone(phone: string): string {
  const digits = String(phone).replace(/\D/g, "");
  return digits.slice(-8);
}

export async function findEmployeeById(id: string): Promise<Employee | null> {
  const employees = await readEmployees();
  return employees.find((e) => e.id === id) ?? null;
}

export async function findEmployeeByCredentials(phone: string, birthDate: string): Promise<Employee | null> {
  const employees = await readEmployees();
  const normalized = normalizePhone(phone);
  return employees.find((e) => normalizePhone(e.phone) === normalized && e.birthDate === birthDate) ?? null;
}

export async function findEmployeeByPhoneAndCode(phone: string, code: string): Promise<Employee | null> {
  const employees = await readEmployees();
  const normalized = normalizePhone(phone);
  return employees.find(
    (e) => normalizePhone(e.phone) === normalized && e.confirmationCode === code && e.confirmed === true
  ) ?? null;
}

export async function findEmployeeByEmailAndCode(email: string, code: string): Promise<Employee | null> {
  const employees = await readEmployees();
  const normalizedEmail = email.toLowerCase().trim();
  return employees.find(
    (e) => e.email?.toLowerCase().trim() === normalizedEmail && e.confirmationCode === code && e.confirmed === true
  ) ?? null;
}

// ── Shifts ────────────────────────────────────────────────────────────────

export async function readShifts(): Promise<Shift[]> {
  return kvGet<Shift[]>("shifts", []);
}
export async function writeShifts(shifts: Shift[]): Promise<void> {
  return kvSet("shifts", shifts);
}

// ── Feed ──────────────────────────────────────────────────────────────────

export async function readFeed(): Promise<FeedMessage[]> {
  return kvGet<FeedMessage[]>("feed", []);
}
export async function writeFeed(messages: FeedMessage[]): Promise<void> {
  return kvSet("feed", messages);
}

// ── Council ───────────────────────────────────────────────────────────────

export async function readCouncilSessions(): Promise<CouncilSession[]> {
  return kvGet<CouncilSession[]>("council", []);
}
export async function writeCouncilSessions(sessions: CouncilSession[]): Promise<void> {
  return kvSet("council", sessions);
}

// ── Sarah ──────────────────────────────────────────────────────────────────

export async function readSarahContacts(): Promise<SarahContact[]> {
  return kvGet<SarahContact[]>("sarah-contacts", []);
}
export async function writeSarahContacts(contacts: SarahContact[]): Promise<void> {
  return kvSet("sarah-contacts", contacts);
}

export async function readSarahLog(): Promise<SarahLog[]> {
  return kvGet<SarahLog[]>("sarah-log", []);
}
export async function writeSarahLog(log: SarahLog[]): Promise<void> {
  return kvSet("sarah-log", log);
}

export async function readSarahRuns(): Promise<SarahRun[]> {
  return kvGet<SarahRun[]>("sarah-runs", []);
}
export async function writeSarahRuns(runs: SarahRun[]): Promise<void> {
  return kvSet("sarah-runs", runs);
}

// ── Tilbud ─────────────────────────────────────────────────────────────────

export async function readTilbud(): Promise<Tilbud[]> {
  return kvGet<Tilbud[]>("tilbud", []);
}
export async function writeTilbud(tilbud: Tilbud[]): Promise<void> {
  return kvSet("tilbud", tilbud);
}

// ── Reset tokens ───────────────────────────────────────────────────────────

export async function readResetTokens(): Promise<ResetToken[]> {
  return kvGet<ResetToken[]>("reset-tokens", []);
}
export async function writeResetTokens(tokens: ResetToken[]): Promise<void> {
  return kvSet("reset-tokens", tokens);
}

// ── Customers ──────────────────────────────────────────────────────────────

export async function readCustomers(): Promise<Customer[]> {
  return kvGet<Customer[]>("customers", []);
}
export async function writeCustomers(customers: Customer[]): Promise<void> {
  return kvSet("customers", customers);
}

// ── Email verification tokens ──────────────────────────────────────────────

export async function readEmailTokens(): Promise<EmailVerificationToken[]> {
  return kvGet<EmailVerificationToken[]>("email-tokens", []);
}
export async function writeEmailTokens(tokens: EmailVerificationToken[]): Promise<void> {
  return kvSet("email-tokens", tokens);
}

// ── Leads ──────────────────────────────────────────────────────────────────

export async function readLeads(): Promise<Lead[]> {
  return kvGet<Lead[]>("leads", []);
}
export async function writeLeads(leads: Lead[]): Promise<void> {
  return kvSet("leads", leads);
}
