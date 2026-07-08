import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { blokerEmail, erBlokeret, antalBlokerede, type SuppressionReason } from "@/lib/outreach/suppression";

export const runtime = "nodejs";

/**
 * Maskin-endpoint til suppression — bruges af Salg/-sekretaeren naar et
 * "stop"-svar (AFMELDING) fanges i indbakken. Auth: Bearer CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const authFejl = verifyCronAuth(req);
  if (authFejl) return authFejl;

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const reason: SuppressionReason = body?.reason === "stop-svar" ? "stop-svar" : "manuel";
  if (!email) return NextResponse.json({ error: "email mangler" }, { status: 400 });

  await blokerEmail(email, reason);
  return NextResponse.json({ ok: true, blokeret: email, total: await antalBlokerede() });
}

export async function GET(req: NextRequest) {
  const authFejl = verifyCronAuth(req);
  if (authFejl) return authFejl;
  const email = req.nextUrl.searchParams.get("e") ?? "";
  return NextResponse.json({ email, blokeret: email ? await erBlokeret(email) : null, total: await antalBlokerede() });
}
