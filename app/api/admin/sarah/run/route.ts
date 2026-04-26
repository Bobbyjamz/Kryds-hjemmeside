import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminSession } from "@/lib/auth";
import {
  readSarahContacts, writeSarahContacts,
  readSarahLog, writeSarahLog,
  readSarahRuns, writeSarahRuns,
  generateId,
} from "@/lib/db";
import { getCouncilAdviceForEmail, generateOutreachEmail } from "@/lib/council";
import type { SarahLog } from "@/lib/types";

export const runtime = "nodejs";
// Outreach-kald tager tid — øg timeout til 5 min (Vercel Pro) eller brug Edge kø
export const maxDuration = 300;

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Sarah <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <div style="background:#F5C400;padding:10px 18px;margin-bottom:24px;">
          <p style="margin:0;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#0C0C0A;">✕ KRYDSBYG</p>
        </div>
        <div style="color:#222;font-size:15px;line-height:1.6;white-space:pre-wrap;">${body}</div>
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;color:#888;font-size:12px;">
          KrydsByg ApS · CVR: 46369947 · kontakt@krydsbyg.com · krydsbyg.com
        </div>
      </div>`,
      text: body,
    });
    return true;
  } catch (err) {
    console.error("Resend fejl:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mode = "email" } = await req.json().catch(() => ({}));
  const contacts = await readSarahContacts();
  const log = await readSarahLog();
  const runs = await readSarahRuns();
  const now = new Date().toISOString();

  const runId = generateId();
  runs.push({ id: runId, startedAt: now, emailsSent: 0, followUpsSent: 0, status: "running" });
  await writeSarahRuns(runs);

  let emailsSent = 0;
  let followUpsSent = 0;
  const newLogs: SarahLog[] = [];
  const updated = [...contacts];

  if (mode === "email") {
    const pending = contacts.filter((c) => c.status === "pending").slice(0, 15);
    for (const contact of pending) {
      try {
        const advice = await getCouncilAdviceForEmail(contact);
        const { subject, body } = await generateOutreachEmail(contact, advice, false);
        const sent = await sendEmail(contact.email, subject, body);
        if (sent) {
          const idx = updated.findIndex((c) => c.id === contact.id);
          updated[idx] = { ...contact, status: "emailed", emailSentAt: now, councilAdvice: advice, generatedEmail: body };
          emailsSent++;
          newLogs.push({ id: generateId(), timestamp: now, action: "email_sent", contactId: contact.id, contactName: contact.name, contactEmail: contact.email, details: subject });
        }
      } catch (err) {
        console.error(`Sarah fejl (${contact.email}):`, err);
      }
    }
  }

  if (mode === "followup") {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const needFollowUp = contacts
      .filter((c) => c.status === "emailed" && c.emailSentAt && c.emailSentAt < cutoff)
      .slice(0, 10);
    for (const contact of needFollowUp) {
      try {
        const { subject, body } = await generateOutreachEmail(contact, contact.councilAdvice ?? "", true);
        const sent = await sendEmail(contact.email, subject, body);
        if (sent) {
          const idx = updated.findIndex((c) => c.id === contact.id);
          updated[idx] = { ...contact, status: "followed_up", followUpSentAt: now };
          followUpsSent++;
          newLogs.push({ id: generateId(), timestamp: now, action: "followup_sent", contactId: contact.id, contactName: contact.name, contactEmail: contact.email });
        }
      } catch (err) {
        console.error(`Sarah opfølgning fejl (${contact.email}):`, err);
      }
    }
  }

  await writeSarahContacts(updated);
  await writeSarahLog([...log, ...newLogs]);

  const runIdx = runs.findIndex((r) => r.id === runId);
  runs[runIdx] = { ...runs[runIdx], completedAt: new Date().toISOString(), emailsSent, followUpsSent, status: "completed" };
  await writeSarahRuns(runs);

  return NextResponse.json({ ok: true, emailsSent, followUpsSent });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [contacts, log, runs] = await Promise.all([
    readSarahContacts(), readSarahLog(), readSarahRuns(),
  ]);
  return NextResponse.json({ contacts, log, runs });
}
