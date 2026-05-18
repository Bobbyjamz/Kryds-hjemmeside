import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";

const ADMIN_COOKIE = "kryds-admin-session";
const EMPLOYEE_COOKIE = "kryds-employee-session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET er ikke sat eller for kort (min. 32 tegn for HS256-sikkerhed)");
  }
  return new TextEncoder().encode(secret);
}

export interface AdminPayload {
  role: "admin";
  username: string;
}

export interface EmployeePayload {
  role: "employee";
  employeeId: string;
}

type SessionPayload = AdminPayload | EmployeePayload;

export async function signToken(payload: SessionPayload, expiresIn = "7d"): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken<T extends SessionPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

async function getAdminHash(): Promise<string | null> {
  // Check data/admin-config.json first (set by forgot-password flow)
  try {
    const configPath = path.join(process.cwd(), "data", "admin-config.json");
    const raw = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(raw) as { passwordHash?: string };
    if (config.passwordHash) return config.passwordHash;
  } catch {}
  // Prefer base64-encoded hash (workaround for Next.js dotenv-expand stripping $)
  const b64 = process.env.ADMIN_PASSWORD_HASH_B64;
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch {
      return null;
    }
  }
  return process.env.ADMIN_PASSWORD_HASH || null;
}

export async function verifyAdminPassword(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedHash = await getAdminHash();
  if (!expectedUser || !expectedHash) return false;
  if (username !== expectedUser) return false;
  return bcrypt.compare(password, expectedHash);
}

export async function setAdminCookie(username: string): Promise<void> {
  const token = await signToken({ role: "admin", username });
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function setEmployeeCookie(employeeId: string): Promise<void> {
  const token = await signToken({ role: "employee", employeeId });
  const store = await cookies();
  store.set(EMPLOYEE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function clearEmployeeCookie(): Promise<void> {
  const store = await cookies();
  store.delete(EMPLOYEE_COOKIE);
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken<AdminPayload>(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function getEmployeeSession(): Promise<EmployeePayload | null> {
  const store = await cookies();
  const token = store.get(EMPLOYEE_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken<EmployeePayload>(token);
  if (!payload || payload.role !== "employee") return null;
  return payload;
}
