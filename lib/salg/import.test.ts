import { describe, it, expect } from "vitest";
import type { Lead } from "@/lib/types";
import { flettIndLeads, parseIndsatteRaekker } from "./import";

const NU = new Date("2026-09-16T10:00:00.000Z");
let taeller = 0;
const nyId = () => `id-${++taeller}`;

function eksisterende(email: string, medSalg: boolean): Lead {
  return {
    id: `gammel-${email}`,
    companyName: "Gammelt firma",
    email,
    status: "New",
    ...(medSalg ? { salg: { status: "ny" as const, historik: [{ status: "ny" as const, at: "2026-09-01T00:00:00.000Z" }] } } : {}),
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  };
}

describe("parseIndsatteRaekker", () => {
  it("læser tab-separerede rækker og springer tomme linjer over", () => {
    const tekst = "DEAS\tAnton Dettmann\tanmd@deas.dk\t39 46 69 51\r\n\n  CEJ \t\t amo@cej.dk \t\n";
    expect(parseIndsatteRaekker(tekst)).toEqual([
      { firma: "DEAS", kontaktnavn: "Anton Dettmann", email: "anmd@deas.dk", telefon: "39 46 69 51" },
      { firma: "CEJ", kontaktnavn: undefined, email: "amo@cej.dk", telefon: undefined },
    ]);
  });
});

describe("flettIndLeads", () => {
  it("opretter nyt lead med salgsstatus ny", () => {
    const r = flettIndLeads([], [{ firma: "DEAS", kontaktnavn: "Anton", email: "ANMD@deas.dk", telefon: "39 46 69 51" }], NU, nyId);
    expect(r.tilfoejet).toBe(1);
    expect(r.leads[0]).toMatchObject({
      companyName: "DEAS",
      contactName: "Anton",
      email: "anmd@deas.dk",
      phone: "39 46 69 51",
      status: "New",
      salg: { status: "ny", historik: [{ status: "ny", at: NU.toISOString() }] },
    });
  });

  it("springer over hvis e-mailen allerede er på salgslisten (uanset store bogstaver)", () => {
    const r = flettIndLeads([eksisterende("amo@cej.dk", true)], [{ firma: "CEJ", email: "AMO@cej.dk" }], NU, nyId);
    expect(r.tilfoejet).toBe(0);
    expect(r.sprunget).toEqual(["CEJ (amo@cej.dk er allerede på listen)"]);
    expect(r.leads).toHaveLength(1);
  });

  it("sætter salg på et eksisterende lead der ikke er på listen", () => {
    const r = flettIndLeads([eksisterende("amo@cej.dk", false)], [{ firma: "CEJ", email: "amo@cej.dk" }], NU, nyId);
    expect(r.tilfoejet).toBe(1);
    expect(r.leads).toHaveLength(1);
    expect(r.leads[0].id).toBe("gammel-amo@cej.dk");
    expect(r.leads[0].salg?.status).toBe("ny");
  });

  it("springer rækker uden firma og header-rækker over", () => {
    const r = flettIndLeads([], [{ firma: "  " }, { firma: "Firma", email: "E-mail" }, { firma: "Virksomhed" }], NU, nyId);
    expect(r.tilfoejet).toBe(0);
    expect(r.sprunget).toEqual(["(række uden firma)", "(overskriftsrække)", "(overskriftsrække)"]);
  });

  it("ændrer ikke input-arrayet", () => {
    const input: Lead[] = [];
    flettIndLeads(input, [{ firma: "DEAS" }], NU, nyId);
    expect(input).toHaveLength(0);
  });
});
