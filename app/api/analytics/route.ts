import { NextRequest, NextResponse } from "next/server";
import { appendPageView, updateDuration, readAnalytics, aggregate } from "@/lib/analytics";
import { getAdminSession } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";

// Country code → readable name
const COUNTRY_NAMES: Record<string, string> = {
  DK: "Danmark", SE: "Sverige", NO: "Norge", DE: "Tyskland", GB: "England",
  US: "USA", NL: "Holland", PL: "Polen", FI: "Finland", FR: "Frankrig",
  ES: "Spanien", IT: "Italien", BE: "Belgien", CH: "Schweiz", AT: "Østrig",
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] ?? code ?? "Ukendt";
}

// POST /api/analytics — record a page view
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, id, duration } = body;

    // Duration update for existing visit
    if (id && typeof duration === "number") {
      await updateDuration(id, duration);
      return NextResponse.json({ ok: true });
    }

    if (!path) return NextResponse.json({ ok: false });

    // Get geo from Vercel headers (added automatically in production)
    const countryCode = req.headers.get("x-vercel-ip-country") ?? "??";
    const city = req.headers.get("x-vercel-ip-city") ?? "";

    const view = {
      id: crypto.randomUUID(),
      path: String(path).slice(0, 200),
      country: countryName(countryCode),
      city: decodeURIComponent(city).slice(0, 100),
      timestamp: new Date().toISOString(),
      duration: 0,
      referrer: String(referrer ?? "").slice(0, 200),
    };

    await appendPageView(view);
    return NextResponse.json({ ok: true, id: view.id });
  } catch (err) {
    console.error("[analytics]", err);
    return NextResponse.json({ ok: false });
  }
}

// GET /api/analytics — read aggregated data (admin only)
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const views = await readAnalytics();
    const data = aggregate(views);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[analytics/GET]", err);
    return NextResponse.json({ error: "Fejl ved læsning" }, { status: 500 });
  }
}
