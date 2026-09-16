import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { generateId, readLeads, writeLeads } from "@/lib/db";
import { skiftStatus } from "@/lib/salg/beregn";
import { flettIndLeads, type SalgRaekke } from "@/lib/salg/import";
import type { Lead, SalgStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSSER: SalgStatus[] = ["ny", "mail_sendt", "ringet", "samtale", "tilbud", "vundet", "tabt"];
const MAKS_RAEKKER = 500;

const ikkeLoggetInd = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET() {
  if (!(await getAdminSession())) return ikkeLoggetInd();
  const leads = await readLeads();
  return NextResponse.json({ leads: leads.filter((l) => l.salg) });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return ikkeLoggetInd();
  const { rows } = (await req.json()) as { rows?: unknown };
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Ingen rækker at tilføje" }, { status: 400 });
  }
  if (rows.length > MAKS_RAEKKER) {
    return NextResponse.json({ error: `Maks ${MAKS_RAEKKER} rækker ad gangen` }, { status: 400 });
  }
  const gyldige = rows.every(
    (r) =>
      typeof r === "object" && r !== null && typeof (r as SalgRaekke).firma === "string" &&
      ["kontaktnavn", "email", "telefon"].every((k) => {
        const v = (r as Record<string, unknown>)[k];
        return v === undefined || typeof v === "string";
      }),
  );
  if (!gyldige) return NextResponse.json({ error: "Ugyldige rækker" }, { status: 400 });

  const resultat = flettIndLeads(await readLeads(), rows as SalgRaekke[], new Date(), generateId);
  await writeLeads(resultat.leads);
  return NextResponse.json({ tilfoejet: resultat.tilfoejet, sprunget: resultat.sprunget });
}

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) return ikkeLoggetInd();
  const { id, status, note, beloeb } = (await req.json()) as {
    id?: string;
    status?: SalgStatus;
    note?: string;
    beloeb?: number;
  };
  if (status !== undefined && !STATUSSER.includes(status)) {
    return NextResponse.json({ error: "Ugyldig status" }, { status: 400 });
  }
  if (note !== undefined && typeof note !== "string") {
    return NextResponse.json({ error: "Ugyldig note" }, { status: 400 });
  }
  if (beloeb !== undefined && (typeof beloeb !== "number" || !Number.isFinite(beloeb) || beloeb < 0)) {
    return NextResponse.json({ error: "Ugyldigt beløb" }, { status: 400 });
  }

  const leads = await readLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead?.salg) return NextResponse.json({ error: "Kontakt ikke fundet" }, { status: 404 });

  const nu = new Date();
  const medStatus = status && status !== lead.salg.status ? skiftStatus(lead.salg, status, nu) : lead.salg;
  const opdateret: Lead = {
    ...lead,
    salg: {
      ...medStatus,
      ...(note !== undefined ? { note } : {}),
      ...(beloeb !== undefined ? { beloeb } : {}),
    },
    updatedAt: nu.toISOString(),
  };
  await writeLeads(leads.map((l) => (l.id === id ? opdateret : l)));
  return NextResponse.json({ lead: opdateret });
}
