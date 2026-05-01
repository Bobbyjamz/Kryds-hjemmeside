import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const checks: CheckResult[] = [];

  // ── KV connectivity test (write + read + delete) ─────────────────
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const testKey = "_health_check_" + Date.now();
    const testValue = { ts: new Date().toISOString(), random: Math.random() };
    await redis.set(testKey, testValue, { ex: 60 }); // expires in 60 sec
    const readBack = await redis.get<typeof testValue>(testKey);
    await redis.del(testKey);
    if (readBack && readBack.random === testValue.random) {
      checks.push({ name: "KV database", ok: true, detail: "Write + read + delete fungerer" });
    } else {
      checks.push({ name: "KV database", ok: false, detail: "Read returnerede ikke samme værdi" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    checks.push({ name: "KV database", ok: false, detail: `Fejl: ${msg}` });
  }

  // ── Env var presence (uden at lække værdier) ─────────────────────
  const ENV_GROUPS: { name: string; vars: string[]; required: boolean }[] = [
    { name: "Auth (JWT + admin)", vars: ["JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD_HASH_B64"], required: true },
    { name: "KV-database",        vars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],        required: true },
    { name: "Resend (email)",     vars: ["RESEND_API_KEY", "RESEND_FROM"],                            required: true },
    { name: "Anthropic (Council)",vars: ["ANTHROPIC_API_KEY"],                                        required: true },
    { name: "GatewayAPI (SMS)",   vars: ["GATEWAYAPI_TOKEN", "GATEWAYAPI_SENDER"],                    required: false },
    { name: "Admin SMS-modtager", vars: ["ADMIN_PHONE"],                                              required: false },
  ];

  for (const group of ENV_GROUPS) {
    const missing = group.vars.filter((v) => !process.env[v]);
    if (missing.length === 0) {
      checks.push({ name: group.name, ok: true, detail: "Alle nøgler sat" });
    } else if (missing.length === group.vars.length) {
      checks.push({
        name: group.name,
        ok: !group.required,
        detail: group.required ? `Mangler: ${missing.join(", ")}` : `Ikke konfigureret (valgfri)`,
      });
    } else {
      checks.push({ name: group.name, ok: false, detail: `Delvist sat — mangler: ${missing.join(", ")}` });
    }
  }

  const allOk = checks.every((c) => c.ok);
  return NextResponse.json({ ok: allOk, checks, timestamp: new Date().toISOString() });
}
