/**
 * Delt Council-hjerne — bruges af Sarah (outreach) og Tilbud-systemet.
 * Kalder Claude direkte med den relevante rådgiver-kontekst.
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const KRYDSBYG_KONTEKST = `
KrydsByg ApS er et dansk vikarbureau i København, specialiseret i byggeri og håndværk.
Vi matcher faglærte og ufaglærte med byggeprojekter: tømrer, murer, stillads, nedrivning, VVS, el, maler, jord og anlæg.
Grundlægger: Krystian Balasz, uddannet bygningskonstruktør.
Hjemmeside: krydsbyg.com
`;

export async function getCouncilAdviceForEmail(contact: {
  name: string;
  company: string;
  trade: string;
  type: "medarbejder" | "partner";
}): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 250,
    system: `Du er KrydsByg's marketing-rådgiver.${KRYDSBYG_KONTEKST}
Giv ÉN konkret anbefaling (max 80 ord) om den bedste emailvinkel til denne kontakt.
Hvad motiverer dem? Hvilken åbningslinje virker? Ét konkret argument.
Svar kun med anbefalingen — ingen præambel.`,
    messages: [
      {
        role: "user",
        content: `Kontakt:\nNavn: ${contact.name}\nFirma: ${contact.company}\nFag/branche: ${contact.trade || "byggeri generelt"}\nType: ${contact.type === "partner" ? "potentiel samarbejdspartner/kunde" : "potentiel medarbejder"}`,
      },
    ],
  });
  return (msg.content[0] as { type: string; text: string }).text ?? "";
}

export async function generateOutreachEmail(contact: {
  name: string;
  company: string;
  trade: string;
  type: "medarbejder" | "partner";
}, advice: string, isFollowUp = false): Promise<{ subject: string; body: string }> {
  const defaultSubject = isFollowUp
    ? `Opfølgning — KrydsByg`
    : contact.type === "partner"
    ? `Samarbejde om bemanding — KrydsByg`
    : `Jobmulighed i byggeri — KrydsByg`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 450,
    system: `Du er Sarah Møller, personlig assistent for Krystian Balasz hos KrydsByg ApS.${KRYDSBYG_KONTEKST}
Skriv korte, direkte og venlige emails på dansk.
Afslut altid med: "/ Krystian · KrydsByg ApS · +45 42 77 88 66 · krydsbyg.com"
Første linje i output: SUBJECT: [emnelinje]
Derefter tom linje, derefter brødtekst (maks 80 ord).

Reference-skabeloner (brug som inspiration, personaliser altid):
A — Kold første kontakt (partner/kunde): "Hej [Fornavn], jeg hedder Krystian fra KrydsByg — vi er et københavnsk bemandingsbureau specialiseret i byggeri. Hvis I mangler en [fag] hurtigt, kan vi stille folk klar inden for 24 timer. Timeafregning eller fastpris — ingen binding. Har I et projekt kørende?"
B — Opfølgning 7 dage: "Hej [Fornavn], bare en hurtig opfølgning — er der et tidspunkt i de næste uger hvor I kunne have glæde af ekstra hænder på pladsen?"
C — Retargeting: "Hej [Fornavn], det var fedt at arbejde med jer. Vi nærmer os [sæson] og vores kalender begynder at fyldes. Har I projekter på vej?"
D — Medarbejder: "Hej [Fornavn], vi har brug for dygtige [fag] til projekter i København. Fleksibel tilmelding, hurtig udbetaling."`,
    messages: [
      {
        role: "user",
        content: `Skriv en ${isFollowUp ? "opfølgnings" : "første kontakt"} email til:
Navn: ${contact.name}
Firma: ${contact.company}
Type: ${contact.type === "partner" ? "potentiel samarbejdspartner/kunde" : "potentiel medarbejder"}
Fag: ${contact.trade || "byggeri generelt"}

Council-rådgivning: ${advice}
${isFollowUp ? "\nDette er en blid opfølgning — de svarede ikke på første email." : ""}`,
      },
    ],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text ?? "";
  const lines = raw.trim().split("\n");
  let subject = defaultSubject;
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toUpperCase().startsWith("SUBJECT:")) {
      subject = lines[i].split(":").slice(1).join(":").trim() || defaultSubject;
      bodyStart = i + 1;
      break;
    }
  }
  const body = lines.slice(bodyStart).join("\n").trim();
  return { subject, body };
}

export async function getCouncilAdviceForTilbud(task: {
  description: string;
  trade: string;
  hours: number;
  location: string;
}): Promise<{ pricingAdvice: string; emailText: string; hourlyRate: number; materialsCost: number }> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    system: `Du er KrydsByg's økonomi- og driftsrådgiver.${KRYDSBYG_KONTEKST}
Hjælp med at prissætte og formulere et professionelt tilbud.
Returner KUN et JSON-objekt med disse felter:
{
  "hourlyRate": number (DKK pr. time ekskl. moms, realistisk for ${new Date().getFullYear()} i Storkøbenhavn),
  "materialsCost": number (estimeret materialeomkostning i DKK),
  "pricingAdvice": string (kort begrundelse for prisen, max 60 ord),
  "emailText": string (professionel tilbudstekst til kunden, max 100 ord, dansk)
}`,
    messages: [
      {
        role: "user",
        content: `Opgave: ${task.description}\nFag: ${task.trade}\nEstimerede timer: ${task.hours}\nLokation: ${task.location}`,
      },
    ],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text ?? "{}";
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      hourlyRate: 450,
      materialsCost: 0,
      pricingAdvice: "Standardpris for faget i Storkøbenhavn.",
      emailText: `Hermed vores tilbud på opgaven som beskrevet. Vi ser frem til et godt samarbejde.\n\nKrystian Balasz · KrydsByg ApS · krydsbyg.com`,
    };
  }
}
