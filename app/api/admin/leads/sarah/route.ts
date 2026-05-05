import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads, appendEmailMemory } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { buildEmailHtml, buildEmailText } from "@/lib/email-builder";

export const runtime = "nodejs";

async function isAdmin() {
  return (await getAdminSession()) !== null;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SARAH_SYSTEM = `Du er Sarah, KrydsByg's outreach-assistent. Du skriver på vegne af Krystian.

KrydsByg leverer:
Rengøring og oprydning, flytning og transport, maling og spartling, montering og samling, have og anlæg, mindre håndværk (tømrer, murer, VVS), byggepladsbehjælp og logistik, events og sceneopbygning samt sammensatte hold til blandede opgaver.

OM KRYSTIAN OG KRYDSBYG (brug kun lejlighedsvist, max 1 ud af 4 mails):
Krystian er ved at færdiggøre sin bygningskonstruktøruddannelse, som giver ham et solidt fundament og markedsforståelse. KrydsByg startede småt og bevidst fordi hans familie er dybt involveret i byggebranchen og det faldt naturligt at gå egne veje inden for service og bemanding. Målet er større projekter når kapitalen er der. Denne baggrund gør KrydsByg personlig og autentisk i stedet for et upersonligt bureau.

SARAHS REGLER:
Skriv kort og direkte. Max 4 til 5 linjer i body. Lyd menneskelig og selvsikker. Skriv altid "når behovet opstår" aldrig "hvis behovet opstår". Tal til kontaktpersonens fornavn. Nævn noget konkret om deres branche eller situation. Gør det klart hvad KrydsByg kan gøre specifikt for dem. Lov aldrig noget urealistisk. Skriv altid på dansk.

SPROGREGLER (meget vigtigt):
Brug ALDRIG bindestreger som sætningskobling. Skriv i stedet sætningerne ud. Undgå sætninger som "Vi er nye men erfarne" eller "Lille firma stor service". Undgå klicheer og overfladisk sprog. Skriv i klart, naturligt dansk som lyder som et rigtigt menneske har skrevet det.

AFSLUTNING AF BODY:
Afslut altid med en konkret opfordring til at kontakte Krystian direkte på +45 42 77 98 66 eller gå ind på krydsbyg.com for at se hvem vi er. Skriv det naturligt ind som del af afslutningen, ikke som en separat linje med kolon.

SIGNATUR HÅNDTERES AUTOMATISK:
Skriv IKKE navn, telefonnummer eller email i body. Systemet tilføjer signaturen. Body slutter med call to action.

RETURNER KUN JSON uden tekst udenom:
{"subject":"<emne>","body":"<body uden signatur, linjeskift som \\n>","angle":"<kort forklaring>"}`;

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId, regenerate = false } = await req.json();
  const leads = await readLeads();
  const lead = leads.find((l) => l.id === leadId);

  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });
  if (!lead.councilAnalysis) return NextResponse.json({ error: "Analyser leadet med Council først" }, { status: 400 });
  if (lead.draftBody && !regenerate) return NextResponse.json({ error: "Udkast eksisterer allerede. Brug regenerate: true for at lave nyt." }, { status: 400 });

  const council = lead.councilAnalysis;
  const briefing = council.sarahBriefing;

  // Bygger briefing-blok hvis Council har leveret en
  const briefingBlock = briefing
    ? `
SARAH-BRIEFING FRA COUNCIL (FØLG DETTE):
- Åbningslinje: "${briefing.openingLine}"
- Pain points der skal adresseres: ${briefing.painPoints.join(" | ")}
- Fokuser på disse KrydsByg-ydelser: ${briefing.keyServices.join(", ")}
- Foreslåede emnelinjer (vælg den bedste eller skriv en variation): ${briefing.subjectOptions.join(" / ")}
- Afslut med præcis CTA: "${briefing.callToAction}"

Brug Council's openingLine som første linje (eller en let variation). Slut body med CTA — IKKE med navn/signatur.`
    : `
COUNCIL HAR INGEN BRIEFING — brug egen vurdering baseret på følgende råd:
Salgsråd: ${council.salesAdvice}
Vinkel: ${council.recommendedAngle}`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
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
Tone: ${council.tone}
Risici at undgå: ${council.risks.join(", ")}
${briefingBlock}`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    let result: Record<string, string>;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      result = JSON.parse(clean);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`Sarah returnerede intet JSON. Svar: ${text.slice(0, 200)}`);
      result = JSON.parse(match[0]);
    }

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

    // Brug branded email-builder med professionel signatur
    const html = buildEmailHtml({
      body: lead.draftBody,
      preheader: lead.draftSubject,
    });
    const textVersion = buildEmailText(lead.draftBody);

    try {
      await resend.emails.send({
        from,
        to: [lead.email],
        bcc: ["kontakt@krydsbyg.com"],
        replyTo: "kontakt@krydsbyg.com",
        subject: lead.draftSubject,
        html,
        text: textVersion,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Email-afsendelse fejlede: ${msg}` }, { status: 500 });
    }

    await writeLeads(leads.map((l) =>
      l.id === leadId ? { ...l, status: "Sent" as const, sentAt: now, updatedAt: now } : l
    ));

    // Gem i email-hukommelse — så Sarah lærer hvad der virker fremover
    if (lead.councilAnalysis) {
      try {
        await appendEmailMemory({
          industry: lead.industry,
          serviceType: lead.serviceType,
          angle: lead.councilAnalysis.recommendedAngle,
          tone: lead.councilAnalysis.tone,
          subjectLine: lead.draftSubject,
          bodyLength: lead.draftBody.length,
          councilScore: lead.councilAnalysis.leadScore,
          customerType: lead.councilAnalysis.customerType,
          sentAt: now,
          leadId: lead.id,
        });
      } catch (err) {
        console.error("[email-memory] kunne ikke gemme entry:", err);
      }
    }

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
