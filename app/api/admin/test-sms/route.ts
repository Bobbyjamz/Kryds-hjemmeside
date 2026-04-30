import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/sms";

export const runtime = "nodejs";

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminPhone = process.env.ADMIN_PHONE;
  const token = process.env.GATEWAYAPI_TOKEN;

  if (!token) {
    return NextResponse.json({ ok: false, error: "GATEWAYAPI_TOKEN ikke sat på Vercel" }, { status: 400 });
  }
  if (!adminPhone) {
    return NextResponse.json({ ok: false, error: "ADMIN_PHONE ikke sat på Vercel" }, { status: 400 });
  }

  const time = new Date().toLocaleTimeString("da-DK", { timeZone: "Europe/Copenhagen" });
  await notifyAdmin(`KrydsByg test-SMS kl. ${time} — alt fungerer 👍`);

  return NextResponse.json({ ok: true, sentTo: adminPhone });
}
