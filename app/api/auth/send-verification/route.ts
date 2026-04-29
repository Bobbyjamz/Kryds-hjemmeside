import { NextRequest, NextResponse } from "next/server";
import { readEmailTokens, writeEmailTokens } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");

export async function POST(req: NextRequest) {
  try {
    const { email, employeeId } = await req.json();
    if (!email || !employeeId) {
      return NextResponse.json({ error: "email og employeeId er påkrævet" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const tokens = await readEmailTokens();
    const cleaned = tokens.filter((t) => t.email !== email);
    cleaned.push({ token, email, employeeId, expiresAt, used: false, createdAt: new Date().toISOString() });
    await writeEmailTokens(cleaned);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krydsbyg.com";
    const verifyUrl = `${siteUrl}/medarbejder/bekraeft?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "onboarding@resend.dev",
        to: [email],
        subject: "✕ KrydsByg — Bekræft din email",
        html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0C0A;padding:32px;border-radius:4px;">
  <div style="background:#F5C400;padding:16px 24px;margin-bottom:24px;">
    <p style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;color:#0C0C0A;">✕ KRYDSBYG</p>
  </div>
  <h2 style="color:#F2EEE6;margin:0 0 16px;">Velkommen til KrydsByg!</h2>
  <p style="color:#888880;margin:0 0 24px;font-size:15px;line-height:1.6;">
    Klik på knappen nedenfor for at bekræfte din email og aktivere din konto.<br>
    Linket er gyldigt i 24 timer.
  </p>
  <a href="${verifyUrl}"
     style="display:inline-block;background:#F5C400;color:#0C0C0A;font-weight:900;
            font-size:14px;text-transform:uppercase;letter-spacing:0.08em;
            padding:14px 32px;text-decoration:none;border-radius:2px;">
    Bekræft email →
  </a>
  <p style="color:#888880;font-size:12px;margin-top:32px;">
    Hvis du ikke oprettede en konto hos KrydsByg, kan du ignorere denne mail.<br>
    KrydsByg ApS · CVR: 46369947 · kontakt@krydsbyg.com
  </p>
</div>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-verification]", err);
    return NextResponse.json({ error: "Kunne ikke sende verifikationsmail" }, { status: 500 });
  }
}
