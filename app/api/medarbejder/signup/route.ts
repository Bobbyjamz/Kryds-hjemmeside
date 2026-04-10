import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/auth";
import { readShifts, writeShifts } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  try {
    const { shiftId, action } = await req.json();
    if (!shiftId) return NextResponse.json({ error: "Mangler shiftId" }, { status: 400 });
    const shifts = await readShifts();
    const idx = shifts.findIndex((s) => s.id === shiftId);
    if (idx === -1) return NextResponse.json({ error: "Vagt ikke fundet" }, { status: 404 });
    const shift = shifts[idx];
    if (action === "withdraw") {
      shift.signups = shift.signups.filter((id) => id !== session.employeeId);
    } else {
      if (shift.status !== "OPEN") return NextResponse.json({ error: "Vagten er ikke åben" }, { status: 400 });
      if (!shift.signups.includes(session.employeeId)) {
        shift.signups.push(session.employeeId);
      }
    }
    shift.updatedAt = new Date().toISOString();
    shifts[idx] = shift;
    await writeShifts(shifts);
    return NextResponse.json({ ok: true, shift });
  } catch (err) {
    console.error("[medarbejder/signup]", err);
    return NextResponse.json({ error: "Fejlede" }, { status: 500 });
  }
}
