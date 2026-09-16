import type { Signatur } from "@/lib/email-builder";

const TZ = "Europe/Copenhagen";
const MAANEDER = [
  "januar", "februar", "marts", "april", "maj", "juni",
  "juli", "august", "september", "oktober", "november", "december",
];
const GENERISKE = new Set(["kontakt", "info", "salg", "adm", "administration"]);

export const KRYSTIAN_SIGNATUR: Signatur = { navn: "Krystian Balasz", titel: "Direktør, KrydsByg ApS" };

export interface SalgsMail {
  subject: string;
  body: string;
}

export function naesteMaaned(nu: Date): string {
  const maaned = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "numeric" }).format(nu));
  return MAANEDER[maaned % 12];
}

export function fornavnAf(navn: string | undefined): string | undefined {
  const renset = navn?.trim();
  if (!renset || renset.includes("/")) return undefined;
  const foerste = renset.split(/\s+/)[0];
  return GENERISKE.has(foerste.toLowerCase()) ? undefined : foerste;
}

/** Planens faste salgsmail. Rettes af Krystian i preview før afsendelse. */
export function lavMail({ fornavn, firma }: { fornavn?: string; firma: string }, nu: Date): SalgsMail {
  const hilsen = fornavn?.trim() ? `Hej ${fornavn.trim()},` : "Hej,";
  return {
    subject: `Ekstra hænder til ${firma.trim()}`,
    body: [
      hilsen,
      "",
      "Vi løser de praktiske opgaver, der falder mellem håndværkerne: flytning, montering, oprydning og indvendigt vedligehold.",
      "",
      "1-2 mand, fast dagspris 3.000 kr. pr. mand ekskl. moms. Ingen binding og ingen timeoverraskelser.",
      "",
      `Har I en opgave i ${naesteMaaned(nu)}, vi kan tage?`,
      "",
      "Venlig hilsen",
      "Krystian",
    ].join("\n"),
  };
}
