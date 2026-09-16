import { Resend } from "resend";

export const STANDARD_BCC = "kontakt+sendt@krydsbyg.com";

export interface KundeMail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  replyTo?: string;
}

export type SendResultat = { ok: true; id: string } | { ok: false; error: string };

/**
 * Eneste vej ud for kundevendte mails (outreach, opfølgning, tilbud).
 * Tilføjer altid blind kopi til Krystians indbakke. Plus-adressen bruges fordi
 * Gmail kan skjule en kopi sendt fra og til samme adresse.
 * Resend SDK v6 kaster ikke ved API-fejl — fejlen returneres her som værdi.
 */
export async function sendKundeMail(mail: KundeMail): Promise<SendResultat> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: mail.from,
      to: [mail.to],
      bcc: [process.env.KUNDEMAIL_BCC || STANDARD_BCC],
      replyTo: mail.replyTo ?? "kontakt@krydsbyg.com",
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: mail.headers,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
