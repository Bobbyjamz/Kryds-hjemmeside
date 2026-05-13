import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
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
  EmailMemoryEntry,
  LeadBotConfig,
} from "./types";
import { DEFAULT_LEADBOT_CONFIG } from "./types";

// ── Generic helpers ────────────────────────────────────────────────────────

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const val = await redis.get<T>(key);
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

async function kvSet<T>(key: string, data: T): Promise<void> {
  try {
    await redis.set(key, data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`KV-database fejl ved skrivning til "${key}": ${msg}. Tjek at UPSTASH_REDIS_REST_URL og UPSTASH_REDIS_REST_TOKEN er sat på Vercel.`);
  }
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

// ── Email memory (Sarah lærer hvad der virker) ─────────────────────────────

export async function readEmailMemory(): Promise<EmailMemoryEntry[]> {
  return kvGet<EmailMemoryEntry[]>("email-memory", []);
}
export async function writeEmailMemory(entries: EmailMemoryEntry[]): Promise<void> {
  return kvSet("email-memory", entries);
}

/** Tilføjer en ny entry og holder listen på max 500 — vi kasserer den ældste først */
export async function appendEmailMemory(entry: EmailMemoryEntry): Promise<void> {
  const existing = await readEmailMemory();
  const next = [...existing, entry].slice(-500);
  await writeEmailMemory(next);
}

// ── LeadBot config ─────────────────────────────────────────────────────────

export async function readLeadBotConfig(): Promise<LeadBotConfig> {
  const stored = await kvGet<Partial<LeadBotConfig> | null>("leadbot:config", null);
  if (!stored) return DEFAULT_LEADBOT_CONFIG;
  // Merge med defaults så nye felter altid har en værdi
  return {
    ...DEFAULT_LEADBOT_CONFIG,
    ...stored,
    enabledSources: {
      ...DEFAULT_LEADBOT_CONFIG.enabledSources,
      ...(stored.enabledSources ?? {}),
    },
  };
}

export async function writeLeadBotConfig(config: LeadBotConfig): Promise<void> {
  return kvSet("leadbot:config", config);
}

// ── LeadBot v2: Daglig statistik (Brain Layer + Gap Analyzer) ──────────────

export interface LeadBotDailyStats {
  date: string;                          // ISO yyyy-mm-dd
  company: number;
  private: number;
  employee: number;
  faggrupper: Record<string, number>;    // { VVS: 3, El: 2, Tømrer: 8, ... }
  brainNote?: string;                    // Hvad Brain besluttede
  runtimeSeconds?: number;
}

const DAILY_STATS_PREFIX = "leadbot:daily-stats:";

/** Læs én dags statistik (ISO yyyy-mm-dd). Returnerer null hvis intet gemt. */
export async function readDailyStats(date: string): Promise<LeadBotDailyStats | null> {
  return kvGet<LeadBotDailyStats | null>(`${DAILY_STATS_PREFIX}${date}`, null);
}

/** Gem én dags statistik. Overskriver hvis eksisterer. */
export async function writeDailyStats(stats: LeadBotDailyStats): Promise<void> {
  await kvSet(`${DAILY_STATS_PREFIX}${stats.date}`, stats);
}

/** Hent de N seneste dages statistik (nyeste først). Bruges af feedback-loop. */
export async function readRecentDailyStats(days: number = 7): Promise<LeadBotDailyStats[]> {
  const today = new Date();
  const results: LeadBotDailyStats[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const stats = await readDailyStats(iso);
    if (stats) results.push(stats);
  }
  return results;
}

// ── LeadBot v2: Feedback insights (ugentlig Claude-analyse) ────────────────

export interface LeadBotFeedbackInsights {
  /** ISO timestamp for hvornår analysen blev kørt */
  analyzedAt: string;
  /** Periode analysen dækker (ISO datoer) */
  periodFrom: string;
  periodTo: string;
  /** Top-line metrics */
  totalSent: number;
  totalOpened: number;
  openRate: number;             // 0-1
  /** Per-kategori open-rates */
  byCategory: {
    company: { sent: number; opened: number; openRate: number };
    private: { sent: number; opened: number; openRate: number };
    employee: { sent: number; opened: number; openRate: number };
  };
  /** Per-faggruppe open-rates for medarbejdere */
  byFaggruppe: Record<string, { sent: number; opened: number; openRate: number }>;
  /** Per-kilde open-rates */
  bySource: Record<string, { sent: number; opened: number; openRate: number }>;
  /** Score-bracket performance (50-59, 60-69, 70-79, 80+) */
  byScoreBracket: Record<string, { sent: number; opened: number; openRate: number }>;
  /** Claude's tekstuelle indsigt — bruges af brain.ts */
  insights: string;
  /** Konkrete justeringer Brain bør lave næste gang */
  suggestedAdjustments: {
    /** Sænk eller hæv per-kategori threshold (delta points) */
    thresholdDelta?: { company?: number; private?: number; employee?: number };
    /** Faggrupper Brain bør prioritere (god ROI) */
    boostFaggrupper?: string[];
    /** Faggrupper Brain bør de-prioritere (lav ROI) */
    deboostFaggrupper?: string[];
    /** Kilder Brain bør sætte først */
    boostSources?: string[];
  };
}

const FEEDBACK_KEY = "leadbot:feedback:latest";

export async function readFeedbackInsights(): Promise<LeadBotFeedbackInsights | null> {
  return kvGet<LeadBotFeedbackInsights | null>(FEEDBACK_KEY, null);
}

export async function writeFeedbackInsights(insights: LeadBotFeedbackInsights): Promise<void> {
  await kvSet(FEEDBACK_KEY, insights);
}
