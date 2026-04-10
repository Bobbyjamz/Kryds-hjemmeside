import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readShifts, writeShifts } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const { id } = await params;
  const shifts = await readShifts();
  const shift = shifts.find((s) => s.id === id);
  if (!shift) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  return NextResponse.json({ shift });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const { id } = await params;
  const patch = await req.json();
  const shifts = await readShifts();
  const idx = shifts.findIndex((s) => s.id === id);
  if (idx === -1) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  const allowed = [
    "title",
    "trade",
    "location",
    "startAt",
    "endAt",
    "hourlyRate",
    "description",
    "signups",
    "assignedTo",
    "status",
  ];
  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in patch) filtered[key] = patch[key];
  }
  shifts[idx] = { ...shifts[idx], ...filtered, updatedAt: new Date().toISOString() };
  await writeShifts(shifts);
  return NextResponse.json({ ok: true, shift: shifts[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const { id } = await params;
  const shifts = await readShifts();
  const filtered = shifts.filter((s) => s.id !== id);
  if (filtered.length === shifts.length) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  await writeShifts(filtered);
  return NextResponse.json({ ok: true });
}
