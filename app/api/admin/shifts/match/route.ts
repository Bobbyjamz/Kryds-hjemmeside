/**
 * Sender vagt-tilbud til udvalgte medarbejdere (eller alle ledige der matcher fag).
 *
 * Body: { shiftId, employeeIds?: string[] }
 *   - Hvis employeeIds er angivet: send kun til dem
 *   - Hvis ikke: send til alle LEDIG-medarbejdere med matchende fag (legacy adfærd)
 *
 * Hver medarbejder modtager både email og SMS hvis muligt.
 */

import { NextRequest, NextResponse } from "next/server";
import { readShifts, writeShifts, readEmployees } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";
import { Resend } from "resend";
import { TRADES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shiftId, employeeIds } = await req.json();
  if (!shiftId) return NextResponse.json({ error: "shiftId påkrævet" }, { status: 400 });

  const [shifts, employees] = await Promise.all([readShifts(), readEmployees()]);
  const shift = shifts.find((s) => s.id === shiftId);
  if (!shift) return NextResponse.json({ error: "Vagt ikke fundet" }, { status: 404 });

  // Vælg medarbejdere: enten dem brugeren har valgt, eller alle der matcher fag
  let candidates;
  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    candidates = employees.filter((e) => employeeIds.includes(e.id) && e.status === "LEDIG");
  } else {
    candidates = employees.filter((e) => e.status === "LEDIG" && e.trade === shift.trade);
  }

  if (candidates.length === 0) {
    return NextResponse.json({ ok: false, error: "Ingen ledige medarbejdere matcher" }, { status: 400 });
  }

  const startDate = new Date(shift.startAt).toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const startTime = new Date(shift.startAt).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  const tradeName = TRADES[shift.trade as keyof typeof TRADES] || shift.trade;

  const from = process.env.RESEND_FROM || "KrydsByg <kontakt@krydsbyg.com>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krydsbyg.com";

  const emailSent: string[] = [];
  const smsSent: string[] = [];
  const errors: string[] = [];

  for (const emp of candidates) {
    // Email
    if (process.env.RESEND_API_KEY && emp.email) {
      try {
        await resend.emails.send({
          from,
          to: [emp.email],
          subject: `Ny ${tradeName}-vagt: ${shift.title} d. ${startDate}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0C0A;padding:32px;border-radius:4px;color:#F2EEE6;">
              <div style="background:#F5C400;padding:16px 24px;margin-bottom:24px;border-radius:2px;">
                <p style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0C0C0A;">KrydsByg — Ny vagt til dig</p>
              </div>
              <h2 style="color:#F2EEE6;margin:0 0 8px;font-size:22px;">${shift.title}</h2>
              <p style="color:#F5C400;font-size:13px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.08em;">${tradeName} · ${shift.location}</p>
              <p style="color:#F2EEE6;font-size:15px;margin:0 0 4px;"><strong>Dag:</strong> ${startDate}</p>
              <p style="color:#F2EEE6;font-size:15px;margin:0 0 4px;"><strong>Start:</strong> kl. ${startTime}</p>
              ${shift.hourlyRate ? `<p style="color:#F2EEE6;font-size:15px;margin:0 0 16px;"><strong>Timeløn:</strong> ${shift.hourlyRate} kr/t</p>` : ""}
              ${shift.description ? `<p style="color:#F2EEE6;font-size:15px;line-height:1.6;margin:0 0 16px;">${shift.description}</p>` : ""}
              <hr style="border:none;border-top:1px solid rgba(242,238,230,0.1);margin:24px 0;">
              <p style="color:#888880;font-size:13px;line-height:1.6;">Hej ${emp.name.split(" ")[0]} — log ind på <a href="${siteUrl}/medarbejder/login" style="color:#F5C400;">medarbejder-portalen</a> for at tilmelde dig vagten. Eller ring til Krystian på +45 42 77 88 66.</p>
            </div>
          `,
        });
        emailSent.push(emp.name);
      } catch (err) {
        errors.push(`Email ${emp.name}: ${err instanceof Error ? err.message.slice(0, 50) : "fejl"}`);
      }
    }

    // SMS
    try {
      const result = await sendSMS(
        emp.phone,
        `Ny ${tradeName}-vagt: ${shift.title} ${startDate} kl. ${startTime} i ${shift.location}. Log ind paa krydsbyg.com eller ring 42778866.`
      );
      if (result.ok) smsSent.push(emp.name);
      else errors.push(`SMS ${emp.name}: ${result.error}`);
    } catch (err) {
      errors.push(`SMS ${emp.name}: ${err instanceof Error ? err.message.slice(0, 50) : "fejl"}`);
    }
  }

  const updatedShifts = shifts.map((s) =>
    s.id === shiftId
      ? {
          ...s,
          autoMatchSent: true,
          matchedEmployeeIds: candidates.map((e) => e.id),
          updatedAt: new Date().toISOString(),
        }
      : s
  );
  await writeShifts(updatedShifts);

  return NextResponse.json({
    ok: true,
    matched: candidates.length,
    emailSent: emailSent.length,
    smsSent: smsSent.length,
    names: candidates.map((e) => e.name),
    errors,
  });
}