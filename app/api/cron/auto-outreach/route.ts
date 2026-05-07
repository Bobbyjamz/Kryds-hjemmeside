/**
 * Auto-Outreach Cron — kl. 13:00 DK (11:00 UTC) dagligt
 *
 * Pipeline for hvert "New" lead med email:
 *   1. Council analyse (Sonnet 4.5) → leadScore + Sarah-briefing
 *   2. Sarah udkast (Sonnet 4.5) → subject + body
 *   3. Auto-send via Resend hvis leadScore ≥ 5
 *   4. Gem i email-hukommelse
 *
 * Bedrøvet leads (ingen email eller score < 5) markeres "Analyzed"/"Drafted" men sendes ikke.
 * Max 25 leads per kørsel for at holde os inden for 300s timeout.
 */

import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads, appendEmailMemory } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/sms";
import { buildEmailHtml, buildEmailText } from "@/lib/email-builder";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import type { Lead, CouncilAnalysis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Council-prompt (identisk med /api/admin/leads/council) ────────────────

const COUNCIL_SYSTEM = `Du er KrydsByg's interne Council — et AI-panel der analyserer leads OG giver Sarah en konkret skrive-instruktion.
KrydsByg er et dansk bemandingsbureau i København der leverer:
- Rengøring og oprydning
- Flytning og transport
- Maling og spartling
- Montering og samling (IKEA, køkken, inventar)
- Have og anlæg
- Mindre håndværk (tømrer, murer, VVS)
- Byggepladsbehjælp og logistik
- Events og sceneopbygning
- Kombinerede hold til blandede opgaver

Sarah er outreach-assistenten der skriver kolde salgsmails. Hun har brug for KONKRETE
skrive-instruktioner — ikke generiske råd. Du skal give hende:
- En specifik åbningslinje (første sætning i mailen)
- 2-3 konkrete pain points relateret til kundens branche
- 1-2 KrydsByg-ydelser der passer bedst til netop dette lead
- 2 forslag til emnelinje (hun vælger den bedste)
- En præcis CTA i sidste linje (mødetid, ringeforslag, deadline)

Du returnerer KUN et JSON objekt — ingen tekst før eller efter JSON.`;

// ── Sarah-prompt (identisk med /api/admin/leads/sarah) ────────────────────

const SARAH_SYSTEM = `Du er Sarah Møller, assistent hos KrydsByg. Du skriver formelle, professionelle salgsmails på vegne af Krystian.

KrydsByg leverer:
Rengøring og oprydning, flytning og transport, maling og spartling, montering og samling, have og anlæg, mindre håndværk (tømrer, murer, VVS), byggepladsbehjælp og logistik, events og sceneopbygning samt sammensatte hold til blandede opgaver.

OM KRYSTIAN OG KRYDSBYG (brug kun lejlighedsvist, max 1 ud af 4 mails):
Krystian er ved at færdiggøre sin bygningskonstruktøruddannelse, som giver ham et solidt fundament og markedsforståelse. KrydsByg startede småt og bevidst fordi hans familie er dybt involveret i byggebranchen og det faldt naturligt at gå egne veje inden for service og bemanding. Målet er større projekter når kapitalen er der. Denne baggrund gør KrydsByg personlig og autentisk i stedet for et upersonligt bureau.

OBLIGATORISK STRUKTUR (følg ALTID):
1. Hilsen først — ALTID en af disse:
   - "Hej [fornavn]," hvis kontaktperson kendt
   - "Hej [Virksomhedsnavn]-team," hvis kun firma kendt (B2B)
   - "Hej [Virksomhedsnavn]," hvis intet team-suffix passer
   - For private uden navn: "Hej," eller "Goddag,"
   ALDRIG: "Hi", "Hello", "Kære", "Til hvem det måtte vedkomme"
2. Tom linje
3. Body: 3-5 linjer der nævner noget konkret om dem og hvad KrydsByg kan tilbyde
4. Tom linje
5. Konkret call-to-action: opkald til Krystian på +45 42 77 98 66 eller besøg krydsbyg.com
6. Tom linje
7. AFSLUTNING — ALTID præcis: "Med venlig hilsen,"
   (Systemet tilføjer Sarah Møller + kontaktinfo automatisk efter den linje)

SARAHS REGLER:
Tone: formel, høflig og professionel — som en assistent på Krystians vegne. Tilpas formalitetsniveau efter modtager: B2B mere formel, private kunder lidt varmere. Skriv kort og direkte. Lyd menneskelig og kompetent. Skriv altid "når behovet opstår" aldrig "hvis behovet opstår". Tal til kontaktpersonens fornavn hvis kendt. Nævn noget konkret om deres branche eller situation. Gør det klart hvad KrydsByg kan gøre specifikt for dem. Lov aldrig noget urealistisk. Skriv altid på dansk.

SPROGREGLER (meget vigtigt):
Brug ALDRIG bindestreger som sætningskobling. Skriv i stedet sætningerne ud. Undgå sætninger som "Vi er nye men erfarne" eller "Lille firma stor service". Undgå klicheer og overfladisk sprog. Skriv i klart, naturligt dansk som lyder som et rigtigt menneske har skrevet det.

SIGNATUR HÅNDTERES AUTOMATISK:
Skriv IKKE navn, telefonnummer eller email efter "Med venlig hilsen,". Systemet tilføjer signaturen. Body slutter med "Med venlig hilsen," som sidste linje.

RETAINER-MODEL (NÆVN KUN HVIS RELEVANT):
Hvis kontekst giver retainerHint=true (sættes for facility managers, ejendomsselskaber, hoteller, plejehjem, restauranter) skal du nævne retainer-aftalen kort i én linje i body — fx: "Vi har også en fast månedlig aftale (retainer) fra 5 dage/md hvis det passer bedre end ad-hoc booking." Nævn ALDRIG retainer for små virksomheder, privatpersoner eller engangskunder.

RETURNER KUN JSON uden tekst udenom:
{"subject":"<emne>","body":"<body med Hej øverst og 'Med venlig hilsen,' nederst, linjeskift som \\n>","angle":"<kort forklaring>"}`;

// ── Hjælpefunktioner ───────────────────────────────────────────────────────

async function runCouncil(lead: Lead): Promise<CouncilAnalysis> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1400,
    system: COUNCIL_SYSTEM,
    messages: [{
      role: "user",
      content: `Analyser dette lead og returner KUN dette JSON format (ingen tekst udenom):

LEAD:
Virksomhed: ${lead.companyName}
Kontaktperson: ${lead.contactName || "Ukendt"}
Email: ${lead.email}
Branche: ${lead.industry || "Ukendt"}
By: ${lead.city || "Ukendt"}
Website: ${lead.website || "Ingen"}
Relevant service: ${lead.serviceType || "Ikke angivet"}
Personlig vinkel: ${lead.personalAngle || "Ingen"}
Noter: ${lead.notes || "Ingen"}

JSON-FORMAT:
{
  "leadScore": <1-10>,
  "customerType": "<type af kunde>",
  "recommendedAngle": "<anbefalet salgsvinkel>",
  "tone": "<direkte/venlig/formel/uformel>",
  "risks": ["<risiko 1>", "<risiko 2>"],
  "salesAdvice": "<konkret råd til salg>",
  "brandAdvice": "<råd om KrydsByg brand>",
  "operationsAdvice": "<råd om drift og levering>",
  "financeAdvice": "<råd om pris og model>",
  "finalRecommendation": "<samlet anbefaling til Sarah>",
  "sarahBriefing": {
    "openingLine": "<konkret første sætning>",
    "painPoints": ["<pain 1>", "<pain 2>", "<pain 3>"],
    "keyServices": ["<ydelse 1>", "<ydelse 2>"],
    "subjectOptions": ["<emne 1>", "<emne 2>"],
    "callToAction": "<præcis CTA>"
  }
}`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Council: intet JSON. Svar: ${text.slice(0, 100)}`);
    parsed = JSON.parse(match[0]);
  }

  return { ...parsed, analyzedAt: new Date().toISOString() } as CouncilAnalysis;
}

function shouldPitchRetainer(lead: Lead, council: CouncilAnalysis): boolean {
  const blob = `${council.customerType ?? ""} ${lead.industry ?? ""} ${lead.companyName} ${lead.notes ?? ""}`.toLowerCase();
  const triggers = [
    "facility", "ejendom", "boligforening", "andel", "ejerforening",
    "hotel", "restaurant", "plejehjem", "skole", "børnehave",
    "konferencecenter", "byggeselskab",
  ];
  return triggers.some((t) => blob.includes(t));
}

async function runSarah(lead: Lead, council: CouncilAnalysis): Promise<{ subject: string; body: string }> {
  const briefing = council.sarahBriefing;
  const retainerHint = shouldPitchRetainer(lead, council);
  const briefingBlock = briefing
    ? `
SARAH-BRIEFING FRA COUNCIL (FØLG DETTE):
- Åbningslinje: "${briefing.openingLine}"
- Pain points der skal adresseres: ${briefing.painPoints.join(" | ")}
- Fokuser på disse KrydsByg-ydelser: ${briefing.keyServices.join(", ")}
- Foreslåede emnelinjer (vælg den bedste eller skriv en variation): ${briefing.subjectOptions.join(" / ")}
- Afslut med præcis CTA: "${briefing.callToAction}"

Brug Council's openingLine som første linje (eller en let variation). Slut body med CTA — IKKE med navn/signatur.`
    : `COUNCIL HAR INGEN BRIEFING — brug egen vurdering. Salgsråd: ${council.salesAdvice}`;

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
retainerHint: ${retainerHint ? "true (nævn retainer-modellen kort i én linje)" : "false (nævn IKKE retainer)"}
${briefingBlock}`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  let result: Record<string, string>;
  try {
    result = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Sarah: intet JSON. Svar: ${text.slice(0, 100)}`);
    result = JSON.parse(match[0]);
  }

  return { subject: result.subject, body: result.body };
}

// ── Delt pipeline-logik ───────────────────────────────────────────────────

async function runOutreachPipeline() {
  const stats = { analyzed: 0, drafted: 0, sent: 0, noEmail: 0, lowScore: 0, errors: 0, hitTimeBudget: false };
  const startMs = Date.now();
  const TIME_BUDGET_MS = 240_000; // 240s = 4 min — gemmer 60s buffer til writeLeads + SMS

  const allLeads = await readLeads();

  // Kun "New" leads — max 12 per kørsel (var 25 — timeout ved tunge AI-kald)
  const toProcess = allLeads.filter((l) => l.status === "New").slice(0, 12);

  if (toProcess.length === 0) {
    return { stats, toProcess: 0, message: "Ingen New leads" };
  }

  const updatedLeads = [...allLeads];

  for (const lead of toProcess) {
    // Tids-budget: hvis vi har brugt 4 min, stop og gem hvad vi har
    if (Date.now() - startMs > TIME_BUDGET_MS) {
      stats.hitTimeBudget = true;
      break;
    }
    try {
      // ── 1. Council ──────────────────────────────────────────────────
      const council = await runCouncil(lead);
      stats.analyzed++;

      const idx = updatedLeads.findIndex((l) => l.id === lead.id);
      if (idx !== -1) {
        updatedLeads[idx] = {
          ...updatedLeads[idx],
          status: "Analyzed",
          councilScore: council.leadScore,
          councilAnalysis: council,
          updatedAt: new Date().toISOString(),
        };
      }

      // ── 2. Sarah ────────────────────────────────────────────────────
      const draft = await runSarah(updatedLeads[idx] ?? lead, council);
      stats.drafted++;

      const now = new Date().toISOString();
      if (idx !== -1) {
        updatedLeads[idx] = {
          ...updatedLeads[idx],
          status: "Drafted",
          draftSubject: draft.subject,
          draftBody: draft.body,
          draftCreatedAt: now,
          updatedAt: now,
        };
      }

      // ── 3. Send ─────────────────────────────────────────────────────
      if (!lead.email) {
        stats.noEmail++;
        continue;
      }

      if (council.leadScore < 5) {
        stats.lowScore++;
        continue; // For svagt lead — lad admin beslutte manuelt
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM ?? "Sarah <onboarding@resend.dev>";
      const html = buildEmailHtml({ body: draft.body, preheader: draft.subject });
      const textVersion = buildEmailText(draft.body);

      await resend.emails.send({
        from,
        to: [lead.email],
        bcc: ["kontakt@krydsbyg.com"],
        replyTo: "kontakt@krydsbyg.com",
        subject: draft.subject,
        html,
        text: textVersion,
        headers: {
          "List-Unsubscribe": "<mailto:kontakt@krydsbyg.com?subject=afmeld>",
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Mailer": "KrydsByg Outreach",
        },
      });

      stats.sent++;
      const sentNow = new Date().toISOString();

      if (idx !== -1) {
        updatedLeads[idx] = {
          ...updatedLeads[idx],
          status: "Sent",
          sentAt: sentNow,
          updatedAt: sentNow,
        };
      }

      // Gem i email-hukommelse
      await appendEmailMemory({
        industry: lead.industry,
        serviceType: lead.serviceType,
        angle: council.recommendedAngle,
        tone: council.tone,
        subjectLine: draft.subject,
        bodyLength: draft.body.length,
        councilScore: council.leadScore,
        customerType: council.customerType,
        sentAt: sentNow,
        leadId: lead.id,
      });

      // Lille pause så vi ikke hamrer Anthropic + Resend
      await new Promise((r) => setTimeout(r, 500));

    } catch (err) {
      stats.errors++;
      console.error(`[auto-outreach] fejl for lead ${lead.id}:`, err);
    }
  }

  // Gem alle opdaterede leads på én gang
  await writeLeads(updatedLeads);

  return { stats, toProcess: toProcess.length };
}

// ── Auto follow-up (2-trins kadence) ────────────────────────────────────────
//
//   Trin 1 (dag 5):  Venlig "Bare en kort opfølgning"-mail
//   Trin 2 (dag 14): Sidste forsøg m. retainer-pitch til facility/ejendom-typer
//
// Når trin 2 er sendt og der stadig ikke er svar 7 dage senere markeres leadet
// "Rejected" så Sarah ikke bliver ved at hamre folk.

const FACILITY_TYPES = [
  "facility", "ejendom", "boligforening", "andel",
  "ejerforening", "hotel", "restaurant", "plejehjem",
];

function isRetainerCandidate(lead: Lead): boolean {
  const t = (lead.councilAnalysis?.customerType || "").toLowerCase();
  const i = (lead.industry || "").toLowerCase();
  return FACILITY_TYPES.some((f) => t.includes(f) || i.includes(f));
}

async function runFollowUpPipeline() {
  const allLeads = await readLeads();
  const now = Date.now();
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // ── Trin 1: dag 5 efter første mail ──────────────────────────────────────
  const trin1 = allLeads
    .filter(
      (l) =>
        l.status === "Sent" &&
        l.email &&
        l.sentAt &&
        l.sentAt <= fiveDaysAgo &&
        !l.followUp1SentAt
    )
    .slice(0, 8);

  // ── Trin 2: dag 14 efter første mail (= dag 9 efter trin 1) ─────────────
  const trin2 = allLeads
    .filter(
      (l) =>
        l.status === "Sent" &&
        l.email &&
        l.sentAt &&
        l.sentAt <= fourteenDaysAgo &&
        l.followUp1SentAt &&
        !l.followUp2SentAt
    )
    .slice(0, 6);

  // ── Auto-close: trin 2 sendt + 7 dage uden svar = lukket ─────────────────
  const toClose = allLeads.filter(
    (l) =>
      l.status === "Sent" &&
      l.followUp2SentAt &&
      l.followUp2SentAt <= sevenDaysAgo
  );

  if (trin1.length === 0 && trin2.length === 0 && toClose.length === 0) {
    return { followUp1Sent: 0, followUp2Sent: 0, autoClosed: 0 };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM ?? "Sarah <onboarding@resend.dev>";
  const updatedLeads = [...allLeads];

  let followUp1Sent = 0;
  let followUp2Sent = 0;

  // ── Send trin 1 ──────────────────────────────────────────────────────────
  for (const lead of trin1) {
    try {
      const firstName = lead.contactName?.split(" ")[0] || lead.companyName;
      const subject = `Re: ${(lead.draftSubject ?? "KrydsByg").replace(/^\[.*?\]\s*/, "")}`;
      const body = [
        `Hej ${firstName},`,
        ``,
        `Jeg sendte dig en mail for et par dage siden om hvad KrydsByg kan gøre for ${lead.companyName}.`,
        ``,
        `Jeg vil bare høre om du fik den, og om det er noget der er relevant for jer lige nu.`,
        ``,
        `Det tager blot 10 minutter at afklare om vi kan hjælpe. Ring gerne på +45 42 77 88 66 eller svar direkte på denne mail.`,
        ``,
        `Med venlig hilsen,`,
      ].join("\n");

      const html = buildEmailHtml({ body, preheader: "Bare en kort opfølgning fra KrydsByg" });
      await resend.emails.send({
        from, to: [lead.email!], bcc: ["kontakt@krydsbyg.com"],
        replyTo: "kontakt@krydsbyg.com",
        subject, html, text: buildEmailText(body),
        headers: {
          "List-Unsubscribe": "<mailto:kontakt@krydsbyg.com?subject=afmeld>",
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      const idx = updatedLeads.findIndex((l) => l.id === lead.id);
      const ts = new Date().toISOString();
      if (idx !== -1) updatedLeads[idx] = { ...updatedLeads[idx], followUp1SentAt: ts, updatedAt: ts };
      followUp1Sent++;
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error(`[follow-up trin 1] fejl for ${lead.id}:`, err);
    }
  }

  // ── Send trin 2 (m. retainer-pitch hvis facility/ejendom) ────────────────
  for (const lead of trin2) {
    try {
      const firstName = lead.contactName?.split(" ")[0] || lead.companyName;
      const subject = `Sidste mail fra KrydsByg`;
      const isRetainer = isRetainerCandidate(lead);

      const retainerPitch = isRetainer
        ? [
            ``,
            `For virksomheder som jer ser jeg ofte at en fast månedlig aftale (retainer) giver god mening — fra 5 dage/md får I prioriteret booking og 5-10% rabat på alle vores satser.`,
            ``,
          ]
        : [``, `Vi tilbyder også fastpris-aftaler hvis det passer bedre end timepris.`, ``];

      const body = [
        `Hej ${firstName},`,
        ``,
        `Jeg har skrevet til dig et par gange og forstår godt hvis det ikke er aktuelt lige nu — så vil jeg ikke fylde din indbakke mere.`,
        ...retainerPitch,
        `Hvis det bliver relevant senere, så er vi altid kun en opringning væk på +45 42 77 88 66.`,
        ``,
        `Tak for din tid.`,
        ``,
        `Med venlig hilsen,`,
      ].join("\n");

      const html = buildEmailHtml({ body, preheader: "Sidste opfølgning fra KrydsByg" });
      await resend.emails.send({
        from, to: [lead.email!], bcc: ["kontakt@krydsbyg.com"],
        replyTo: "kontakt@krydsbyg.com",
        subject, html, text: buildEmailText(body),
        headers: {
          "List-Unsubscribe": "<mailto:kontakt@krydsbyg.com?subject=afmeld>",
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      const idx = updatedLeads.findIndex((l) => l.id === lead.id);
      const ts = new Date().toISOString();
      if (idx !== -1) updatedLeads[idx] = { ...updatedLeads[idx], followUp2SentAt: ts, updatedAt: ts };
      followUp2Sent++;
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error(`[follow-up trin 2] fejl for ${lead.id}:`, err);
    }
  }

  // ── Auto-close ───────────────────────────────────────────────────────────
  for (const lead of toClose) {
    const idx = updatedLeads.findIndex((l) => l.id === lead.id);
    if (idx !== -1) {
      updatedLeads[idx] = {
        ...updatedLeads[idx],
        status: "Rejected",
        notes: [updatedLeads[idx].notes, "Auto-lukket: ingen svar efter 3 mails over 21 dage."]
          .filter(Boolean).join("\n\n"),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (followUp1Sent > 0 || followUp2Sent > 0 || toClose.length > 0) {
    await writeLeads(updatedLeads);
  }

  return { followUp1Sent, followUp2Sent, autoClosed: toClose.length };
}

// ── GET — Vercel Cron (kl. 13:00 DK / 11:00 UTC) ────────────────────────

export async function GET(req: Request) {
  // Sikkerhed: kun Vercel Cron eller CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [outreachResult, followUpResult] = await Promise.allSettled([
      runOutreachPipeline(),
      runFollowUpPipeline(),
    ]);

    const { stats, toProcess, message } =
      outreachResult.status === "fulfilled"
        ? outreachResult.value
        : { stats: { sent: 0, lowScore: 0, noEmail: 0, errors: 0, analyzed: 0, drafted: 0, hitTimeBudget: false }, toProcess: 0, message: "Outreach fejlede" };

    const followUp = followUpResult.status === "fulfilled"
      ? followUpResult.value
      : { followUp1Sent: 0, followUp2Sent: 0, autoClosed: 0 };

    const smsLines = [
      `Hej chef! 🤖 Auto-outreach kl. 13:`,
      toProcess > 0 ? `✅ ${stats.sent} nye mails sendt` : `📭 Ingen nye leads i dag`,
      followUp.followUp1Sent > 0 ? `🔁 ${followUp.followUp1Sent} opfølgning #1 (5d)` : null,
      followUp.followUp2Sent > 0 ? `🎯 ${followUp.followUp2Sent} sidste mail (14d, m. retainer)` : null,
      followUp.autoClosed > 0 ? `🗄 ${followUp.autoClosed} lukket auto (ingen svar)` : null,
      stats.lowScore > 0 ? `⏸ ${stats.lowScore} afventer dig (lav score)` : null,
      stats.errors > 0 ? `⚠️ ${stats.errors} fejl — tjek admin` : null,
    ].filter(Boolean).join("\n");

    await notifyAdmin(smsLines);

    return NextResponse.json({ ok: true, processed: toProcess, ...followUp, message, ...stats });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[auto-outreach] kritisk fejl:", err);
    await notifyAdmin(`Hej chef! ⚠️ Auto-outreach fejlede totalt: ${msg}`).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// ── POST — Manuel trigger fra admin-dashboard ────────────────────────────

export async function POST(_req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startMs = Date.now();

  try {
    const { stats, toProcess, message } = await runOutreachPipeline();
    return NextResponse.json({
      ok: true,
      processed: toProcess,
      message,
      durationMs: Date.now() - startMs,
      ...stats,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg, durationMs: Date.now() - startMs }, { status: 500 });
  }
}
