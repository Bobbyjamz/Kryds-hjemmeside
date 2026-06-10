import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
});

// ── Types ─────────────────────────────────────────────────────────────────

export interface HelbedLog {
  date: string;
  readiness: number;
  hrv: number;
  sleepHours: number;
  sleepMinutes: number;
  sleepScore: number;
  sleepEfficiency: number;
  bodyBattery: number;
  restingHr: number;
  steps: number;
  stepsGoal: number;
  caloriesEaten: number;
  calorieTarget: number;
  proteinNow: number;
  proteinGoal: number;
  carbsNow: number;
  carbsGoal: number;
  fatNow: number;
  fatGoal: number;
  waterNow: number;
  waterGoal: number;
  vo2max: number;
  trainingLoad: string;
  notes: string;
}

export interface HelbedMeal {
  id: string;
  time: string;
  name: string;
  items: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  logged: boolean;
  suggestedBySarah: boolean;
}

export interface HelbedSupplement {
  id: string;
  name: string;
  dose: string;
  reason: string;
  when: "Morgen" | "Aften";
  color: string;
  active: boolean;
  sarahPriority: boolean;
  sortOrder: number;
}

export interface HelbedTrainingSession {
  id: string;
  time: string;
  duration: number;
  type: string;
  subtitle: string;
  color: string;
  adjustedBySarah: boolean;
}

export interface HelbedChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface HelbedSettings {
  googleCalendarRefreshToken?: string;
  googleCalendarId?: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_LOG: Omit<HelbedLog, "date"> = {
  readiness: 0,
  hrv: 0,
  sleepHours: 0,
  sleepMinutes: 0,
  sleepScore: 0,
  sleepEfficiency: 0,
  bodyBattery: 0,
  restingHr: 0,
  steps: 0,
  stepsGoal: 10000,
  caloriesEaten: 0,
  calorieTarget: 2200,
  proteinNow: 0,
  proteinGoal: 180,
  carbsNow: 0,
  carbsGoal: 220,
  fatNow: 0,
  fatGoal: 65,
  waterNow: 0,
  waterGoal: 2.8,
  vo2max: 0,
  trainingLoad: "",
  notes: "",
};

export const DEFAULT_SUPPLEMENTS: HelbedSupplement[] = [
  { id: "1", name: "Magnesium Glycinat", dose: "400mg", reason: "Søvn & restitution", when: "Aften", color: "#378ADD", active: true, sarahPriority: false, sortOrder: 1 },
  { id: "2", name: "Omega-3 EPA/DHA", dose: "2g", reason: "HRV & inflammation", when: "Morgen", color: "#FAC775", active: true, sarahPriority: false, sortOrder: 2 },
  { id: "3", name: "Kreatin Monohydrat", dose: "5g", reason: "Styrke & kognitiv", when: "Morgen", color: "#5DCAA5", active: true, sarahPriority: false, sortOrder: 3 },
  { id: "4", name: "D-vitamin + K2", dose: "4000 IU", reason: "Immunforsvar", when: "Morgen", color: "#7F77DD", active: true, sarahPriority: false, sortOrder: 4 },
  { id: "5", name: "Ashwagandha KSM-66", dose: "600mg", reason: "Stressreduktion", when: "Aften", color: "#C77BD9", active: true, sarahPriority: true, sortOrder: 5 },
  { id: "6", name: "Koffein + L-Theanin", dose: "100/200mg", reason: "Fokus · ikke før 14:00", when: "Morgen", color: "#E4364A", active: true, sarahPriority: false, sortOrder: 6 },
];

// ── Helpers ───────────────────────────────────────────────────────────────

async function hGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const val = await redis.get<T>(key);
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

async function hSet<T>(key: string, data: T): Promise<void> {
  await redis.set(key, data);
}

export function generateHelbedId(): string {
  return crypto.randomBytes(6).toString("hex");
}

// ── Daily log ─────────────────────────────────────────────────────────────

export async function readHelbedLog(date: string): Promise<HelbedLog> {
  const stored = await hGet<Partial<HelbedLog> | null>(`helbred:log:${date}`, null);
  return { ...DEFAULT_LOG, ...stored, date };
}

export async function writeHelbedLog(log: HelbedLog): Promise<void> {
  await hSet(`helbred:log:${log.date}`, log);
}

export async function readRecentLogs(days = 7): Promise<HelbedLog[]> {
  const today = new Date();
  const result: HelbedLog[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    result.push(await readHelbedLog(date));
  }
  return result;
}

// ── Meals ─────────────────────────────────────────────────────────────────

export async function readHelbedMeals(date: string): Promise<HelbedMeal[]> {
  return hGet<HelbedMeal[]>(`helbred:meals:${date}`, []);
}

export async function writeHelbedMeals(date: string, meals: HelbedMeal[]): Promise<void> {
  await hSet(`helbred:meals:${date}`, meals);
}

// ── Supplements ───────────────────────────────────────────────────────────

export async function readHelbedSupplements(): Promise<HelbedSupplement[]> {
  const stored = await hGet<HelbedSupplement[] | null>("helbred:supplements", null);
  return stored ?? DEFAULT_SUPPLEMENTS;
}

export async function writeHelbedSupplements(supplements: HelbedSupplement[]): Promise<void> {
  await hSet("helbred:supplements", supplements);
}

export async function readHelbedSupplementLog(date: string): Promise<Record<string, boolean>> {
  return hGet<Record<string, boolean>>(`helbred:suplog:${date}`, {});
}

export async function writeHelbedSupplementLog(date: string, log: Record<string, boolean>): Promise<void> {
  await hSet(`helbred:suplog:${date}`, log);
}

// ── Training ──────────────────────────────────────────────────────────────

export async function readHelbedTraining(date: string): Promise<HelbedTrainingSession[]> {
  return hGet<HelbedTrainingSession[]>(`helbred:training:${date}`, []);
}

export async function writeHelbedTraining(date: string, sessions: HelbedTrainingSession[]): Promise<void> {
  await hSet(`helbred:training:${date}`, sessions);
}

// ── Sarah chat ────────────────────────────────────────────────────────────

export async function readHelbedChat(): Promise<HelbedChatMessage[]> {
  return hGet<HelbedChatMessage[]>("helbred:chat", []);
}

export async function writeHelbedChat(messages: HelbedChatMessage[]): Promise<void> {
  await hSet("helbred:chat", messages.slice(-120));
}

// ── Settings (incl. Google Calendar OAuth tokens) ─────────────────────────

export async function readHelbedSettings(): Promise<HelbedSettings> {
  return hGet<HelbedSettings>("helbred:settings", {});
}

export async function writeHelbedSettings(settings: HelbedSettings): Promise<void> {
  await hSet("helbred:settings", settings);
}
