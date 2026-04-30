import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminSession } from "@/lib/auth";
import {
  readSarahContacts, writeSarahContacts,
  readSarahLog, writeSarahLog,
  readSarahRuns, writeSarahRuns,
  generateId,
} from "@/lib/db";
import { buildEmailFromContact } from "@/lib/sarah-templates";
import { notifyAdmin } from "@/lib/sms";
import type { SarahLog } from "@/lib/types";

export const runtime = "nodejs";
// Outreach-kald tager tid — øg timeout til 5 min (Vercel Pro) eller brug Edge kø
export const maxDuration = 300;

const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");
const FROM = process.env.RESEND_FROM ?? "Sarah <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  try {
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      html,
      text,
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
    // Daglig grænse — start med 15, kan øges til 100 senere via env var
    const dailyLimit = parseInt(process.env.SARAH_DAILY_LIMIT ?? "15", 10);
    const pending = contacts.filter((c) => c.status === "pending").slice(0, dailyLimit);

    for (const contact of pending) {
      try {
        const { subject, html, text, templateKey } = buildEmailFromContact(contact);
        const sent = await sendEmail(contact.email, subject, html, text);
        if (sent) {
          const idx = updated.findIndex((c) => c.id === contact.id);
          updated[idx] = {
            ...contact,
            status: "emailed",
            emailSentAt: now,
            generatedEmail: html,
            councilAdvice: `Skabelon: ${templateKey}`,
          };
          emailsSent++;
          newLogs.push({
            id: generateId(),
            timestamp: now,
            action: "email_sent",
            contactId: contact.id,
            contactName: contact.name,
            contactEmail: contact.email,
            details: `${templateKey}: ${subject}`,
          });
          // Resend rate-limit: maks 2 emails/sekund — vi venter 600ms mellem hver
          await new Promise((r) => setTimeout(r, 600));
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
        // Opfølgning: brug samme skabelon, men tilføj kort opfølgnings-præfix i emnet
        const { subject, html, text, templateKey } = buildEmailFromContact(contact);
        const followupSubject = `Re: ${subject}`;
        const sent = await sendEmail(contact.email, followupSubject, html, text);
        if (sent) {
          const idx = updated.findIndex((c) => c.id === contact.id);
          updated[idx] = { ...contact, status: "followed_up", followUpSentAt: now };
          followUpsSent++;
          newLogs.push({
            id: generateId(),
            timestamp: now,
            action: "followup_sent",
            contactId: contact.id,
            contactName: contact.name,
            contactEmail: contact.email,
            details: `${templateKey} (opfølgning)`,
          });
          await new Promise((r) => setTimeout(r, 600));
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

  // SMS til admin med kørselsresultat
  if (mode === "email" && emailsSent > 0) {
    await notifyAdmin(`KrydsByg Sarah: ${emailsSent} outreach-emails sendt. Tjek admin-panelet for status.`);
  } else if (mode === "followup" && followUpsSent > 0) {
    await notifyAdmin(`KrydsByg Sarah: ${followUpsSent} opfølgnings-emails sendt.`);
  }

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
