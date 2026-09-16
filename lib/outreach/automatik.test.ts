import { describe, it, expect } from "vitest";
import type { Lead } from "@/lib/types";
import { tilladtForAutomatik } from "./automatik";

function lead(salg?: Lead["salg"]): Lead {
  return {
    id: "x",
    companyName: "Firma",
    email: "a@firma.dk",
    status: "New",
    salg,
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
  };
}

describe("tilladtForAutomatik", () => {
  it("afviser kontakter på salgslisten — de håndteres manuelt", () => {
    expect(tilladtForAutomatik(lead({ status: "ny", historik: [] }))).toBe(false);
  });

  it("tillader leads der ikke er på salgslisten", () => {
    expect(tilladtForAutomatik(lead())).toBe(true);
  });
});
