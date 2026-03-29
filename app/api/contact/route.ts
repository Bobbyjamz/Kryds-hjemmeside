import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { virksomhed, kontaktperson, email, telefon, opgavetype, antal, startdato, beskrivelse } = body;

  if (!virksomhed || !email || !opgavetype) {
    return NextResponse.json({ error: "Manglende felter" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      to: [process.env.RESEND_TO || "info@kryds.dk"],
      replyTo: email,
      subject: `Ny forespørgsel: ${opgavetype} — ${virksomhed}`,
      html: `
        <h2>Ny forespørgsel fra kryds.dk</h2>
        <p><strong>Virksomhed:</strong> ${virksomhed}</p>
        <p><strong>Kontaktperson:</strong> ${kontaktperson || "–"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${telefon || "–"}</p>
        <p><strong>Opgavetype:</strong> ${opgavetype}</p>
        <p><strong>Antal personer:</strong> ${antal || "–"}</p>
        <p><strong>Startdato:</strong> ${startdato || "–"}</p>
        <p><strong>Beskrivelse:</strong><br>${beskrivelse || "–"}</p>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Afsendelse fejlede" }, { status: 500 });
  }
}
