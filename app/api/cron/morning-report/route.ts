/**
 * Daglig morgenrapport — kl. 08:00 dansk tid (06:00 UTC)
 *
 * Sender én SMS til admin med dagens KPI-puls:
 *  - Nye leads (New + Analyzed)
 *  - Sarah-emails sendt (denne uge)
 *  - Svar modtaget (replied + meeting)
 *  - Tilbud der afventer svar > 3 dage
 *  - Ledige medarbejdere
 *
 * Vercel cron: "0 6 * * *"  (06:00 UTC = 08:00 DK vintertid / 08:00 CEST - 2h offset)
 */

import { NextRequest, NextResponse } from "next/server";
import { readLeads, readSarahContacts, readTilbud, readEmployees } from "@/lib/db";
import { notifyAdmin } from "@/lib/sms";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  // Kun Vercel Cron eller CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [leads, contacts, tilbud, employees] = await Promise.all([
      readLeads(),
      readSarahContacts(),
      readTilbud(),
      readEmployees(),
    ]);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Ugens start (mandag)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // ── Leads ────────────────────────────────────────────────────────────────
    const newLeads = leads.filter((l) => l.status === "New" || l.status === "Analyzed");
    const sentThisWeek = leads.filter(
      (l) => l.status === "Sent" && l.sentAt && l.sentAt >= weekStartStr
    );

    // ── Sarah-kontakter ──────────────────────────────────────────────────────
    const replies = contacts.filter((c) => c.status === "replied" || c.status === "meeting");
    const sentContactsWeek = contacts.filter(
      (c) => c.emailSentAt && c.emailSentAt >= weekStartStr
    );

    const totalEmailsWeek = sentThisWeek.length + sentContactsWeek.length;
    const totalReplies = replies.length;

    // ── Tilbud der afventer svar > 3 dage ────────────────────────────────────
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const awaitingTilbud = tilbud.filter(
      (t) => t.status === "sent" && t.sentAt && t.sentAt <= threeDaysAgo
    );

    // ── Ledige medarbejdere ───────────────────────────────────────────────────
    const ledige = employees.filter((e) => e.status === "LEDIG");

    // ── Byg SMS ───────────────────────────────────────────────────────────────
    const lines: string[] = [];

    const dayNames = ["Søn", "Man", "Tirs", "Ons", "Tors", "Fre", "Lør"];
    const dayName = dayNames[now.getDay()];
    lines.push(`KrydsByg ${dayName} ☀️`);
    lines.push(`Leads: ${newLeads.length} klar til Sarah`);
    lines.push(`Emails uge: ${totalEmailsWeek} sendt · ${totalReplies} svar`);

    if (awaitingTilbud.length > 0) {
      const names = awaitingTilbud.slice(0, 2).map((t) => t.clientName).join(", ");
      lines.push(`⚠️ ${awaitingTilbud.length} tilbud afventer svar: ${names}`);
    }

    lines.push(`Ledige: ${ledige.length} medarbejdere`);

    // Ekstra motivations-linje baseret på ugedag
    if (now.getDay() === 1) lines.push("God uge! 💪");
    else if (now.getDay() === 5) lines.push("God weekend! 🎉");

    const smsText = lines.join("\n");

    await notifyAdmin(smsText);

    return NextResponse.json({
      ok: true,
      smsText,
      stats: {
        newLeads: newLeads.length,
        emailsSentWeek: totalEmailsWeek,
        replies: totalReplies,
        awaitingTilbud: awaitingTilbud.length,
        ledige: ledige.length,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[morning-report]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
