import { Redis } from "@upstash/redis";

/**
 * Warming-kurve for cold outreach — haandhaevet i kode, ikke kun dokumenteret.
 * Uge 1: 20/dag -> uge 2: 50 -> uge 3: 100 -> uge 4+: 200.
 * Taelleren daekker AL udgaaende bulk-mail (cold + opfoelgninger) — det er
 * totalvolumen, mailbox-udbyderne ser.
 *
 * KPI-GATES (docs/DRIFT_TJEKLISTE.md): kurven maa kun fortsaette opad hvis
 * bounce < 2 %, 0 klager. Nulstil ved problemer: saet outreach:warming:start
 * frem i tid i Redis.
 */

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
});

const START_KEY = "outreach:warming:start"; // ISO-dato for kampagnestart
const SENDT_PREFIX = "outreach:sendt:";     // dagligt sendetaeller, TTL 48t

export function dagligtLoft(kampagneStart: Date, iDag: Date = new Date()): number {
  const dage = Math.floor((iDag.getTime() - kampagneStart.getTime()) / 86_400_000);
  if (dage < 0) return 0;
  if (dage < 7) return 20;
  if (dage < 14) return 50;
  if (dage < 21) return 100;
  return 200;
}

/** Saet kampagnestart foerste gang der sendes (idempotent). */
export async function hentEllerSaetStart(): Promise<Date> {
  const eksisterende = await redis.get<string>(START_KEY);
  if (eksisterende) return new Date(eksisterende);
  const nu = new Date().toISOString();
  await redis.set(START_KEY, nu);
  return new Date(nu);
}

/**
 * Reservér én afsendelse atomisk. Returnerer false naar dagens loft er naaet.
 * Redis INCR er atomisk — to samtidige koersler kan ikke begge overskride loftet.
 */
export async function reserverAfsendelse(): Promise<boolean> {
  const start = await hentEllerSaetStart();
  const loft = dagligtLoft(start);
  const noegle = SENDT_PREFIX + new Date().toISOString().slice(0, 10);
  const antal = await redis.incr(noegle);
  if (antal === 1) await redis.expire(noegle, 60 * 60 * 48);
  if (antal > loft) {
    await redis.decr(noegle);
    return false;
  }
  return true;
}

/** Dagens forbrug + loft (til morning-report/drift). */
export async function dagsStatus(): Promise<{ sendt: number; loft: number }> {
  const start = await hentEllerSaetStart();
  const noegle = SENDT_PREFIX + new Date().toISOString().slice(0, 10);
  const sendt = (await redis.get<number>(noegle)) ?? 0;
  return { sendt: Number(sendt), loft: dagligtLoft(start) };
}
