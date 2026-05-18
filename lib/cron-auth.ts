import { NextResponse } from "next/server";

/**
 * Verificerer at en cron-request kommer fra Vercel Cron eller en autoriseret kilde.
 *
 * Kræver at CRON_SECRET er sat i miljø — ellers afvises alle requests.
 * Dette er en bevidst ændring fra tidligere "optional check": en manglende secret
 * må ALDRIG resultere i åbne cron-endpoints.
 *
 * Returnerer null hvis OK, ellers en 401/500 NextResponse der skal returneres.
 */
export function verifyCronAuth(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron-auth] CRON_SECRET er ikke sat — afviser request");
    return NextResponse.json(
      { error: "Server misconfigured: CRON_SECRET ikke sat" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
