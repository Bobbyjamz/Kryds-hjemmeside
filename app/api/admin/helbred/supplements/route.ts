import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  readHelbedSupplements,
  writeHelbedSupplements,
  readHelbedSupplementLog,
  writeHelbedSupplementLog,
} from "@/lib/helbred-db";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const [supplements, takenLog] = await Promise.all([
    readHelbedSupplements(),
    readHelbedSupplementLog(date),
  ]);
  return NextResponse.json({ supplements, takenLog });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const body = await req.json();

  if (body.takenLog !== undefined) {
    // Update taken log for a date
    const date = req.nextUrl.searchParams.get("date") ?? todayISO();
    await writeHelbedSupplementLog(date, body.takenLog);
    return NextResponse.json({ takenLog: body.takenLog });
  }

  if (body.supplements !== undefined) {
    // Update the supplement stack
    await writeHelbedSupplements(body.supplements);
    return NextResponse.json({ supplements: body.supplements });
  }

  return NextResponse.json({ error: "Ukendt handling" }, { status: 400 });
}
