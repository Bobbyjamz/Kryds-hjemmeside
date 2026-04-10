import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readEmployees, writeEmployees, generateId } from "@/lib/db";
import { CONTRACT_VERSION } from "@/lib/contract";
import type { Employee } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const employees = await readEmployees();
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  try {
    const body = await req.json();
    const { name, phone, email, birthDate, trade, skills, experience, notes, employeeType } = body;
    if (!name?.trim() || !phone?.trim() || !birthDate?.trim() || !trade?.trim()) {
      return NextResponse.json({ error: "Navn, telefon, fødselsdato og fag er påkrævet" }, { status: 400 });
    }
    const employees = await readEmployees();
    const normalizedPhone = String(phone).replace(/\s/g, "");
    if (employees.find((e) => e.phone.replace(/\s/g, "") === normalizedPhone)) {
      return NextResponse.json({ error: "Telefonnummer findes allerede" }, { status: 409 });
    }
    const now = new Date().toISOString();
    const employee: Employee = {
      id: generateId(),
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      birthDate: String(birthDate).trim(),
      trade: String(trade).trim(),
      skills: Array.isArray(skills) ? skills : [],
      experience: experience ? String(experience).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      references: [],
      status: "LEDIG",
      employeeType: employeeType === "KOORDINATOR" ? "KOORDINATOR" : "MEDARBEJDER",
      acceptedTerms: true,
      acceptedAt: now,
      contractVersion: CONTRACT_VERSION,
      createdAt: now,
      updatedAt: now,
    };
    employees.push(employee);
    await writeEmployees(employees);
    return NextResponse.json({ ok: true, employee }, { status: 201 });
  } catch (err) {
    console.error("[admin/employees POST]", err);
    return NextResponse.json({ error: "Fejlede" }, { status: 500 });
  }
}
