import { createHmac, timingSafeEqual } from "crypto";
import { normaliserEmail } from "@/lib/outreach/suppression";

/**
 * HMAC-signerede afmeld-links. Uden token kan hvem som helst masse-afmelde
 * vores leads via GET /afmeld?e=... — med global suppression er det permanent.
 * Bagudkompatibelt: er UNSUB_SECRET ikke sat, opfoerer alt sig som foer (ingen token).
 */

const BASE = "https://krydsbyg.com";

function secret(): string {
  return process.env.UNSUB_SECRET ?? "";
}

export function unsubToken(email: string): string {
  if (!secret()) return "";
  return createHmac("sha256", secret()).update(normaliserEmail(email)).digest("hex").slice(0, 32);
}

export function unsubUrl(email: string): string {
  const e = encodeURIComponent(normaliserEmail(email));
  const t = unsubToken(email);
  return t ? `${BASE}/afmeld?e=${e}&t=${t}` : `${BASE}/afmeld?e=${e}`;
}

/** Uden UNSUB_SECRET: altid gyldig (gamle links). Med: kraev korrekt token. */
export function verificerToken(email: string, token: string): boolean {
  if (!secret()) return true;
  if (!token) return false;
  const rigtig = Buffer.from(unsubToken(email));
  const givet = Buffer.from(token);
  return rigtig.length === givet.length && timingSafeEqual(rigtig, givet);
}
