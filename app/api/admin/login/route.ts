import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Rate limit: max 5 forsøg pr. IP pr. 5 minutter
  const ip = getClientIp(req);
  const rl = await rateLimit(`login:${ip}`, 5, 300);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `For mange loginforsøg — prøv igen om ${Math.ceil(rl.resetIn / 60)} min.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.resetIn),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  }

  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Manglende brugernavn eller kodeord" }, { status: 400 });
    }
    const ok = await verifyAdminPassword(String(username), String(password));
    if (!ok) {
      return NextResponse.json({ error: "Ugyldigt brugernavn eller kodeord" }, { status: 401 });
    }
    await setAdminCookie(String(username));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json({ error: "Login fejlede" }, { status: 500 });
  }
}
