import { NextRequest, NextResponse } from "next/server";
import { readEmployees } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, priority } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "title og body krævet" }, { status: 400 });
  }

  const employees = await readEmployees();
  const recipients = employees.filter((e) => e.status !== "INAKTIV" && e.email);

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0, warning: "no_api_key" });
  }

  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const isUrgent = priority === "urgent";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krydsbyg.com";

  let sent = 0;
  for (const emp of recipients) {
    try {
      await resend.emails.send({
        from,
        to: [emp.email!],
        subject: `${isUrgent ? "VIGTIGT: " : ""}${title} — Kryds`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0C0A;padding:32px;border-radius:4px;">
            <div style="background:#F5C400;padding:16px 24px;margin-bottom:24px;border-radius:2px;">
              <p style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0C0C0A;">KRYDS — Besked til dig</p>
            </div>
            <h2 style="color:${isUrgent ? "#F5C400" : "#F2EEE6"};margin:0 0 12px;">${title}</h2>
            <p style="color:#F2EEE6;font-size:15px;line-height:1.6;white-space:pre-wrap;">${body}</p>
            <hr style="border:none;border-top:1px solid rgba(242,238,230,0.1);margin:24px 0;">
            <p style="color:#888880;font-size:12px;">Hej ${emp.name.split(" ")[0]} — log ind på <a href="${siteUrl}/medarbejder/login" style="color:#F5C400;">medarbejder-portalen</a> for at se åbne vagter.</p>
          </div>
        `,
      });
      sent++;
    } catch {}
  }
  return NextResponse.json({ ok: true, sent, total: recipients.length });
}
