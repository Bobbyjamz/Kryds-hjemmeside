import type { Lead, SalgInfo, SalgStatus } from "@/lib/types";

const TZ = "Europe/Copenhagen";
const DOEGN = 24 * 60 * 60 * 1000;
const UGEDAGE = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface Ugetal {
  samtaler: number;
  tilbud: number;
  solgt: number;
  faktureret: number;
}

/** Ny SalgInfo med status sat og overgangen logget. Muterer ikke input. */
export function skiftStatus(salg: SalgInfo | undefined, status: SalgStatus, nu: Date): SalgInfo {
  return {
    ...salg,
    status,
    historik: [...(salg?.historik ?? []), { status, at: nu.toISOString() }],
  };
}

function senesteOvergang(salg: SalgInfo, status: SalgStatus): number | null {
  const trin = [...salg.historik].reverse().find((h) => h.status === status);
  return trin ? Date.parse(trin.at) : null;
}

/** Mail sendt for ≥ 2 døgn siden uden videre status, plus nye kontakter uden e-mail. Ældste først. */
export function ringIDag(leads: Lead[], nu: Date): Lead[] {
  const graense = nu.getTime() - 2 * DOEGN;
  const skalRinges = (l: Lead): boolean => {
    if (!l.salg) return false;
    if (l.salg.status === "ny") return !l.email;
    if (l.salg.status !== "mail_sendt") return false;
    const sendt = senesteOvergang(l.salg, "mail_sendt");
    return sendt !== null && sendt <= graense;
  };
  const tidspunkt = (l: Lead): number => (l.salg ? senesteOvergang(l.salg, l.salg.status) ?? 0 : 0);
  return leads.filter(skalRinges).sort((a, b) => tidspunkt(a) - tidspunkt(b));
}

/** Mandag 00:00 dansk tid i den uge, `nu` ligger i. */
export function mandagDenneUge(nu: Date): Date {
  const dele = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    })
      .formatToParts(nu)
      .map((p) => [p.type, p.value]),
  );
  const ugedag = UGEDAGE.indexOf(dele.weekday);
  const mandagUtcMidnat = Date.UTC(Number(dele.year), Number(dele.month) - 1, Number(dele.day) - ugedag);
  const danskTime = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(
      new Date(mandagUtcMidnat),
    ),
  );
  return new Date(mandagUtcMidnat - danskTime * 60 * 60 * 1000);
}

/** De fire ugetal ud fra statusovergange i [ugeStart, ugeStart + 7 døgn). */
export function ugetal(leads: Lead[], ugeStart: Date): Ugetal {
  const fra = ugeStart.getTime();
  const til = fra + 7 * DOEGN;
  return leads.reduce<Ugetal>(
    (tal, lead) => {
      if (!lead.salg) return tal;
      const iUgen = lead.salg.historik.filter((h) => {
        const t = Date.parse(h.at);
        return t >= fra && t < til;
      });
      const antal = (s: SalgStatus) => iUgen.filter((h) => h.status === s).length;
      const vundet = antal("vundet");
      return {
        samtaler: tal.samtaler + antal("samtale"),
        tilbud: tal.tilbud + antal("tilbud"),
        solgt: tal.solgt + vundet,
        faktureret: tal.faktureret + (vundet > 0 ? lead.salg.beloeb ?? 0 : 0),
      };
    },
    { samtaler: 0, tilbud: 0, solgt: 0, faktureret: 0 },
  );
}
