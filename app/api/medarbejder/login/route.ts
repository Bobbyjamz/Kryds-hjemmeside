import { NextRequest, NextResponse } from "next/server";
import { findEmployeeByEmailAndCode } from "@/lib/db";
import { setEmployeeCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email og adgangskode er påkrævet" }, { status: 400 });
    }

    const employee = await findEmployeeByEmailAndCode(String(email), String(code));
    if (!employee) {
      return NextResponse.json({ error: "Forkert email eller adgangskode" }, { status: 401 });
    }
    if (employee.status === "INAKTIV") {
      return NextResponse.json({ error: "Din konto er inaktiv. Kontakt Kryds." }, { status: 403 });
    }
    if (employee.status === "AFVENTER_BEKRÆFTELSE") {
      return NextResponse.json({ error: "Bekræft din email først — tjek din indbakke." }, { status: 403 });
    }
    await setEmployeeCookie(employee.id);
    return NextResponse.json({ ok: true, employeeId: employee.id });
  } catch (err) {
    console.error("[medarbejder/login]", err);
    return NextResponse.json({ error: "Login fejlede" }, { status: 500 });
  }
}
