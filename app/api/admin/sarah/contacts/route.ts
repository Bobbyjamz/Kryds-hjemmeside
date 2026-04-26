import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readSarahContacts, writeSarahContacts } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readSarahContacts());
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const contacts = await readSarahContacts();
  await writeSarahContacts(contacts.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...updates } = await req.json();
  const contacts = await readSarahContacts();
  const idx = contacts.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  contacts[idx] = { ...contacts[idx], ...updates };
  await writeSarahContacts(contacts);
  return NextResponse.json({ ok: true });
}
