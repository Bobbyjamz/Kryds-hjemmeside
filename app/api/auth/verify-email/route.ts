import { NextRequest, NextResponse } from "next/server";
import { readEmailTokens, writeEmailTokens, readEmployees, writeEmployees } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token mangler" }, { status: 400 });
    }

    const tokens = await readEmailTokens();
    const found = tokens.find(
      (t) => t.token === token && !t.used && new Date(t.expiresAt) > new Date()
    );

    if (!found) {
      return NextResponse.json({ error: "Ugyldigt eller udløbet bekræftelseslink" }, { status: 400 });
    }

    await writeEmailTokens(tokens.map((t) => (t.token === token ? { ...t, used: true } : t)));

    const employees = await readEmployees();
    await writeEmployees(
      employees.map((e) =>
        e.id === found.employeeId
          ? { ...e, emailVerified: true, status: "LEDIG" as const, updatedAt: new Date().toISOString() }
          : e
      )
    );

    return NextResponse.json({ ok: true, email: found.email });
  } catch (err) {
    console.error("[verify-email]", err);
    return NextResponse.json({ error: "Bekræftelse fejlede" }, { status: 500 });
  }
}
