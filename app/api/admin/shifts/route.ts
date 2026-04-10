import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readShifts, writeShifts, generateId } from "@/lib/db";
import type { Shift } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const shifts = await readShifts();
  return NextResponse.json({ shifts });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  try {
    const body = await req.json();
    const { title, trade, location, startAt, endAt, hourlyRate, description } = body;
    if (!title?.trim() || !trade?.trim() || !startAt || !endAt) {
      return NextResponse.json({ error: "Titel, fag, start- og sluttid er påkrævet" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const shift: Shift = {
      id: generateId(),
      title: String(title).trim(),
      trade: String(trade).trim(),
      location: String(location || "").trim(),
      startAt: String(startAt),
      endAt: String(endAt),
      hourlyRate: typeof hourlyRate === "number" ? hourlyRate : hourlyRate ? Number(hourlyRate) : undefined,
      description: description ? String(description).trim() : undefined,
      signups: [],
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    };
    const shifts = await readShifts();
    shifts.push(shift);
    await writeShifts(shifts);
    return NextResponse.json({ ok: true, shift }, { status: 201 });
  } catch (err) {
    console.error("[admin/shifts POST]", err);
    return NextResponse.json({ error: "Fejlede" }, { status: 500 });
  }
}
