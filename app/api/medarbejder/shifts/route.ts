import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/auth";
import { readShifts, findEmployeeById } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  const employee = await findEmployeeById(session.employeeId);
  if (!employee) return NextResponse.json({ error: "Medarbejder ikke fundet" }, { status: 404 });

  const shifts = await readShifts();
  const now = new Date().toISOString();

  // Åbne vagter: OPEN status, matchende trade, ikke før nu
  const open = shifts
    .filter((s) => s.status === "OPEN" && s.trade === employee.trade && s.startAt > now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  // Mine vagter: medarbejder er tilknyttet (signup eller assigned)
  const mine = shifts
    .filter((s) => s.signups.includes(employee.id) || s.assignedTo === employee.id)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return NextResponse.json({
    employee: {
      id: employee.id,
      name: employee.name,
      trade: employee.trade,
      status: employee.status,
    },
    open,
    mine,
  });
}
