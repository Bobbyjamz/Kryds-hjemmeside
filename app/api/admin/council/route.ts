import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readCouncilSessions, writeCouncilSessions, generateId } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { AdvisorRole, CouncilMessage, CouncilSession } from "@/lib/types";
import { ADVISORS } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPTS: Record<AdvisorRole, string> = {
  economy:
    "Du er en erfaren økonom. Rådgiv kort og præcist om budgetter, prissætning og lønsomhed for et dansk vikarbureau i byggefaget. Svar på dansk. Vær konkret og handlingsorienteret.",
  marketing:
    "Du er en erfaren marketingkonsulent. Rådgiv om synlighed, brand og leadgenerering for et dansk vikarbureau i byggefaget. Svar på dansk. Vær konkret og handlingsorienteret.",
  operations:
    "Du er en driftsekspert. Rådgiv om procesoptimering, vagtplanlægning og koordinering for et dansk vikarbureau. Svar på dansk. Vær konkret og handlingsorienteret.",
  risk:
    "Du er en risikorådgiver med juridisk baggrund. Rådgiv om compliance, forsikring og risikostyring for et dansk vikarbureau. Svar på dansk. Vær konkret og handlingsorienteret.",
};

// GET ?role=economy — hent nyeste session for advisorRole
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = req.nextUrl.searchParams.get("role") as AdvisorRole | null;
  if (!role || !ADVISORS[role]) {
    return NextResponse.json({ error: "Ugyldig role" }, { status: 400 });
  }

  const sessions = await readCouncilSessions();
  const roleSessions = sessions
    .filter((s) => s.advisorRole === role)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({ sessions: roleSessions });
}

// POST { role, sessionId?, message } — send besked, hent AI-svar
export async function POST(req: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, sessionId, message } = await req.json();
  if (!role || !ADVISORS[role as AdvisorRole]) {
    return NextResponse.json({ error: "Ugyldig role" }, { status: 400 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: "Besked er påkrævet" }, { status: 400 });
  }

  const advisorRole = role as AdvisorRole;
  const allSessions = await readCouncilSessions();

  let councilSession: CouncilSession | undefined;
  if (sessionId) {
    councilSession = allSessions.find((s) => s.id === sessionId && s.advisorRole === advisorRole);
  }
  if (!councilSession) {
    councilSession = {
      id: generateId(),
      advisorRole,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allSessions.push(councilSession);
  }

  const userMsg: CouncilMessage = {
    role: "user",
    advisorRole,
    content: message.trim(),
    createdAt: new Date().toISOString(),
  };
  councilSession.messages.push(userMsg);

  if (!process.env.ANTHROPIC_API_KEY) {
    const fallbackMsg: CouncilMessage = {
      role: "assistant",
      advisorRole,
      content: "API-nøgle mangler. Tilføj ANTHROPIC_API_KEY til .env.local for at aktivere AI-råd.",
      createdAt: new Date().toISOString(),
    };
    councilSession.messages.push(fallbackMsg);
    councilSession.updatedAt = new Date().toISOString();
    try { await writeCouncilSessions(allSessions); } catch {}
    return NextResponse.json({ session: councilSession, reply: fallbackMsg.content });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const anthropicMessages = councilSession.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPTS[advisorRole],
      messages: anthropicMessages,
    });

    const replyText =
      response.content[0]?.type === "text" ? response.content[0].text : "Intet svar fra AI.";

    const assistantMsg: CouncilMessage = {
      role: "assistant",
      advisorRole,
      content: replyText,
      createdAt: new Date().toISOString(),
    };
    councilSession.messages.push(assistantMsg);
    councilSession.updatedAt = new Date().toISOString();

    // Gem session — fejl ignoreres (Vercel har read-only filesystem i prod)
    try {
      await writeCouncilSessions(allSessions);
    } catch {}

    return NextResponse.json({ session: councilSession, reply: replyText });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Ukendt fejl";
    return NextResponse.json({ error: `AI-fejl: ${errMsg}` }, { status: 500 });
  }
}

// DELETE ?sessionId=... — slet session
export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId påkrævet" }, { status: 400 });

  const sessions = await readCouncilSessions();
  await writeCouncilSessions(sessions.filter((s) => s.id !== sessionId));
  return NextResponse.json({ ok: true });
}
