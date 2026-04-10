import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await clearAdminCookie();
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/admin/login`, { status: 303 });
}
