import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readHelbedSettings, writeHelbedSettings } from "@/lib/helbred-db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/admin/helbred?cal=error", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://krydsbyg.com"}/api/admin/helbred/calendar/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/admin/helbred?cal=error", req.url));
  }

  const tokens = await tokenRes.json() as { refresh_token?: string; access_token: string };

  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL("/admin/helbred?cal=notoken", req.url));
  }

  const existing = await readHelbedSettings();
  await writeHelbedSettings({ ...existing, googleCalendarRefreshToken: tokens.refresh_token });

  return NextResponse.redirect(new URL("/admin/helbred?cal=ok", req.url));
}
