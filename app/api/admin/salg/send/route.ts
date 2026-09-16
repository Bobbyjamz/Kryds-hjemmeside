import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readLeads, writeLeads } from "@/lib/db";
import { buildEmailHtml, buildEmailText, buildUnsubHeaders } from "@/lib/email-builder";
import { sendKundeMail } from "@/lib/email/send-kunde-mail";
import { erBlokeret } from "@/lib/outreach/suppression";
import { skiftStatus } from "@/lib/salg/beregn";
import { KRYSTIAN_SIGNATUR } from "@/lib/salg/skabelon";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, subject, body } = (await req.json()) as { id?: string; subject?: string; body?: string };
  if (typeof subject !== "string" || typeof body !== "string" || !subject.trim() || !body.trim()) {
    return NextResponse.json({ error: "Emne og tekst skal udfyldes" }, { status: 400 });
  }

  const leads = await readLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead?.salg) return NextResponse.json({ error: "Kontakt ikke fundet" }, { status: 404 });
  if (!lead.email) {
    return NextResponse.json({ error: "Kontakten har ingen e-mail — ring i stedet" }, { status: 400 });
  }
  if (lead.emailBounced || lead.emailComplained || (await erBlokeret(lead.email))) {
    return NextResponse.json({ error: "Adressen er afmeldt eller har bouncet — der sendes ikke" }, { status: 400 });
  }

  const emne = subject.trim();
  const sendt = await sendKundeMail({
    from: process.env.RESEND_FROM_COLD ?? "KrydsByg <kontakt@krydsbyg.com>",
    to: lead.email,
    subject: emne,
    html: buildEmailHtml({ body, preheader: emne, recipientEmail: lead.email, signatur: KRYSTIAN_SIGNATUR }),
    text: buildEmailText(body, KRYSTIAN_SIGNATUR),
    headers: { ...buildUnsubHeaders(lead.email), "X-Mailer": "KrydsByg Salg" },
  });
  if (!sendt.ok) {
    return NextResponse.json({ error: `Mailen blev ikke sendt: ${sendt.error}` }, { status: 502 });
  }

  const nu = new Date();
  const opdateret: Lead = {
    ...lead,
    salg: skiftStatus(lead.salg, "mail_sendt", nu),
    sentAt: nu.toISOString(),
    updatedAt: nu.toISOString(),
  };
  await writeLeads(leads.map((l) => (l.id === id ? opdateret : l)));
  return NextResponse.json({ lead: opdateret });
}
