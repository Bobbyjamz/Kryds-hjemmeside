// Email-builder — bygger branded HTML-emails med professionel KrydsByg-signatur

interface EmailParts {
  body: string;       // Plain text body fra Sarah (med \n linjeskift)
  preheader?: string; // Skjult preview-tekst i indbakken (under emnefelt)
}

const KRYDSBYG_YELLOW = "#F5C400";
const KRYDSBYG_BLACK = "#0C0C0A";
const KRYDSBYG_GRAY = "#5A5A55";

/**
 * Bygger en komplet HTML-email med branded signatur.
 * Bruges af /api/admin/leads/sarah send-action.
 */
export function buildEmailHtml({ body, preheader }: EmailParts): string {
  // Konvertér plain text body til HTML-paragraffer (bevar afsnit-skift)
  const bodyHtml = body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      return `<p style="margin:0 0 14px 0;line-height:1.6;color:${KRYDSBYG_BLACK};font-size:15px">${escapeHtml(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join("");

  // Skjult preheader (vises i indbakke-preview)
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff;opacity:0">${escapeHtml(preheader)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KrydsByg</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,Helvetica,sans-serif">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f0;padding:32px 16px">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:4px;overflow:hidden;max-width:600px;width:100%">
        <!-- Gul branding-streg øverst -->
        <tr>
          <td style="height:3px;background:${KRYDSBYG_YELLOW};line-height:3px;font-size:3px">&nbsp;</td>
        </tr>
        <!-- Mini logo header (diskret) -->
        <tr>
          <td style="padding:14px 40px 0 40px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;padding-right:8px">
                  <svg width="20" height="20" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
                    <line x1="14" y1="14" x2="76" y2="76" stroke="${KRYDSBYG_YELLOW}" stroke-width="18" stroke-linecap="round" />
                    <line x1="76" y1="14" x2="14" y2="76" stroke="${KRYDSBYG_BLACK}" stroke-width="18" stroke-linecap="round" />
                  </svg>
                </td>
                <td style="vertical-align:middle">
                  <span style="font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:13px;letter-spacing:.12em;color:${KRYDSBYG_BLACK};text-transform:uppercase">
                    KrydsByg
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:20px 40px 24px 40px">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Signatur -->
        <tr>
          <td style="padding:0 40px 36px 40px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0">
                  <p style="margin:0 0 2px 0;font-size:15px;font-weight:bold;color:${KRYDSBYG_BLACK};letter-spacing:.02em">Sarah Møller</p>
                  <p style="margin:0 0 12px 0;font-size:13px;color:${KRYDSBYG_GRAY}">Assistent, KrydsByg</p>
                  <p style="margin:0 0 3px 0;font-size:13px;color:${KRYDSBYG_BLACK}">
                    <span style="color:${KRYDSBYG_GRAY}">Telefon:</span>
                    <a href="tel:+4542778866" style="color:${KRYDSBYG_BLACK};text-decoration:none;font-weight:600">+45 42 77 88 66</a>
                  </p>
                  <p style="margin:0 0 3px 0;font-size:13px;color:${KRYDSBYG_BLACK}">
                    <span style="color:${KRYDSBYG_GRAY}">Email:</span>
                    <a href="mailto:kontakt@krydsbyg.com" style="color:${KRYDSBYG_BLACK};text-decoration:none;font-weight:600">kontakt@krydsbyg.com</a>
                  </p>
                  <p style="margin:0 0 16px 0;font-size:13px;color:${KRYDSBYG_BLACK}">
                    <span style="color:${KRYDSBYG_GRAY}">Web:</span>
                    <a href="https://krydsbyg.com" style="color:${KRYDSBYG_BLACK};text-decoration:none;font-weight:600">krydsbyg.com</a>
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px">
                    <tr>
                      <td style="background:${KRYDSBYG_YELLOW};padding:8px 16px;border-radius:2px">
                        <a href="https://krydsbyg.com" style="color:${KRYDSBYG_BLACK};text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase">Se hvem vi er</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer disclaimer -->
        <tr>
          <td style="padding:0 40px 28px 40px">
            <p style="margin:0;font-size:11px;color:#9a9a92;line-height:1.5">
              Ønsker du ikke at høre mere fra os, så svar blot med &quot;afmeld&quot;, eller <a href="mailto:kontakt@krydsbyg.com?subject=Afmeld" style="color:#9a9a92;text-decoration:underline">klik her for at afmelde</a>.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Bygger plain-text version af emailen — bruges som fallback for klienter der ikke kan vise HTML.
 */
export function buildEmailText(body: string): string {
  return `${body.trim()}

---
Sarah Møller
Assistent, KrydsByg
Telefon: +45 42 77 88 66
Email: kontakt@krydsbyg.com
Web: krydsbyg.com

Ønsker du ikke at høre mere fra os, svar blot med "afmeld".`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
