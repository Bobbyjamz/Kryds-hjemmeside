import type { Lead } from "@/lib/types";
import { skiftStatus } from "./beregn";

export interface SalgRaekke {
  firma: string;
  kontaktnavn?: string;
  email?: string;
  telefon?: string;
}

export interface FletResultat {
  leads: Lead[];
  tilfoejet: number;
  sprunget: string[];
}

const OVERSKRIFTER = new Set(["firma", "virksomhed"]);

/** Rækker kopieret fra Excel: Firma · Kontaktperson · E-mail · Telefon, tab-separeret. */
export function parseIndsatteRaekker(tekst: string): SalgRaekke[] {
  return tekst
    .split(/\r?\n/)
    .map((linje) => linje.split("\t").map((felt) => felt.trim()))
    .filter((felter) => felter.some(Boolean))
    .map(([firma = "", kontaktnavn = "", email = "", telefon = ""]) => ({
      firma,
      kontaktnavn: kontaktnavn || undefined,
      email: email || undefined,
      telefon: telefon || undefined,
    }));
}

/** Tilføj rækker til salgslisten. Dubletter matches på e-mail. Muterer ikke input. */
export function flettIndLeads(leads: Lead[], raekker: SalgRaekke[], nu: Date, nyId: () => string): FletResultat {
  const tidspunkt = nu.toISOString();
  return raekker.reduce<FletResultat>(
    (acc, raekke) => {
      const firma = raekke.firma.trim();
      if (!firma) return { ...acc, sprunget: [...acc.sprunget, "(række uden firma)"] };
      if (OVERSKRIFTER.has(firma.toLowerCase())) return { ...acc, sprunget: [...acc.sprunget, "(overskriftsrække)"] };

      const email = raekke.email?.trim().toLowerCase() ?? "";
      // Gamle leads i Redis kan mangle email trods typen — derfor `|| ""`
      const idx = email ? acc.leads.findIndex((l) => (l.email || "").trim().toLowerCase() === email) : -1;

      if (idx !== -1) {
        const fundet = acc.leads[idx];
        if (fundet.salg) {
          return { ...acc, sprunget: [...acc.sprunget, `${firma} (${email} er allerede på listen)`] };
        }
        const opdateret: Lead = { ...fundet, salg: skiftStatus(undefined, "ny", nu), updatedAt: tidspunkt };
        return {
          leads: acc.leads.map((l, i) => (i === idx ? opdateret : l)),
          tilfoejet: acc.tilfoejet + 1,
          sprunget: acc.sprunget,
        };
      }

      const nyLead: Lead = {
        id: nyId(),
        companyName: firma,
        contactName: raekke.kontaktnavn?.trim() || undefined,
        email,
        phone: raekke.telefon?.trim() || undefined,
        leadType: "company",
        status: "New",
        salg: skiftStatus(undefined, "ny", nu),
        createdAt: tidspunkt,
        updatedAt: tidspunkt,
      };
      return { leads: [...acc.leads, nyLead], tilfoejet: acc.tilfoejet + 1, sprunget: acc.sprunget };
    },
    { leads, tilfoejet: 0, sprunget: [] },
  );
}
