process.env.UNSUB_SECRET = "testsecret";
import { unsubUrl, verificerToken, unsubToken } from "../lib/outreach/unsubscribe";

const url = new URL(unsubUrl("Test@Krydsbyg.com"));
const e = decodeURIComponent(url.searchParams.get("e")!);
const t = url.searchParams.get("t")!;
if (t.length !== 32) throw new Error("token-laengde forkert: " + t.length);
if (!verificerToken(e, t)) throw new Error("gyldig token afvist");
if (verificerToken("test@krydsbyg.com", "f".repeat(32))) throw new Error("forkert token accepteret");
if (unsubToken("TEST@krydsbyg.com") !== unsubToken("test@krydsbyg.com")) throw new Error("case-normalisering fejlede");
console.log("UNSUB-TEST: ALLE 4 OK");
