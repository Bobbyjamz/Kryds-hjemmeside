import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readHelbedTraining, writeHelbedTraining, generateHelbedId } from "@/lib/helbred-db";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const training = await readHelbedTraining(date);
  return NextResponse.json({ training });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const body = await req.json();
  const training = await readHelbedTraining(date);
  const session2 = { id: generateHelbedId(), adjustedBySarah: false, color: "#5DCAA5", ...body };
  await writeHelbedTraining(date, [...training, session2]);
  return NextResponse.json({ session: session2 });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const body = await req.json();
  const training = await readHelbedTraining(date);
  const updated = training.map((t) => t.id === body.id ? { ...t, ...body } : t);
  await writeHelbedTraining(date, updated);
  return NextResponse.json({ training: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const id = req.nextUrl.searchParams.get("id");
  const training = await readHelbedTraining(date);
  await writeHelbedTraining(date, training.filter((t) => t.id !== id));
  return NextResponse.json({ ok: true });
}
