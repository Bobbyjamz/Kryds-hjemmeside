import { NextRequest, NextResponse } from "next/server";
import { findEmployeeByCredentials } from "@/lib/db";
import { setEmployeeCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phone, birthDate } = await req.json();
    if (!phone || !birthDate) {
      return NextResponse.json({ error: "Telefon og fødselsdato er påkrævet" }, { status: 400 });
    }
    const employee = await findEmployeeByCredentials(String(phone), String(birthDate));
    if (!employee) {
      return NextResponse.json({ error: "Ingen medarbejder med de oplysninger" }, { status: 401 });
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
