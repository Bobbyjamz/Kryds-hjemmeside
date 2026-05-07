/**
 * LeadBot reader-endpoint — bot'en henter sin egen config fra denne URL.
 *
 * GET /api/leadbot/config
 * Headers: X-LeadBot-Signature: sha256=<hex>   (HMAC over et tomt body)
 *
 * Authentikation: Samme HMAC som /api/leadbot/ingest, men signaturen er over
 * det tomme body "" (eller en valgfri "nonce"-query param hvis du vil tvinge
 * forskellige signaturer over tid).
 */

import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { readLeadBotConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(payload: string, headerValue: string | null, secret: string): boolean {
  if (!headerValue) return false;
  const match = headerValue.match(/^sha256=([0-9a-f]+)$/i);
  if (!match) return false;
  const provided = Buffer.from(match[1], "hex");
  const expected = crypto.createHmac("sha256", secret).update(payload, "utf8").digest();
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

export async function GET(req: NextRequest) {
  const secret = process.env.LEADBOT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfigured: LEADBOT_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }

  // Signaturen er over query string (uden ?) — eller "" hvis ingen.
  const url = new URL(req.url);
  const signedPayload = url.search.startsWith("?") ? url.search.slice(1) : "";

  const signature = req.headers.get("x-leadbot-signature");
  if (!verifySignature(signedPayload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const config = await readLeadBotConfig();
  return NextResponse.json({ ok: true, config });
}
