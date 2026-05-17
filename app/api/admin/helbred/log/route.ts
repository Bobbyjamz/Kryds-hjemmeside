import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readHelbedLog, writeHelbedLog } from "@/lib/helbred-db";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const log = await readHelbedLog(date);
  return NextResponse.json({ log });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const body = await req.json();
  const existing = await readHelbedLog(date);
  const updated = { ...existing, ...body, date };
  await writeHelbedLog(updated);
  return NextResponse.json({ log: updated });
}
