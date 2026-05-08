import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

export const runtime = "nodejs";

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminPhone = process.env.ADMIN_PHONE;
  const token = process.env.GATEWAYAPI_TOKEN;
  const sender = process.env.GATEWAYAPI_SENDER;

  // Detaljeret diagnostik
  const diag = {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    hasAdminPhone: !!adminPhone,
    adminPhonePreview: adminPhone ? adminPhone.replace(/\d(?=\d{4})/g, "*") : null,
    hasSender: !!sender,
    sender: sender || "(default: KrydsByg)",
  };

  if (!token) {
    return NextResponse.json({ ok: false, error: "GATEWAYAPI_TOKEN ikke sat på Vercel", diag }, { status: 400 });
  }
  if (!adminPhone) {
    return NextResponse.json({ ok: false, error: "ADMIN_PHONE ikke sat på Vercel", diag }, { status: 400 });
  }

  const time = new Date().toLocaleTimeString("da-DK", { timeZone: "Europe/Copenhagen" });
  const message = `Hej chef! 👋 SMS-test kl. ${time} — opsætning virker!`;

  // Brug sendSMS direkte så vi får den faktiske GatewayAPI fejl tilbage
  const result = await sendSMS(adminPhone, message);

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      error: `GatewayAPI fejl: ${result.error}`,
      diag,
      hint: "Tjek Vercel logs for detaljer. Almindelige fejl: ugyldig token (401), forkert nummerformat, eller sender-navn med specialtegn.",
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    sentTo: diag.adminPhonePreview,
    smsId: result.smsId,
    diag,
  });
}
