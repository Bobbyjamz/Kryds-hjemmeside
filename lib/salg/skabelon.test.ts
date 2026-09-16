import { describe, it, expect } from "vitest";
import { fornavnAf, lavMail, naesteMaaned } from "./skabelon";

const NU = new Date("2026-09-16T10:00:00.000Z");

describe("lavMail", () => {
  it("fletter firma i emnet og fornavn i hilsenen", () => {
    const mail = lavMail({ fornavn: "Anne", firma: "CEJ Ejendomsadministration A/S" }, NU);
    expect(mail.subject).toBe("Ekstra hænder til CEJ Ejendomsadministration A/S");
    expect(mail.body.startsWith("Hej Anne,\n")).toBe(true);
  });

  it("skriver 'Hej,' uden fornavn", () => {
    expect(lavMail({ firma: "DEAS" }, NU).body.startsWith("Hej,\n")).toBe(true);
  });

  it("indeholder dagsprisen og spørger om næste måned", () => {
    const body = lavMail({ firma: "DEAS" }, NU).body;
    expect(body).toContain("3.000 kr. pr. mand ekskl. moms");
    expect(body).toContain("Har I en opgave i oktober, vi kan tage?");
  });
});

describe("naesteMaaned", () => {
  it("går fra december til januar", () => {
    expect(naesteMaaned(new Date("2026-12-10T10:00:00.000Z"))).toBe("januar");
  });

  it("bruger dansk tid ved månedsskifte", () => {
    // 30. sep 22:30 UTC = 1. okt 00:30 dansk tid
    expect(naesteMaaned(new Date("2026-09-30T22:30:00.000Z"))).toBe("november");
  });
});

describe("fornavnAf", () => {
  it("tager første ord af et navn", () => {
    expect(fornavnAf("Anne Marie Oksen (direktør, advokat)")).toBe("Anne");
  });

  it("returnerer undefined for generiske kontakter", () => {
    expect(fornavnAf("Kontakt / salg")).toBeUndefined();
    expect(fornavnAf("info")).toBeUndefined();
    expect(fornavnAf("")).toBeUndefined();
    expect(fornavnAf(undefined)).toBeUndefined();
  });
});
