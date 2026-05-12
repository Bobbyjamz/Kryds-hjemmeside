import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readEmployees, writeEmployees } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const { id } = await params;
  const employees = await readEmployees();
  const employee = employees.find((e) => e.id === id);
  if (!employee) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const { id } = await params;
  const patch = await req.json();
  const employees = await readEmployees();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  const allowed = [
    "name",
    "phone",
    "email",
    "birthDate",
    "trade",
    "skills",
    "experience",
    "notes",
    "photoPath",
    "cvPath",
    "references",
    "status",
    "employeeType",
    "acceptedTerms",       // Admin-aktivering: bekræft manuelt
    "acceptedAt",
    "contractVersion",
  ];
  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in patch) filtered[key] = patch[key];
  }
  employees[idx] = { ...employees[idx], ...filtered, updatedAt: new Date().toISOString() };
  await writeEmployees(employees);
  return NextResponse.json({ ok: true, employee: employees[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const { id } = await params;
  const employees = await readEmployees();
  const filtered = employees.filter((e) => e.id !== id);
  if (filtered.length === employees.length) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  await writeEmployees(filtered);
  return NextResponse.json({ ok: true });
}
