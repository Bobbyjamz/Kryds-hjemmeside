import { Redis } from "@upstash/redis";

/**
 * Global suppression-liste — fælles kilde til sandhed på tværs af
 * leads (auto-outreach) og sarah_contacts (/afmeld, Resend-webhook).
 * Nøglen er EMAIL, ikke lead-id: overlever at leads slettes/gen-importeres.
 * Tjekkes FØR HVER afsendelse. En adresse forlader ALDRIG listen automatisk.
 */

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
});

const KEY = "outreach:suppression";

export type SuppressionReason = "afmeld-klik" | "stop-svar" | "bounce" | "klage" | "manuel";

/** Normalisér så "Foo@Bar.dk " og "foo@bar.dk" rammer samme post. */
export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Er adressen blokeret? Kaldes før hver afsendelse — cold OG opfølgning. */
export async function erBlokeret(email: string): Promise<boolean> {
  const e = normaliserEmail(email);
  if (!e) return false;
  const hit = await redis.sismember(KEY, e);
  return hit === 1;
}

/** Blokér adressen permanent. Idempotent. */
export async function blokerEmail(email: string, reason: SuppressionReason): Promise<void> {
  const e = normaliserEmail(email);
  if (!e) return;
  await redis.sadd(KEY, e);
  await redis.hset(`${KEY}:detaljer`, {
    [e]: JSON.stringify({ reason, dato: new Date().toISOString() }),
  });
}

/** Antal blokerede (til drift-rapport/morning-report). */
export async function antalBlokerede(): Promise<number> {
  return await redis.scard(KEY);
}
