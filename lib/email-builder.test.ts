import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/outreach/suppression", () => ({
  normaliserEmail: (e: string) => e.trim().toLowerCase(),
}));

import { buildEmailHtml, buildEmailText } from "./email-builder";

describe("email-builder signatur", () => {
  it("signerer som Sarah som standard", () => {
    expect(buildEmailHtml({ body: "Hej" })).toContain("Sarah Møller");
    expect(buildEmailText("Hej")).toContain("Sarah Møller");
  });

  it("bruger den angivne signatur", () => {
    const signatur = { navn: "Krystian Balasz", titel: "Direktør, KrydsByg ApS" };
    const html = buildEmailHtml({ body: "Hej", signatur });
    expect(html).toContain("Krystian Balasz");
    expect(html).not.toContain("Sarah Møller");
    const text = buildEmailText("Hej", signatur);
    expect(text).toContain("Direktør, KrydsByg ApS");
    expect(text).not.toContain("Sarah Møller");
  });
});
