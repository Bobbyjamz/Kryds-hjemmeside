import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads, readEmailMemory } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import type { CouncilAnalysis, EmailMemoryEntry } from "@/lib/types";

export const runtime = "nodejs";

async function isAdmin() {
  return (await getAdminSession()) !== null;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du er KrydsByg's interne Council — et AI-panel der analyserer leads OG giver Sarah en konkret skrive-instruktion.
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

/**
 * Bygger en kort tekst-blok med læring fra tidligere succesfulde emails i samme branche/kundetype.
 * Bruges som ekstra context til Council så briefingen baseres på hvad der historisk har virket.
 */
function buildLearningContext(industry: string | undefined, customerHint: string, memory: EmailMemoryEntry[]): string {
  // Find relevante tidligere mails — samme branche eller samme kundetype
  const relevant = memory.filter((m) => {
    const sameIndustry = industry && m.industry?.toLowerCase().includes(industry.toLowerCase());
    const sameType = customerHint && m.customerType.toLowerCase().includes(customerHint.toLowerCase());
    return sameIndustry || sameType;
  });
  if (relevant.length === 0) return "Ingen tidligere data.";

  // Top 5 nyeste relevante mails
  const top = relevant.slice(-5).reverse();
  const avgLen = Math.round(top.reduce((s, m) => s + m.bodyLength, 0) / top.length);
  const angles = [...new Set(top.map((m) => m.angle))].slice(0, 3);
  const tones = [...new Set(top.map((m) => m.tone))].slice(0, 3);

  // Saml redaktions-signaler: admin har rettet disse ting
  const editEntries = top.filter((m) => m.wasEdited && m.editSummary);
  const editHints = editEntries.length > 0
    ? `\n- Admin har tidligere rettet disse mails (lær af det): ${editEntries.map((m) => m.editSummary).join(" / ")}`
    : "";

  return `Læring fra ${top.length} tidligere mails i samme segment:
- Gennemsnitlig længde der blev sendt: ${avgLen} tegn
- Vinkler der har virket: ${angles.join(", ")}
- Toner der har virket: ${tones.join(", ")}${editHints}
Brug dette som rettesnor — uden at kopiere blindt.`;
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await req.json();
  const leads = await readLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });

  try {
    // Hent email-hukommelse for at give Council context fra tidligere succeser
    const memory = await readEmailMemory();
    const learningContext = buildLearningContext(lead.industry, lead.serviceType || "", memory);

    const msg = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
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

LÆRING FRA TIDLIGERE EMAILS:
${learningContext}

KRAV TIL SARAH-BRIEFING:
- openingLine: SKAL nævne noget specifikt om kundens branche/situation — ALDRIG generisk "Hej, jeg håber du har det godt"
- painPoints: 2-3 konkrete udfordringer som netop denne type kunde står med
- keyServices: VÆLG 1-2 KrydsByg-ydelser der matcher leadet bedst (ikke alle 9)
- subjectOptions: 2 emne-forslag, max 50 tegn hver, ingen clickbait
- callToAction: Direkte og handlingsorienteret — f.eks. "Ring tirsdag kl. 14" eller "Svar med en passende tid inden fredag"

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

    // Robust JSON-ekstraktion: find første { og matchende afsluttende }
    let parsed: Record<string, unknown>;
    try {
      // Forsøg 1: direkte parse efter strip af markdown
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      // Forsøg 2: udtræk JSON-blok med regex
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`Council returnerede intet JSON. Svar: ${text.slice(0, 200)}`);
      parsed = JSON.parse(match[0]);
    }

    const analysis: CouncilAnalysis = { ...parsed, analyzedAt: new Date().toISOString() } as CouncilAnalysis;

    await writeLeads(leads.map((l) =>
      l.id === leadId
        ? { ...l, status: "Analyzed" as const, councilScore: analysis.leadScore, councilAnalysis: analysis, updatedAt: new Date().toISOString() }
        : l
    ));

    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("[leads/council]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Council analyse fejlede: ${msg}` }, { status: 500 });
  }
}

// PUT — batch-analyser alle New leads (max 10)
export async function PUT(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await readLeads();
  const toAnalyze = leads.filter((l) => l.status === "New").slice(0, 10);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let analyzed = 0;
  for (const lead of toAnalyze) {
    try {
      await fetch(`${siteUrl}/api/admin/leads/council`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      analyzed++;
    } catch {}
  }

  return NextResponse.json({ ok: true, analyzed });
}
