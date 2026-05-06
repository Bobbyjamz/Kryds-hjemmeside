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

async function runSarah(lead: Lead, council: CouncilAnalysis): Promise<{ subject: string; body: string }> {
  const briefing = council.sarahBriefing;
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
  const stats = { analyzed: 0, drafted: 0, sent: 0, noEmail: 0, lowScore: 0, errors: 0 };

  const allLeads = await readLeads();

  // Kun "New" leads — max 25 per kørsel (timeout-sikkert)
  const toProcess = allLeads.filter((l) => l.status === "New").slice(0, 25);

  if (toProcess.length === 0) {
    return { stats, toProcess: 0, message: "Ingen New leads" };
  }

  const updatedLeads = [...allLeads];

  for (const lead of toProcess) {
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

// ── GET — Vercel Cron (kl. 13:00 DK / 11:00 UTC) ────────────────────────

export async function GET(req: Request) {
  // Sikkerhed: kun Vercel Cron eller CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stats, toProcess, message } = await runOutreachPipeline();

    if (toProcess === 0) {
      await notifyAdmin("Hej chef! 🤖 Auto-outreach kl. 13: ingen nye leads at behandle i dag.");
      return NextResponse.json({ ok: true, message });
    }

    const smsLines = [
      `Hej chef! 🤖 Auto-outreach kl. 13 er færdig:`,
      `✅ ${stats.sent} mails sendt af Sarah`,
      stats.lowScore > 0 ? `⏸ ${stats.lowScore} venter på dig (lav score)` : null,
      stats.noEmail > 0 ? `📭 ${stats.noEmail} mangler email` : null,
      stats.errors > 0 ? `⚠️ ${stats.errors} fejl — tjek admin` : null,
    ].filter(Boolean).join("\n");

    await notifyAdmin(smsLines);

    return NextResponse.json({ ok: true, processed: toProcess, ...stats });

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
