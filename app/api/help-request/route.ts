import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sendSMS } from "@/lib/sms";
import { generateId } from "@/lib/db";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name: string;
    company?: string;
    email?: string;
    phone: string;
    trade: string;
    workers?: number;
    startDate?: string;
    duration?: string;
    description?: string;
    urgent?: boolean;
    type?: "virksomhed" | "privat";
  };

  const { name, company, email, phone, trade, workers, startDate, duration, description, urgent, type } = body;

  if (!name || !phone || !trade) {
    return NextResponse.json({ error: "Navn, telefon og fagområde er påkrævet" }, { status: 400 });
  }

  const requestId = generateId();
  const timestamp = new Date().toLocaleString("da-DK");
  const krystianPhone = process.env.KRYSTIAN_PHONE || "+4542778866";

  // SMS til Krystian
  const smsText =
    `${urgent ? "🚨 HASTER" : "📋 Ny forespørgsel"}: ${name}${company ? ` (${company})` : ""} ` +
    `søger ${workers ? `${workers} ` : ""}${trade}. ` +
    `Start: ${startDate || "snarest"}. Tlf: ${phone}`;
  await sendSMS(krystianPhone, smsText);

  // Bekræftelsesmail til kunden
  if (email) {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "KrydsByg <kontakt@krydsbyg.com>",
      to: [email],
      subject: "✕ KrydsByg — Vi har modtaget din forespørgsel",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0C0A;padding:32px;">
          <div style="background:#F5C400;padding:16px 24px;margin-bottom:24px;">
            <p style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;color:#0C0C0A;">✕ KRYDSBYG</p>
          </div>
          <h2 style="color:#F2EEE6;margin:0 0 12px;">Tak for din forespørgsel, ${name.split(" ")[0]}!</h2>
          <p style="color:#888880;margin:0 0 24px;">Vi vender tilbage inden for 2 timer på hverdage.</p>
          <div style="background:#1E1E1C;border:1px solid rgba(242,238,230,0.07);border-radius:4px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#F5C400;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Din forespørgsel</p>
            <p style="margin:0 0 4px;color:#F2EEE6;">Fagområde: ${trade}</p>
            ${workers ? `<p style="margin:0 0 4px;color:#F2EEE6;">Antal: ${workers} person(er)</p>` : ""}
            ${startDate ? `<p style="margin:0 0 4px;color:#F2EEE6;">Opstart: ${startDate}</p>` : ""}
            ${description ? `<p style="margin:0;color:#888880;font-size:13px;margin-top:8px;">${description}</p>` : ""}
          </div>
          <p style="color:#888880;font-size:13px;">Spørgsmål? Ring til os på <strong style="color:#F2EEE6;">+45 42 77 88 66</strong></p>
          <p style="color:#888880;font-size:12px;margin-top:24px;">KrydsByg ApS · CVR: 46369947 · krydsbyg.com</p>
        </div>
      `,
      text: `Tak for din forespørgsel om ${trade}. Vi vender tilbage inden for 2 timer på hverdage.\n\nKrydsByg ApS · +45 42 77 88 66 · krydsbyg.com`,
    });
  }

  // Intern mail til Krystian
  const rows = [
    ["Tidspunkt", timestamp],
    ["Navn", name],
    ["Type", type || "Ikke angivet"],
    ["Firma", company || "—"],
    ["Email", email || "—"],
    ["Telefon", phone],
    ["Fagområde", trade],
    ["Antal", workers ? String(workers) : "—"],
    ["Opstart", startDate || "Snarest"],
    ["Varighed", duration || "—"],
    ["Haster", urgent ? "JA 🚨" : "Nej"],
    ["Beskrivelse", description || "—"],
  ];

  await resend.emails.send({
    from: process.env.RESEND_FROM || "KrydsByg <kontakt@krydsbyg.com>",
    to: [process.env.RESEND_TO || "kontakt@krydsbyg.com"],
    subject: `${urgent ? "🚨 HASTER — " : ""}Ny forespørgsel: ${trade} — ${name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2>Ny forespørgsel #${requestId}</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:140px;">${k}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;">${v}</td>
            </tr>
          `).join("")}
        </table>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, requestId });
}