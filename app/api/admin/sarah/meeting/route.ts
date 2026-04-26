import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readSarahContacts, writeSarahContacts, readSarahLog, writeSarahLog, generateId } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, proposedTime } = await req.json();
  const contacts = await readSarahContacts();
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) return NextResponse.json({ error: "Kontakt ikke fundet" }, { status: 404 });

  // Gem møde-forslag som note på kontakten
  const updated = contacts.map((c) =>
    c.id === contactId ? { ...c, notes: `Møde foreslået: ${proposedTime}` } : c
  );
  await writeSarahContacts(updated);

  const log = await readSarahLog();
  log.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    action: "meeting_created",
    contactId,
    contactName: contact.name,
    contactEmail: contact.email,
    details: `Møde foreslået: ${proposedTime}`,
  });
  await writeSarahLog(log);

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, meetingTime, approved } = await req.json();
  if (!approved) return NextResponse.json({ ok: true, message: "Møde afvist" });

  const contacts = await readSarahContacts();
  const updated = contacts.map((c) =>
    c.id === contactId ? { ...c, status: "meeting" as const, meetingAt: meetingTime } : c
  );
  await writeSarahContacts(updated);

  const contact = contacts.find((c) => c.id === contactId);
  const log = await readSarahLog();
  log.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    action: "meeting_created",
    contactId,
    contactName: contact?.name ?? "",
    contactEmail: contact?.email ?? "",
    details: `Møde bekræftet: ${meetingTime}`,
  });
  await writeSarahLog(log);

  return NextResponse.json({ ok: true, meetingTime });
}
