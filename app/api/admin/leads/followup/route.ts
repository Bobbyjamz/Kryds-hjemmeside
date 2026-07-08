/**
 * POST /api/admin/leads/followup
 *
 * Manuel opfølgnings-trigger med Council + Sarah.
 * Bestemmer automatisk trin (1 eller 2) ud fra lead-state.
 * Sender email via Resend + opdaterer followUp1SentAt / followUp2SentAt.
 */

import { NextResponse } from "next/server";
import { readLeads, writeLeads } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { buildEmailHtml, buildEmailText, buildUnsubHeaders } from "@/lib/email-builder";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Mini-Council for opfølgnings-kontekst ──────────────────────────────────

const FOLLOWUP_COUNCIL_SYSTEM = `Du er KrydsByg's Council. Du analyserer en opfølgnings-situation og giver Sarah konkrete skriveinstruktioner til en kort, menneskelig opfølgningsmail.

KrydsByg er et bemandingsbureau i København der leverer: Rengøring, flytning, maling, montering, have, håndværk, byggepladsbehjælp, events og kombinerede hold.

VIGTIGT: Dette er en opfølgning (reminder) — IKKE en ny kold salgsmail. Sarah skal:
- Holde det MEGET kort (2-4 linjer body)
- Lyde menneskelig og nysgerrig — ikke pressende
- Åbne en dialog frem for at sælge igen

Returner KUN JSON. Ingen tekst udenom.`;

// ── Sarah — opfølgnings-tilstand ──────────────────────────────────────────

const FOLLOWUP_SARAH_SYSTEM = `Du er Sarah Møller, assistent hos KrydsByg. Du skriver korte, venlige opfølgningsmails på vegne af Krystian.

DETTE ER EN OPFØLGNING — ikke en ny salgsmail. Regler:
1. Hold body på MAX 3-4 linjer (inkl. hilsen øverst + CTA)
2. Referencér naturligt at du sendte dem en mail tidligere
3. Lyd menneskelig og åben — ikke pressende eller sælgende
4. Afslut med konkret CTA: ring +45 42 77 88 66 eller svar direkte
5. Hilsen: "Hej [fornavn]," eller "Hej [Firmanavn]," — ALDRIG "Kære"
6. Afslut ALTID med "Med venlig hilsen," (systemet tilføjer signatur automatisk)

SPROGREGLER: Klart, naturligt dansk. Ingen klicheer. Ingen bindestreger som sætningskobling. Ingen sætninger som "Vi er nye men erfarne" — tal direkte og menneskeligt.

RETURNER KUN JSON (ingen tekst udenom):
{"subject":"<emne>","body":"<komplet body med hilsen øverst og 'Med venlig hilsen,' som sidste linje>"}`;

// ── Hjælpefunktion ─────────────────────────────────────────────────────────

function isRetainerCandidate(lead: Lead): boolean {
  const blob = `${lead.councilAnalysis?.customerType ?? ""} ${lead.industry ?? ""} ${lead.companyName} ${lead.notes ?? ""}`.toLowerCase();
  const triggers = [
    "facility", "ejendom", "boligforening", "andel", "ejerforening",
    "hotel", "restaurant", "plejehjem", "skole", "børnehave", "konferencecenter",
  ];
  return triggers.some((t) => blob.includes(t));
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { leadId } = body as { leadId: string };
  if (!leadId) return NextResponse.json({ error: "leadId mangler" }, { status: 400 });

  const allLeads = await readLeads();
  const lead = allLeads.find((l) => l.id === leadId);
  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead har ingen email" }, { status: 400 });
  if (lead.status !== "Sent") return NextResponse.json({ error: "Lead er ikke i Sent-status" }, { status: 400 });

  // Bestem trin automatisk
  const step: 0 | 1 | 2 = !lead.followUp1SentAt ? 1 : !lead.followUp2SentAt ? 2 : 0;
  if (step === 0) return NextResponse.json({ error: "Alle opfølgninger allerede sendt" }, { status: 400 });

  const firstName = lead.contactName?.split(" ")[0] || lead.companyName;
  const daysSinceSent = lead.sentAt
    ? Math.floor((Date.now() - new Date(lead.sentAt).getTime()) / (1000 * 60 * 60 * 24))
    : "?";
  const retainerHint = isRetainerCandidate(lead);
  const isFinalAttempt = step === 2;

  try {
    // ── Mini-Council ───────────────────────────────────────────────────────

    const councilMsg = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 650,
      system: FOLLOWUP_COUNCIL_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Giv Sarah en briefing til opfølgning ${step === 1 ? "#1 (dag 5 — venlig reminder)" : "#2 (dag 14 — sidste forsøg)"}.

LEAD:
Virksomhed: ${lead.companyName}
Kontaktperson: ${firstName}
Branche: ${lead.industry || "Ukendt"}
Service interesse: ${lead.serviceType || "generelt"}
Original mail emne: ${lead.draftSubject || "KrydsByg tilbud"}
Dage siden første mail: ${daysSinceSent}
${lead.councilAnalysis ? `Council vurderede: ${lead.councilAnalysis.recommendedAngle}` : ""}
${retainerHint ? "OBS: Nævn gerne retainer-modellen (5 dage/md) da dette er facility/ejendom-type." : ""}
${isFinalAttempt ? "OBS: Dette er SIDSTE mail. Giv slip med værdighed — tonen skal være varm men afsluttende." : ""}

JSON-FORMAT:
{
  "openingLine": "<specifik åbningslinje der naturligt refererer til tidligere kontakt>",
  "tone": "<venlig/formel/varm/afsluttende>",
  "keyMessage": "<én konkret ting at nævne om hvad KrydsByg kan gøre for dem>",
  "callToAction": "<kort, præcis CTA>",
  "subjectLine": "<kortfattet emne>"
}`,
        },
      ],
    });

    const cText =
      councilMsg.content[0].type === "text" ? councilMsg.content[0].text : "{}";
    let councilBriefing: Record<string, string>;
    try {
      councilBriefing = JSON.parse(cText.replace(/```json|```/g, "").trim());
    } catch {
      const m = cText.match(/\{[\s\S]*\}/);
      councilBriefing = m ? JSON.parse(m[0]) : {};
    }

    // ── Sarah ──────────────────────────────────────────────────────────────

    const sarahMsg = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: FOLLOWUP_SARAH_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Skriv opfølgning ${step === 1 ? "#1 (venlig dag-5 reminder)" : "#2 (sidste forsøg dag 14)"}.

LEAD: ${lead.companyName} — kontaktperson: ${firstName}
Branche: ${lead.industry || "ukendt"} | Service: ${lead.serviceType || "generelt"}
Original mail emne: "${lead.draftSubject || "KrydsByg tilbud"}"

COUNCIL BRIEFING:
Åbningslinje: "${councilBriefing.openingLine ?? `Jeg sendte dig en mail for ${daysSinceSent} dage siden om hvad KrydsByg kan gøre for ${lead.companyName}`}"
Tone: ${councilBriefing.tone ?? "venlig"}
Nøglebudskab: ${councilBriefing.keyMessage ?? "fleksibel arbejdskraft på kort varsel"}
CTA: "${councilBriefing.callToAction ?? "Ring eller svar på denne mail — det tager kun 10 minutter"}"
Emne: ${councilBriefing.subjectLine ?? `Re: ${lead.draftSubject ?? "KrydsByg"}`}
${retainerHint && isFinalAttempt ? `HUSK: Nævn retainer-modellen i én linje: "Vi tilbyder også fast månedlig aftale fra 5 dage/md."` : ""}
${isFinalAttempt ? "VIGTIGT: Tonen er varm men afsluttende. Lov IKKE at skrive igen." : ""}`,
        },
      ],
    });

    const sText =
      sarahMsg.content[0].type === "text" ? sarahMsg.content[0].text : "{}";
    let draft: { subject: string; body: string };
    try {
      draft = JSON.parse(sText.replace(/```json|```/g, "").trim());
    } catch {
      const m = sText.match(/\{[\s\S]*\}/);
      draft = m ? JSON.parse(m[0]) : { subject: "", body: "" };
    }

    if (!draft.subject || !draft.body) {
      return NextResponse.json(
        { ok: false, error: "Sarah genererede ikke en gyldig mail" },
        { status: 500 }
      );
    }

    // ── Send via Resend ────────────────────────────────────────────────────

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM ?? "KrydsByg <kontakt@krydsbyg.com>";

    await resend.emails.send({
      from,
      to: [lead.email],
      replyTo: "kontakt@krydsbyg.com",
      subject: draft.subject,
      html: buildEmailHtml({ body: draft.body, preheader: draft.subject }),
      text: buildEmailText(draft.body),
      headers: {
        ...buildUnsubHeaders(lead.email),
        "X-Mailer": "KrydsByg Outreach",
      },
    });

    // ── Opdater lead ───────────────────────────────────────────────────────

    const ts = new Date().toISOString();
    const updatedLeads = allLeads.map((l) => {
      if (l.id !== leadId) return l;
      return {
        ...l,
        ...(step === 1 ? { followUp1SentAt: ts } : { followUp2SentAt: ts }),
        updatedAt: ts,
      };
    });
    await writeLeads(updatedLeads);

    return NextResponse.json({
      ok: true,
      step,
      subject: draft.subject,
      body: draft.body,
      councilBriefing,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[followup] fejl:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}