import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { runAllDebugTests } from "@/lib/admin-debug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Rate limit: max 1 kørsel per 30 sekunder per admin (undgå API-spam)
const lastRunByUser = new Map<string, number>();
const RATE_LIMIT_MS = 30_000;

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sendTestEmail = false } = await req.json().catch(() => ({}));

  // Rate limiting
  const now = Date.now();
  const lastRun = lastRunByUser.get(session.username) || 0;
  if (now - lastRun < RATE_LIMIT_MS) {
    const wait = Math.ceil((RATE_LIMIT_MS - (now - lastRun)) / 1000);
    return NextResponse.json(
      { error: `Vent ${wait} sek. før næste kørsel (rate-limit for at undgå API-spam)` },
      { status: 429 },
    );
  }
  lastRunByUser.set(session.username, now);

  try {
    const report = await runAllDebugTests({
      adminUsername: session.username,
      sendTestEmail: !!sendTestEmail,
    });
    return NextResponse.json(report);
  } catch (err) {
    console.error("[admin/debug] uventet fejl:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ukendt fejl under test-kørsel" },
      { status: 500 },
    );
  }
}
