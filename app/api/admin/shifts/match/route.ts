import { NextRequest, NextResponse } from "next/server";
import { readShifts, writeShifts, readEmployees } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shiftId } = await req.json();
  if (!shiftId) return NextResponse.json({ error: "shiftId påkrævet" }, { status: 400 });

  const [shifts, employees] = await Promise.all([readShifts(), readEmployees()]);
  const shift = shifts.find((s) => s.id === shiftId);
  if (!shift) return NextResponse.json({ error: "Vagt ikke fundet" }, { status: 404 });

  const matches = employees.filter(
    (e) => e.status === "LEDIG" && e.trade === shift.trade && e.email
  );

  const startDate = new Date(shift.startAt).toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krydsbyg.com";

  const matchedNames: string[] = [];

  if (process.env.RESEND_API_KEY) {
    for (const emp of matches) {
      try {
        await resend.emails.send({
          from,
          to: [emp.email!],
          subject: `Ny vagt: ${shift.title} d. ${startDate} — Kryds`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0C0A;padding:32px;border-radius:4px;">
              <div style="background:#F5C400;padding:16px 24px;margin-bottom:24px;border-radius:2px;">
                <p style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0C0C0A;">KRYDS — Ny vagt til dig</p>
              </div>
              <h2 style="color:#F2EEE6;margin:0 0 8px;">${shift.title}</h2>
              <p style="color:#F5C400;font-size:13px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.08em;">${shift.trade} · ${shift.location}</p>
              <p style="color:#F2EEE6;font-size:15px;margin:0 0 8px;"><strong>Dato:</strong> ${startDate}</p>
              ${shift.hourlyRate ? `<p style="color:#F2EEE6;font-size:15px;margin:0 0 16px;"><strong>Timeløn:</strong> ${shift.hourlyRate} kr/t</p>` : ""}
              ${shift.description ? `<p style="color:#F2EEE6;font-size:15px;line-height:1.6;margin:0 0 16px;">${shift.description}</p>` : ""}
              <hr style="border:none;border-top:1px solid rgba(242,238,230,0.1);margin:24px 0;">
              <p style="color:#888880;font-size:12px;">Hej ${emp.name.split(" ")[0]} — log ind på <a href="${siteUrl}/medarbejder/login" style="color:#F5C400;">medarbejder-portalen</a> for at tilmelde dig vagten.</p>
            </div>
          `,
        });
        matchedNames.push(emp.name);
      } catch {}
    }
  } else {
    matches.forEach((e) => matchedNames.push(e.name));
  }

  for (const emp of matches) {
    await sendSMS(
      emp.phone,
      `Ny ${shift.trade}-vagt d. ${startDate} i ${shift.location} — log ind på krydsbyg.com`
    );
  }

  const updatedShifts = shifts.map((s) =>
    s.id === shiftId
      ? {
          ...s,
          autoMatchSent: true,
          matchedEmployeeIds: matches.map((e) => e.id),
          updatedAt: new Date().toISOString(),
        }
      : s
  );
  await writeShifts(updatedShifts);

  return NextResponse.json({ ok: true, matched: matchedNames.length, names: matchedNames });
}
