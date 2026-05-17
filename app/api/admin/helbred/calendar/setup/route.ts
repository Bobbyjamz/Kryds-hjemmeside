import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID ikke sat" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://krydsbyg.com"}/api/admin/helbred/calendar/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
