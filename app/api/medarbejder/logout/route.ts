import { NextResponse } from "next/server";
import { clearEmployeeCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await clearEmployeeCookie();
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/medarbejder/login`, { status: 303 });
}
