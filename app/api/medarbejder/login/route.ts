import { NextRequest, NextResponse } from "next/server";
import { findEmployeeByPhoneAndCode } from "@/lib/db";
import { setEmployeeCookie, setAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "Telefon og adgangskode er påkrævet" }, { status: 400 });
    }

    // Check if credentials match admin env vars → redirect to admin
    const adminPhone = process.env.ADMIN_PHONE;
    const adminCode = process.env.ADMIN_CODE;
    if (
      adminPhone &&
      adminCode &&
      String(phone).trim() === adminPhone.trim() &&
      String(code).trim() === adminCode.trim()
    ) {
      await setAdminCookie(process.env.ADMIN_USERNAME || "admin");
      return NextResponse.json({ ok: true, redirect: "/admin" });
    }

    const employee = await findEmployeeByPhoneAndCode(String(phone), String(code));
    if (!employee) {
      return NextResponse.json({ error: "Forkert telefonnummer eller adgangskode" }, { status: 401 });
    }
    if (employee.status === "INAKTIV") {
      return NextResponse.json({ error: "Din konto er inaktiv. Kontakt Kryds." }, { status: 403 });
    }
    await setEmployeeCookie(employee.id);
    return NextResponse.json({ ok: true, employeeId: employee.id });
  } catch (err) {
    console.error("[medarbejder/login]", err);
    return NextResponse.json({ error: "Login fejlede" }, { status: 500 });
  }
}
