import { NextResponse } from "next/server";
import { blokerEmail } from "@/lib/outreach/suppression";
import { Webhook } from "svix";
import {
  readLeads, writeLeads,
  readSarahContacts, writeSarahContacts,
} from "@/lib/db";

export const runtime = "nodejs";

// Resend poster bounce-/complaint-events hertil. Kun email.bounced + email.complained
// behandles — alt andet kvitteres med 200 så Resend ikke prøver igen.
const HANDLED = new Set(["email.bounced", "email.complained"]);

function extractEmails(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const to = (data as { to?: unknown }).to;
  if (Array.isArray(to)) return to.filter((x): x is string => typeof x === "string");
  if (typeof to === "string") return [to];
  return [];
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET mangler" }, { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let evt: { type?: string; data?: unknown };
  try {
    evt = new Webhook(secret).verify(payload, headers) as { type?: string; data?: unknown };
  } catch {
    return NextResponse.json({ error: "Ugyldig signatur" }, { status: 401 });
  }

  const type = evt.type ?? "";
  if (!HANDLED.has(type)) {
    return NextResponse.json({ ok: true, ignored: type });
  }

  const emails = extractEmails(evt.data).map((e) => e.toLowerCase().trim());
  if (emails.length === 0) {
    return NextResponse.json({ ok: true, matched: 0 });
  }

  const isComplaint = type === "email.complained";
  const ts = new Date().toISOString();
  let matched = 0;

  // ── Leads ──────────────────────────────────────────────────────────────
  const leads = await readLeads();
  let leadsChanged = false;
  const nextLeads = leads.map((l) => {
    if (!l.email || !emails.includes(l.email.toLowerCase().trim())) return l;
    matched++;
    leadsChanged = true;
    return isComplaint
      ? { ...l, emailComplained: true, emailComplainedAt: ts, updatedAt: ts }
      : { ...l, emailBounced: true, emailBouncedAt: ts, updatedAt: ts };
  });
  if (leadsChanged) await writeLeads(nextLeads);

  // Global suppression: klage = permanent blok; bounce = blok (dod adresse).
  for (const e of emails) {
    await blokerEmail(e, isComplaint ? "klage" : "bounce");
  }

  // ── Sarah-kontakter ────────────────────────────────────────────────────
  // Spam-klage = hård afmelding (stop al mail). Bounce = flag, så opfølgning skipper.
  const contacts = await readSarahContacts();
  let contactsChanged = false;
  const nextContacts = contacts.map((c) => {
    if (!c.email || !emails.includes(c.email.toLowerCase().trim())) return c;
    matched++;
    contactsChanged = true;
    return isComplaint
      ? { ...c, status: "unsubscribed" as const, emailComplainedAt: ts }
      : { ...c, emailBounced: true, emailBouncedAt: ts };
  });
  if (contactsChanged) await writeSarahContacts(nextContacts);

  return NextResponse.json({ ok: true, type, matched });
}