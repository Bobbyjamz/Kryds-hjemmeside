import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
