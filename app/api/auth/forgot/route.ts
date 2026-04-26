import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { readResetTokens, writeResetTokens, generateId } from "@/lib/db";
import { sendSMS } from "@/lib/sms";
import type { ResetToken } from "@/lib/types";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const { method, value, type = "admin" } = await req.json() as {
    method: "sms" | "email";
    value: string;
    type?: "admin" | "employee";
  };

  if (!method || !value) {
    return NextResponse.json({ error: "Mangler metode og kontaktinfo" }, { status: 400 });
  }

  const code = generateCode();
  const token: ResetToken = {
    token: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used: false,
    type,
    ...(method === "sms" ? { phone: value } : { email: value }),
  };

  const tokens = await readResetTokens();
  const cleaned = tokens.filter((t) =>
    method === "sms" ? t.phone !== value : t.email !== value
  );
  cleaned.push(token);
  await writeResetTokens(cleaned);

  if (method === "sms") {
    await sendSMS(value, `[KrydsByg] Din kode er: ${code} — gyldig i 15 minutter.`);
  } else {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      to: [value],
      subject: "✕ KrydsByg — Din adgangskode",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0C0A;padding:32px;border-radius:4px;">
          <div style="background:#F5C400;padding:16px 24px;margin-bottom:24px;">
            <p style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;color:#0C0C0A;">✕ KRYDSBYG</p>
          </div>
          <h2 style="color:#F2EEE6;margin:0 0 16px;">Din adgangskode</h2>
          <div style="background:#1E1E1C;border:1px solid rgba(242,238,230,0.1);border-radius:4px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:0.2em;color:#F5C400;">${code}</p>
          </div>
          <p style="color:#888880;font-size:14px;">Koden er gyldig i 15 minutter. Del den ikke med andre.</p>
          <p style="color:#888880;font-size:12px;margin-top:24px;">KrydsByg ApS · CVR: 46369947 · kontakt@krydsbyg.com</p>
        </div>
      `,
      text: `Din KrydsByg kode: ${code}\nGyldig i 15 minutter.`,
    });
  }

  return NextResponse.json({ ok: true, method });
}
