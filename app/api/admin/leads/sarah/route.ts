import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

export const runtime = "nodejs";

async function isAdmin() {
  return (await getAdminSession()) !== null;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SARAH_SYSTEM = `Du er Sarah Møller — KrydsByg's outreach-assistent.
Du skriver på vegne af Krystian, chef for KrydsByg ApS.

KrydsByg leverer:
- Rengøring og oprydning
- Flytning og transport
- Maling og spartling
- Montering og samling (IKEA, køkken, inventar)
- Have og anlæg
- Mindre håndværk (tømrer, murer, VVS)
- Byggepladsbehjælp og logistik
- Events og sceneopbygning
- Kombinerede hold til blandede opgaver

SARAHS REGLER:
- Kort og direkte — max 5-6 linjer i email body
- Menneskelig og professionel — lyder IKKE som en robot
- Selvsikker og salgsstærk
- Skriv "når behovet opstår" — ALDRIG "hvis behovet opstår"
- Tal til kontaktpersonens fornavn
- Nævn noget specifikt om deres branche eller situation
- Gør det klart hvad KrydsByg kan gøre FOR DEM specifikt
- Lov aldrig noget urealistisk
- Skriv ALTID på dansk

SIGNATUR (brug altid denne nøjagtigt):
Sarah Møller
På vegne af Krystian
KrydsByg.com
Telefon: +45 42 77 88 66
Mail: Kontakt@KrydsByg.com

RETURNER KUN JSON — ingen tekst udenom:
{"subject":"<emne>","body":"<body med linjeskift som \\n>","angle":"<kort forklaring på valgt vinkel>"}`;

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId, regenerate = false } = await req.json();
  const leads = await readLeads();
  const lead = leads.find((l) => l.id === leadId);

  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });
  if (!lead.councilAnalysis) return NextResponse.json({ error: "Analyser leadet med Council først" }, { status: 400 });
  if (lead.draftBody && !regenerate) return NextResponse.json({ error: "Udkast eksisterer allerede. Brug regenerate: true for at lave nyt." }, { status: 400 });

  const council = lead.councilAnalysis;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: SARAH_SYSTEM,
      messages: [{
        role: "user",
        content: `Skriv en salgsmail til dette lead. Returner KUN JSON.

LEAD:
Virksomhed: ${lead.companyName}
Kontaktperson: ${lead.contactName || "ikke angivet"}
Branche: ${lead.industry || "ikke angivet"}
By: ${lead.city || "ikke angivet"}
Relevant service: ${lead.serviceType || "generel hjælp"}
Personlig vinkel: ${lead.personalAngle || "ingen specifik vinkel"}
Noter: ${lead.notes || "ingen"}

COUNCIL:
Kundetype: ${council.customerType}
Anbefalet vinkel: ${council.recommendedAngle}
Tone: ${council.tone}
Salgsråd: ${council.salesAdvice}
Endelig anbefaling: ${council.finalRecommendation}
Risici at undgå: ${council.risks.join(", ")}`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    await writeLeads(leads.map((l) =>
      l.id === leadId
        ? {
            ...l,
            status: "Drafted" as const,
            draftSubject: result.subject,
            draftBody: result.body,
            draftCreatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : l
    ));

    return NextResponse.json({ ok: true, subject: result.subject, body: result.body, angle: result.angle });
  } catch (err) {
    console.error("[leads/sarah]", err);
    return NextResponse.json({ error: "Sarah generering fejlede" }, { status: 500 });
  }
}

// PATCH — godkend, afvis, rediger eller SEND email
export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId, action, editedSubject, editedBody } = await req.json();
  const leads = await readLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });

  const now = new Date().toISOString();

  // ── Send godkendt email via Resend ──────────────────────────────────────
  if (action === "send") {
    if (!lead.email) return NextResponse.json({ error: "Lead mangler email-adresse" }, { status: 400 });
    if (!lead.draftSubject || !lead.draftBody) return NextResponse.json({ error: "Ingen email-udkast — generér udkast med Sarah først" }, { status: 400 });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM ?? "Sarah <onboarding@resend.dev>";

    // Konvertér plain text body til simpel HTML
    const htmlBody = lead.draftBody
      .split("\n")
      .map((line) => line.trim() ? `<p style="margin:0 0 10px 0">${line}</p>` : "")
      .join("");

    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:600px">${htmlBody}</div>`;

    try {
      await resend.emails.send({
        from,
        to: [lead.email],
        subject: lead.draftSubject,
        html,
        text: lead.draftBody,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Email-afsendelse fejlede: ${msg}` }, { status: 500 });
    }

    await writeLeads(leads.map((l) =>
      l.id === leadId ? { ...l, status: "Sent" as const, sentAt: now, updatedAt: now } : l
    ));
    return NextResponse.json({ ok: true, sent: true });
  }

  // ── Øvrige handlinger ───────────────────────────────────────────────────
  await writeLeads(leads.map((l) => {
    if (l.id !== leadId) return l;
    if (action === "approve") return { ...l, status: "Approved" as const, approvedAt: now, updatedAt: now };
    if (action === "reject") return { ...l, status: "Rejected" as const, updatedAt: now };
    if (action === "edit") return { ...l, draftSubject: editedSubject, draftBody: editedBody, status: "Needs Review" as const, updatedAt: now };
    return l;
  }));

  return NextResponse.json({ ok: true });
}
