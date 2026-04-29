import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  // Guard: if no API key, skip email silently (emails disabled)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[contact] RESEND_API_KEY ikke sat — forespørgsel modtaget men email ikke sendt");
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const body = await req.json();
  const { virksomhed, kontaktperson, email, telefon, opgavetype, antal, startdato, beskrivelse, acceptedTerms, contractVersion, acceptedPrivacyPolicy, acceptedMarketing } = body;

  // Must have opgavetype + at least one contact channel (email OR phone)
  if (!opgavetype || (!email && !telefon)) {
    return NextResponse.json(
      { error: "Manglende felter: opgavetype og enten email eller telefon er påkrævet" },
      { status: 400 }
    );
  }

  if (acceptedTerms !== true) {
    return NextResponse.json({ error: "Du skal acceptere kundevilkårene" }, { status: 400 });
  }

  // Basic email validation (only if email is provided)
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ugyldig email-adresse" }, { status: 400 });
    }
  }

  const fromAddress = process.env.RESEND_FROM || "onboarding@resend.dev";
  const toAddress = process.env.RESEND_TO || "kontakt@krydsbyg.com";

  // Sanitize all inputs
  const safeVirksomhed = escapeHtml(String(virksomhed || "–"));
  const safeKontakt = escapeHtml(String(kontaktperson || "–"));
  const safeEmail = escapeHtml(String(email || "–"));
  const safeTelefon = escapeHtml(String(telefon || "–"));
  const safeOpgavetype = escapeHtml(String(opgavetype));
  const safeAntal = escapeHtml(String(antal || "–"));
  const safeStartdato = escapeHtml(String(startdato || "–"));
  const safeBeskrivelse = escapeHtml(String(beskrivelse || "–")).replace(/\n/g, "<br>");
  const safeContractVersion = escapeHtml(String(contractVersion || "–"));
  const acceptTimestamp = new Date().toLocaleString("da-DK", { timeZone: "Europe/Copenhagen" });

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toAddress],
      replyTo: email || undefined,
      subject: `Ny forespørgsel: ${safeOpgavetype} — ${safeVirksomhed}`,
      html: `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ny forespørgsel — Kryds</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0C0C0A;border-radius:4px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#F5C400;padding:20px 32px;">
              <p style="margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0C0C0A;">
                ✕ KRYDS
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#0C0C0A;opacity:0.7;letter-spacing:0.1em;text-transform:uppercase;">
                Ny forespørgsel fra KrydsByg.com
              </p>
            </td>
          </tr>
          <!-- Subject line -->
          <tr>
            <td style="padding:24px 32px 0;color:#F2EEE6;">
              <h2 style="margin:0;font-size:20px;font-weight:700;color:#F5C400;">
                ${safeOpgavetype}
              </h2>
              <p style="margin:6px 0 0;font-size:14px;color:#888880;">
                ${safeVirksomhed}
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr><td style="padding:16px 32px;"><hr style="border:none;border-top:1px solid rgba(242,238,230,0.1);margin:0;"></td></tr>
          <!-- Details -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ["Virksomhed / navn", safeVirksomhed],
                  ["Kontaktperson", safeKontakt],
                  ["Email", safeEmail],
                  ["Telefon", safeTelefon],
                  ["Type af opgave", safeOpgavetype],
                  ["Antal personer", safeAntal],
                  ["Startdato", safeStartdato],
                ].map(([label, value]) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(242,238,230,0.07);">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">${label}</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#F2EEE6;">${value}</p>
                  </td>
                </tr>`).join("")}
                <tr>
                  <td style="padding:10px 0;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">Beskrivelse af projektet</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#F2EEE6;line-height:1.6;">${safeBeskrivelse}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid rgba(245,196,0,0.2);">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#F5C400;">✓ Kundevilkår accepteret</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#F2EEE6;">Version ${safeContractVersion} — ${escapeHtml(acceptTimestamp)}</p>
                    <p style="margin:8px 0 0;font-size:12px;color:#888880;">${acceptedPrivacyPolicy ? "✓" : "✗"} Handelsbetingelser + privatlivspolitik · ${acceptedMarketing ? "✓" : "✗"} Marketing-samtykke</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Reply CTA -->
          <tr>
            <td style="padding:0 32px 32px;">
              <a href="mailto:${safeEmail}" style="display:inline-block;background:#F5C400;color:#0C0C0A;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;font-size:13px;padding:12px 28px;border-radius:2px;text-decoration:none;">
                Svar på forespørgsel
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:rgba(242,238,230,0.03);border-top:1px solid rgba(242,238,230,0.07);">
              <p style="margin:0;font-size:12px;color:#888880;">
                Sendt fra kontaktformularen på KrydsByg.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("[contact] Resend API error:", JSON.stringify(error));
      // Return ok:true anyway so user doesn't see error — we log it server-side
      return NextResponse.json({ ok: true, warning: "email_error" });
    }

    console.log("[contact] Email sendt til", toAddress, "— ID:", data?.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] Uventet fejl:", err);
    return NextResponse.json({ error: "Afsendelse fejlede" }, { status: 500 });
  }
}
