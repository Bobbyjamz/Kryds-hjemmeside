import { erBlokeret, blokerEmail, normaliserEmail } from "../lib/outreach/suppression";

async function main() {
  const test = "Suppression-Test@Example.com";
  console.assert(normaliserEmail(" Foo@BAR.dk ") === "foo@bar.dk", "normalisering fejlede");
  await blokerEmail(test, "manuel");
  if (!(await erBlokeret("suppression-test@example.com"))) throw new Error("blokering fejlede");
  if (await erBlokeret("ikke-blokeret@example.com")) throw new Error("falsk positiv");
  console.log("SUPPRESSION-TEST: ALLE OK");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
