import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readLeads, writeLeads } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import type { CouncilAnalysis } from "@/lib/types";

export const runtime = "nodejs";

async function isAdmin() {
  return (await cookies()).get("kryds-admin")?.value === "authenticated";
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du er KrydsByg's interne Council — et AI-panel der analyserer leads.
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

Du returnerer KUN et JSON objekt — ingen tekst før eller efter JSON.`;

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await req.json();
  const leads = await readLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Analyser dette lead og returner KUN dette JSON format (ingen tekst udenom):

Virksomhed: ${lead.companyName}
Kontaktperson: ${lead.contactName || "Ukendt"}
Email: ${lead.email}
Branche: ${lead.industry || "Ukendt"}
By: ${lead.city || "Ukendt"}
Website: ${lead.website || "Ingen"}
Relevant service: ${lead.serviceType || "Ikke angivet"}
Personlig vinkel: ${lead.personalAngle || "Ingen"}
Noter: ${lead.notes || "Ingen"}

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
  "finalRecommendation": "<samlet anbefaling til Sarah>"
}`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const analysis: CouncilAnalysis = { ...JSON.parse(clean), analyzedAt: new Date().toISOString() };

    await writeLeads(leads.map((l) =>
      l.id === leadId
        ? { ...l, status: "Analyzed" as const, councilScore: analysis.leadScore, councilAnalysis: analysis, updatedAt: new Date().toISOString() }
        : l
    ));

    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("[leads/council]", err);
    return NextResponse.json({ error: "Council analyse fejlede" }, { status: 500 });
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
