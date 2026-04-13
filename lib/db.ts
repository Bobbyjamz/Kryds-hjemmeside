import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { Employee, Shift } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const EMPLOYEES_FILE = path.join(DATA_DIR, "employees.json");
const SHIFTS_FILE = path.join(DATA_DIR, "shifts.json");

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

export function generateId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function findEmployeeById(id: string): Promise<Employee | null> {
  const employees = await readEmployees();
  return employees.find((e) => e.id === id) ?? null;
}

export async function findEmployeeByCredentials(phone: string, birthDate: string): Promise<Employee | null> {
  const employees = await readEmployees();
  const normalized = phone.replace(/\s/g, "");
  return employees.find((e) => e.phone.replace(/\s/g, "") === normalized && e.birthDate === birthDate) ?? null;
}

export async function findEmployeeByPhoneAndCode(phone: string, code: string): Promise<Employee | null> {
  const employees = await readEmployees();
  const normalized = phone.replace(/\s/g, "");
  return employees.find(
    (e) => e.phone.replace(/\s/g, "") === normalized && e.confirmationCode === code && e.confirmed === true
  ) ?? null;
}
