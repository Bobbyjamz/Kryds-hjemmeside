import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { Employee, Shift, FeedMessage, CouncilSession, SarahContact, SarahLog, SarahRun, Tilbud, ResetToken, Customer } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const EMPLOYEES_FILE = path.join(DATA_DIR, "employees.json");
const SHIFTS_FILE = path.join(DATA_DIR, "shifts.json");
const FEED_FILE = path.join(DATA_DIR, "feed.json");
const COUNCIL_FILE = path.join(DATA_DIR, "council.json");
const SARAH_CONTACTS_FILE = path.join(DATA_DIR, "sarah-contacts.json");
const SARAH_LOG_FILE = path.join(DATA_DIR, "sarah-log.json");
const SARAH_RUNS_FILE = path.join(DATA_DIR, "sarah-runs.json");
const TILBUD_FILE = path.join(DATA_DIR, "tilbud.json");
const RESET_TOKENS_FILE = path.join(DATA_DIR, "reset-tokens.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function readEmployees(): Promise<Employee[]> {
  return readJson<Employee[]>(EMPLOYEES_FILE, []);
}

export async function writeEmployees(employees: Employee[]): Promise<void> {
  return writeJson(EMPLOYEES_FILE, employees);
}

export async function readShifts(): Promise<Shift[]> {
  return readJson<Shift[]>(SHIFTS_FILE, []);
}

export async function writeShifts(shifts: Shift[]): Promise<void> {
  return writeJson(SHIFTS_FILE, shifts);
}

export async function readFeed(): Promise<FeedMessage[]> {
  return readJson<FeedMessage[]>(FEED_FILE, []);
}

export async function writeFeed(messages: FeedMessage[]): Promise<void> {
  return writeJson(FEED_FILE, messages);
}

export async function readCouncilSessions(): Promise<CouncilSession[]> {
  return readJson<CouncilSession[]>(COUNCIL_FILE, []);
}

export async function writeCouncilSessions(sessions: CouncilSession[]): Promise<void> {
  return writeJson(COUNCIL_FILE, sessions);
}

export function generateId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function findEmployeeById(id: string): Promise<Employee | null> {
  const employees = await readEmployees();
  return employees.find((e) => e.id === id) ?? null;
}

// Normalize phone numbers for comparison. We strip every non-digit character
// (spaces, "+", dashes, parentheses) and compare the last 8 digits so that
// "+45 31 22 44 77", "+4531224477", "31 22 44 77" and "31224477" all match.
function normalizePhone(phone: string): string {
  const digits = String(phone).replace(/\D/g, "");
  return digits.slice(-8);
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

// ── Sarah ──────────────────────────────────────────────────────────────────

export async function readSarahContacts(): Promise<SarahContact[]> {
  return readJson<SarahContact[]>(SARAH_CONTACTS_FILE, []);
}
export async function writeSarahContacts(contacts: SarahContact[]): Promise<void> {
  return writeJson(SARAH_CONTACTS_FILE, contacts);
}
export async function readSarahLog(): Promise<SarahLog[]> {
  return readJson<SarahLog[]>(SARAH_LOG_FILE, []);
}
export async function writeSarahLog(log: SarahLog[]): Promise<void> {
  return writeJson(SARAH_LOG_FILE, log);
}
export async function readSarahRuns(): Promise<SarahRun[]> {
  return readJson<SarahRun[]>(SARAH_RUNS_FILE, []);
}
export async function writeSarahRuns(runs: SarahRun[]): Promise<void> {
  return writeJson(SARAH_RUNS_FILE, runs);
}

// ── Tilbud ─────────────────────────────────────────────────────────────────

export async function readTilbud(): Promise<Tilbud[]> {
  return readJson<Tilbud[]>(TILBUD_FILE, []);
}
export async function writeTilbud(tilbud: Tilbud[]): Promise<void> {
  return writeJson(TILBUD_FILE, tilbud);
}

// ── Reset tokens ───────────────────────────────────────────────────────────

export async function readResetTokens(): Promise<ResetToken[]> {
  return readJson<ResetToken[]>(RESET_TOKENS_FILE, []);
}
export async function writeResetTokens(tokens: ResetToken[]): Promise<void> {
  return writeJson(RESET_TOKENS_FILE, tokens);
}

// ── Customers ──────────────────────────────────────────────────────────────

export async function readCustomers(): Promise<Customer[]> {
  return readJson<Customer[]>(CUSTOMERS_FILE, []);
}
export async function writeCustomers(customers: Customer[]): Promise<void> {
  return writeJson(CUSTOMERS_FILE, customers);
}
