import { describe, it, expect } from "vitest";
import type { Lead, SalgInfo, SalgStatus } from "@/lib/types";
import { mandagDenneUge, ringIDag, skiftStatus, ugetal } from "./beregn";

const NU = new Date("2026-09-16T10:00:00.000Z"); // onsdag

function salg(...trin: [SalgStatus, string][]): SalgInfo {
  return {
    status: trin[trin.length - 1][0],
    historik: trin.map(([status, at]) => ({ status, at })),
  };
}

function lead(id: string, s: SalgInfo | undefined, email = `${id}@firma.dk`): Lead {
  return {
    id,
    companyName: `Firma ${id}`,
    email,
    status: "New",
    salg: s,
    createdAt: NU.toISOString(),
    updatedAt: NU.toISOString(),
  };
}

describe("skiftStatus", () => {
  it("sætter status og tilføjer historik uden at ændre input", () => {
    const foer = salg(["ny", "2026-09-14T08:00:00.000Z"]);
    const efter = skiftStatus(foer, "mail_sendt", NU);
    expect(efter.status).toBe("mail_sendt");
    expect(efter.historik).toEqual([
      { status: "ny", at: "2026-09-14T08:00:00.000Z" },
      { status: "mail_sendt", at: NU.toISOString() },
    ]);
    expect(foer.status).toBe("ny");
    expect(foer.historik).toHaveLength(1);
  });

  it("starter historikken når salg mangler", () => {
    expect(skiftStatus(undefined, "ny", NU)).toEqual({
      status: "ny",
      historik: [{ status: "ny", at: NU.toISOString() }],
    });
  });

  it("beholder note og beløb", () => {
    const efter = skiftStatus({ ...salg(["tilbud", "2026-09-15T08:00:00.000Z"]), note: "ring efter 14", beloeb: 6000 }, "vundet", NU);
    expect(efter.note).toBe("ring efter 14");
    expect(efter.beloeb).toBe(6000);
  });
});

describe("ringIDag", () => {
  it("tager mail sendt for mindst 2 døgn siden, ikke 1 døgn siden", () => {
    const gammel = lead("a", salg(["ny", "2026-09-10T08:00:00.000Z"], ["mail_sendt", "2026-09-14T09:00:00.000Z"]));
    const frisk = lead("b", salg(["ny", "2026-09-10T08:00:00.000Z"], ["mail_sendt", "2026-09-15T09:00:00.000Z"]));
    expect(ringIDag([gammel, frisk], NU).map((l) => l.id)).toEqual(["a"]);
  });

  it("tager nye kontakter uden e-mail, ikke nye med e-mail", () => {
    const udenMail = lead("c", salg(["ny", "2026-09-16T08:00:00.000Z"]), "");
    const medMail = lead("d", salg(["ny", "2026-09-16T08:00:00.000Z"]));
    expect(ringIDag([udenMail, medMail], NU).map((l) => l.id)).toEqual(["c"]);
  });

  it("ignorerer leads uden salg og andre statusser, ældste først", () => {
    const aeldst = lead("e", salg(["mail_sendt", "2026-09-01T09:00:00.000Z"]));
    const mellem = lead("f", salg(["mail_sendt", "2026-09-10T09:00:00.000Z"]));
    const ringet = lead("g", salg(["mail_sendt", "2026-09-01T09:00:00.000Z"], ["ringet", "2026-09-03T09:00:00.000Z"]));
    const legacy = lead("h", undefined);
    expect(ringIDag([mellem, ringet, legacy, aeldst], NU).map((l) => l.id)).toEqual(["e", "f"]);
  });
});

describe("mandagDenneUge", () => {
  it("finder mandag 00:00 dansk sommertid", () => {
    expect(mandagDenneUge(NU).toISOString()).toBe("2026-09-13T22:00:00.000Z");
  });

  it("finder mandag 00:00 dansk vintertid", () => {
    expect(mandagDenneUge(new Date("2026-12-02T10:00:00.000Z")).toISOString()).toBe("2026-11-29T23:00:00.000Z");
  });

  it("mandag 00:30 og søndag 23:30 dansk tid hører til hver sin rigtige uge", () => {
    expect(mandagDenneUge(new Date("2026-09-13T22:30:00.000Z")).toISOString()).toBe("2026-09-13T22:00:00.000Z");
    expect(mandagDenneUge(new Date("2026-09-20T21:30:00.000Z")).toISOString()).toBe("2026-09-13T22:00:00.000Z");
  });
});

describe("ugetal", () => {
  const uge = new Date("2026-09-13T22:00:00.000Z");

  it("tæller overgange i ugen og summerer beløb for vundne", () => {
    const a = lead("a", {
      ...salg(
        ["mail_sendt", "2026-09-10T09:00:00.000Z"],
        ["samtale", "2026-09-15T09:00:00.000Z"],
        ["tilbud", "2026-09-16T09:00:00.000Z"],
        ["vundet", "2026-09-17T09:00:00.000Z"],
      ),
      beloeb: 6000,
    });
    const forrigeUge = lead("b", salg(["samtale", "2026-09-12T09:00:00.000Z"]));
    const c = lead("c", salg(["samtale", "2026-09-14T08:00:00.000Z"], ["tabt", "2026-09-14T09:00:00.000Z"]));
    expect(ugetal([a, forrigeUge, c, lead("d", undefined)], uge)).toEqual({
      samtaler: 2,
      tilbud: 1,
      solgt: 1,
      faktureret: 6000,
    });
  });

  it("tæller ikke en overgang præcis ved ugens slutning", () => {
    const naesteUge = lead("e", salg(["samtale", "2026-09-20T22:00:00.000Z"]));
    expect(ugetal([naesteUge], uge).samtaler).toBe(0);
  });
});
