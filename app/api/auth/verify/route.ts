import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { readResetTokens, writeResetTokens, readEmployees, writeEmployees } from "@/lib/db";
import { setAdminCookie, setEmployeeCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { code, newPassword, type = "admin" } = await req.json() as {
    code: string;
    newPassword: string;
    type?: "admin" | "employee";
  };

  if (!code || !newPassword) {
    return NextResponse.json({ error: "Kode og nyt kodeord er påkrævet" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Kodeord skal være mindst 6 tegn" }, { status: 400 });
  }

  const tokens = await readResetTokens();
  const token = tokens.find(
    (t) => t.token === code && !t.used && new Date(t.expiresAt) > new Date() && t.type === type
  );

  if (!token) {
    return NextResponse.json({ error: "Ugyldig eller udløbet kode" }, { status: 400 });
  }

  // Mark token used
  await writeResetTokens(tokens.map((t) => (t.token === code ? { ...t, used: true } : t)));

  const hash = await bcrypt.hash(newPassword, 10);

  if (type === "admin") {
    const configPath = path.join(process.cwd(), "data", "admin-config.json");
    await fs.writeFile(
      configPath,
      JSON.stringify({ passwordHash: hash, updatedAt: new Date().toISOString() }),
      "utf8"
    );
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    await setAdminCookie(adminUsername);
    return NextResponse.json({ ok: true });
  }

  if (type === "employee") {
    const employees = await readEmployees();
    const emp = employees.find(
      (e) => (token.email && e.email === token.email) || (token.phone && e.phone === token.phone)
    );
    if (!emp) {
      return NextResponse.json({ error: "Medarbejder ikke fundet" }, { status: 404 });
    }
    await writeEmployees(
      employees.map((e) =>
        e.id === emp.id ? { ...e, confirmationCode: hash, updatedAt: new Date().toISOString() } : e
      )
    );
    await setEmployeeCookie(emp.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ukendt type" }, { status: 400 });
}
