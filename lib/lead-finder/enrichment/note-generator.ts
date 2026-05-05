/**
 * Note-generator — bruger AI til at skrive en personlig "Sarahs noter" linje per lead.
 * Præcis som Excel-arket: konkret, handlingsorienteret, nævner specifik info om firmaet.
 *
 * Kaldets maksimalt én gang per lead og er lavt token-forbrug (~150 tokens per note).
 * Kører batch for at spare API-kald.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { LeadCandidate } from "../types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NOTE_SYSTEM = `Du er Sarah — KrydsByg's outreach-assistent. Du skriver korte, personlige salgsnoter på dansk.
En "Sarahs note" er 2-3 sætninger der fortæller hvad firmaet/personen laver, og præcis hvad KrydsByg kan gøre FOR DEM specifikt.
Stil: selvsikker, konkret, aldrig generisk. Nævn altid noget specifikt om dem.
Returner KUN noten som plain text — ingen label, ingen anførselstegn udenom.`;

/**
 * Genererer én note per lead i batch.
 * Bruger Promise.allSettled — fejl på ét lead stopper ikke resten.
 * Returnerer array i samme rækkefølge som input.
 */
export async function generateNotes(candidates: LeadCandidate[]): Promise<string[]> {
  const results = await Promise.allSettled(
    candidates.map((c) => generateSingleNote(c))
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    // Fallback: byg en simpel note fra tilgængelige felter
    return buildFallbackNote(candidates[i]);
  });
}

async function generateSingleNote(c: LeadCandidate): Promise<string> {
  const prompt = buildPrompt(c);

  const msg = await client.messages.create({
    model: "claude-haiku-4-5",  // Haiku er hurtig og billig til korte noter
    max_tokens: 200,
    system: NOTE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  return text || buildFallbackNote(c);
}

function buildPrompt(c: LeadCandidate): string {
  const parts: string[] = [];

  if (c.leadType === "company") {
    parts.push(`Virksomhed: ${c.companyName}`);
    if (c.contactName) parts.push(`Kontakt: ${c.contactName}${c.contactTitle ? ` (${c.contactTitle})` : ""}`);
    if (c.industry) parts.push(`Branche: ${c.industry}`);
    if (c.website) parts.push(`Website: ${c.website}`);
    if (c.notes) parts.push(`Baggrund: ${c.notes}`);
    parts.push(`Skriv en salgs-note til Sarah om hvad KrydsByg kan tilbyde dette firma. Nævn rengøring, malerarbejde, flytning, håndværk eller vedligehold alt efter hvad der passer.`);
  } else if (c.leadType === "private") {
    parts.push(`Privat person: ${c.companyName}`);
    if (c.address) parts.push(`Adresse: ${c.address}`);
    if (c.notes) parts.push(`Baggrund: ${c.notes}`);
    parts.push(`Skriv en note om hvad KrydsByg kan hjælpe denne nyindflyttede/renoverende person med.`);
  } else {
    // employee
    parts.push(`Jobsøger: ${c.companyName}`);
    if (c.contactName) parts.push(`Navn: ${c.contactName}`);
    if (c.industry) parts.push(`Baggrund/erfaring: ${c.industry}`);
    if (c.notes) parts.push(`Baggrund: ${c.notes}`);
    parts.push(`Skriv en rekrutterings-note til Sarah om hvad KrydsByg kan tilbyde denne jobsøger (fleksibel arbejdstid, god løn, varierede opgaver).`);
  }

  return parts.join("\n");
}

function buildFallbackNote(c: LeadCandidate): string {
  if (c.leadType === "company") {
    return `${c.companyName} er i ${c.city || "Storkøbenhavn"} og har behov for ${c.serviceType || "løbende vedligehold"}. KrydsByg kan tilbyde en fast aftale med hurtig opstart og konkurrencedygtig pris.`;
  }
  if (c.leadType === "private") {
    return `Nyindflyttet eller renoverende boligkøber. KrydsByg kan stå for maling, gulv, montering og oprydning — ét firma, ingen stress.`;
  }
  return `Potentiel medarbejder med erfaring inden for ${c.industry || "servicemedgangen"}. KrydsByg tilbyder fleksible timer, god timeløn og varierede opgaver i København.`;
}
