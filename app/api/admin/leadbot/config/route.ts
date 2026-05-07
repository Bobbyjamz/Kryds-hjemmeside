/**
 * Admin: LeadBot focus-config (læs / opdater).
 *
 * GET   /api/admin/leadbot/config       → nuværende config + DEFAULTS
 * POST  /api/admin/leadbot/config       → patch config (hele objektet eller delfelter)
 *
 * Sarah-UI bruger dette til at "fortælle" LeadBot hvad vi leder efter.
 * LeadBot læser sin egen config fra /api/leadbot/config (HMAC-protected).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readLeadBotConfig, writeLeadBotConfig } from "@/lib/db";
import { DEFAULT_LEADBOT_CONFIG, type LeadBotConfig } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await readLeadBotConfig();
  return NextResponse.json({ ok: true, config, defaults: DEFAULT_LEADBOT_CONFIG });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<LeadBotConfig>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const current = await readLeadBotConfig();

  // Sanitize input — undgå at klienten kan injecte ekstra felter
  const next: LeadBotConfig = {
    ...current,
    ...(typeof body.focus === "string" && { focus: body.focus.trim() }),
    ...(Array.isArray(body.priorityQueries) && {
      priorityQueries: body.priorityQueries.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 50),
    }),
    ...(Array.isArray(body.excludeQueries) && {
      excludeQueries: body.excludeQueries.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 50),
    }),
    ...(Array.isArray(body.cities) && {
      cities: body.cities.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 30),
    }),
    ...(["company", "employee", "both"].includes(String(body.leadTypeFocus)) && {
      leadTypeFocus: body.leadTypeFocus as LeadBotConfig["leadTypeFocus"],
    }),
    ...(body.enabledSources && typeof body.enabledSources === "object" && {
      enabledSources: {
        ...current.enabledSources,
        ...Object.fromEntries(
          Object.entries(body.enabledSources).map(([k, v]) => [k, Boolean(v)])
        ),
      } as LeadBotConfig["enabledSources"],
    }),
    ...(typeof body.minEmailConfidence === "number" && {
      minEmailConfidence: Math.max(0, Math.min(1, body.minEmailConfidence)),
    }),
    ...(typeof body.dailyLeadCap === "number" && {
      dailyLeadCap: Math.max(0, Math.floor(body.dailyLeadCap)),
    }),
    updatedAt: new Date().toISOString(),
    updatedBy: session.username,
  };

  await writeLeadBotConfig(next);
  return NextResponse.json({ ok: true, config: next });
}
