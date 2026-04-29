import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { getAdminSession } from "@/lib/auth";
import { readEmployees, writeEmployees } from "@/lib/db";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const { id } = await params;
  const employees = await readEmployees();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return NextResponse.json({ error: "Medarbejder ikke fundet" }, { status: 404 });

  const employee = employees[idx];

  if (!employee.email) {
    return NextResponse.json({ error: "Medarbejderen har ingen email — tilføj email først" }, { status: 400 });
  }

  // Generate 6-digit confirmation code
  const code = crypto.randomInt(100000, 999999).toString();
  const now = new Date().toISOString();

  employees[idx] = {
    ...employee,
    confirmationCode: code,
    confirmed: true,
    confirmedAt: now,
    updatedAt: now,
  };
  await writeEmployees(employees);

  // Send email with confirmation code
  const safeName = escapeHtml(employee.name);
  const fromAddress = process.env.RESEND_FROM || "onboarding@resend.dev";

  if (process.env.RESEND_API_KEY) {
    try {
      const { error } = await resend.emails.send({
        from: fromAddress,
        to: [employee.email],
        subject: `Din adgangskode til Kryds — ${code}`,
        html: `
<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><title>Bekræftet — Kryds</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0C0C0A;border-radius:4px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#F5C400;padding:20px 32px;">
          <p style="margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0C0C0A;">✕ KRYDS</p>
          <p style="margin:4px 0 0;font-size:12px;color:#0C0C0A;opacity:0.7;letter-spacing:0.1em;text-transform:uppercase;">Du er nu bekræftet som medarbejder</p>
        </td></tr>
        <tr><td style="padding:24px 32px 0;color:#F2EEE6;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#F5C400;">Velkommen, ${safeName}!</h2>
          <p style="margin:12px 0 0;font-size:15px;color:#F2EEE6;line-height:1.6;">
            Din profil er godkendt. Brug koden herunder sammen med dit telefonnummer for at logge ind.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <div style="background:#1A1A18;border:2px solid #F5C400;border-radius:4px;padding:24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#888880;">Din adgangskode</p>
            <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:0.15em;color:#F5C400;font-family:'Courier New',monospace;">${code}</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 0;border-bottom:1px solid rgba(242,238,230,0.07);">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">Sådan logger du ind</p>
              <p style="margin:6px 0 0;font-size:15px;color:#F2EEE6;line-height:1.6;">
                1. Gå til medarbejder-login<br>
                2. Indtast dit telefonnummer: <strong>${escapeHtml(employee.phone)}</strong><br>
                3. Indtast koden: <strong>${code}</strong>
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px;background:rgba(242,238,230,0.03);border-top:1px solid rgba(242,238,230,0.07);">
          <p style="margin:0;font-size:12px;color:#888880;">
            Denne email er sendt fra Kryds. Del ikke din kode med andre.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      });

      if (error) {
        console.error("[confirm] Resend error:", error);
        // Employee is still confirmed, just email failed
        return NextResponse.json({
          ok: true,
          code,
          emailSent: false,
          emailError: error.message,
        });
      }

      console.log("[confirm] Bekræftelsesmail sendt til", employee.email);
      return NextResponse.json({ ok: true, code, emailSent: true });
    } catch (err) {
      console.error("[confirm] Email exception:", err);
      return NextResponse.json({ ok: true, code, emailSent: false });
    }
  }

  // No API key — return code but no email
  console.warn("[confirm] RESEND_API_KEY mangler — kode genereret men email ikke sendt");
  return NextResponse.json({ ok: true, code, emailSent: false });
}
