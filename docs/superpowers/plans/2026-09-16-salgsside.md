# Salgsside + mail-kopi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Én simpel salgsside (/admin/salg) til Krystians manuelle salgsflow, og blind kopi af alle kundevendte mails til kontakt@krydsbyg.com.

**Architecture:** Én central `sendKundeMail()` som alle kundevendte mails går igennem (bcc + korrekt fejlhåndtering). Salgsdata ligger som et valgfrit `salg`-felt på den eksisterende `Lead`-type i Redis-nøglen `leads`. Al forretningslogik ligger i rene funktioner under `lib/salg/`, testet med Vitest; route-handlere og side er tynde lag ovenpå.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Upstash Redis, Resend SDK v6, Tailwind, Vitest (nyt).

**Spec:** `docs/superpowers/specs/2026-09-16-salgsside-design.md`

**Repo-rod:** `C:\Users\Bruger\OneDrive\Pulpit\KrydsByg\kryds hjemmeside\kryds-website` · **Branch:** `feat/salg`

## Afvigelser fra spec (besluttet under planlægning)

1. **Resend SDK v6 kaster ikke ved API-fejl** — den returnerer `{ data, error }`. Ingen af de 7 eksisterende send-steder tjekker `error`, så afviste mails registreres i dag som sendt. `sendKundeMail()` returnerer fejlen, og alle 7 steder håndterer den.
2. **Signatur:** `buildEmailHtml`/`buildEmailText` signerer altid "Sarah Møller". De får en valgfri `signatur`-parameter (standard uændret: Sarah), så salgsmails signeres af Krystian.
3. **Afmeldingstjek:** send-ruten tjekker også `erBlokeret()` (global afmeldingsliste fra `/afmeld`), ikke kun `emailBounced`/`emailComplained`.
4. **KommuneKredit-linjen er ikke i standardskabelonen.** Kundenavnet må kun bruges som reference med kundens tilladelse (vault-planens opgave 3). Krystian kan skrive linjen ind i preview'et.
5. **Header-rækker** ("Firma", "Virksomhed") i indsatte Excel-rækker springes over.

## Filstruktur

| Fil | Ny/ændret | Ansvar |
|---|---|---|
| `vitest.config.ts` | Ny | Testopsætning med `@/`-alias |
| `package.json` | Ændret | `test`-script + vitest devDependency |
| `lib/email/send-kunde-mail.ts` (+ `.test.ts`) | Ny | Eneste vej ud for kundevendte mails: bcc + fejl som værdi |
| `lib/email-builder.ts` (+ `.test.ts`) | Ændret | Valgfri signatur |
| `app/api/admin/leads/sarah/route.ts` | Ændret | Brug `sendKundeMail` |
| `app/api/admin/leads/followup/route.ts` | Ændret | Brug `sendKundeMail` |
| `app/api/admin/sarah/run/route.ts` | Ændret | Brug `sendKundeMail` |
| `app/api/cron/auto-outreach/route.ts` | Ændret | Brug `sendKundeMail` (3 steder) |
| `app/api/admin/tilbud/route.ts` | Ændret | Brug `sendKundeMail` |
| `lib/types.ts` | Ændret | `SalgStatus`, `SalgInfo`, `Lead.salg` |
| `lib/salg/beregn.ts` (+ `.test.ts`) | Ny | `skiftStatus`, `ringIDag`, `ugetal`, `mandagDenneUge` |
| `lib/salg/skabelon.ts` (+ `.test.ts`) | Ny | `lavMail`, `fornavnAf`, `naesteMaaned`, `KRYSTIAN_SIGNATUR` |
| `lib/salg/import.ts` (+ `.test.ts`) | Ny | `parseIndsatteRaekker`, `flettIndLeads` |
| `app/api/admin/salg/route.ts` | Ny | GET liste · POST tilføj · PATCH status/note/beløb |
| `app/api/admin/salg/send/route.ts` | Ny | Send salgsmail |
| `app/admin/(protected)/salg/page.tsx` | Ny | Siden |
| `app/admin/(protected)/layout.tsx` | Ændret | Menu: Salg ind, Leads/Sarah ud |
| `app/admin/(protected)/_mobile-nav.tsx` | Ændret | Samme i mobilmenu |

Alle kommandoer køres fra repo-roden.

---

### Task 1: Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Installér**

Run: `npm install -D vitest@3`
Expected: `added N packages`, ingen `ERR!`

- [ ] **Step 2: Opret `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Tilføj test-script i `package.json`**

I `"scripts"`, efter `"lint": "next lint"`:

```json
    "lint": "next lint",
    "test": "vitest run"
```

- [ ] **Step 4: Verificér**

Run: `npx vitest --version`
Expected: `vitest/3.x.x`

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: tilfoej vitest

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: `sendKundeMail()`

**Files:**
- Create: `lib/email/send-kunde-mail.ts`
- Test: `lib/email/send-kunde-mail.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendKundeMail, STANDARD_BCC } from "./send-kunde-mail";

const mail = {
  from: "KrydsByg <kontakt@krydsbyg.com>",
  to: "kunde@firma.dk",
  subject: "Emne",
  html: "<p>Hej</p>",
  text: "Hej",
};

describe("sendKundeMail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    delete process.env.KUNDEMAIL_BCC;
  });

  it("sætter altid blind kopi til Krystians indbakke", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    await sendKundeMail(mail);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["kunde@firma.dk"],
        bcc: [STANDARD_BCC],
        replyTo: "kontakt@krydsbyg.com",
      }),
    );
  });

  it("bruger KUNDEMAIL_BCC når den er sat", async () => {
    process.env.KUNDEMAIL_BCC = "test@krydsbyg.com";
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    await sendKundeMail(mail);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ bcc: ["test@krydsbyg.com"] }));
  });

  it("returnerer ok med id ved succes", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    expect(await sendKundeMail(mail)).toEqual({ ok: true, id: "abc" });
  });

  it("returnerer Resends fejl i stedet for at melde succes", async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: "validation_error", message: "Domain not verified" } });
    expect(await sendKundeMail(mail)).toEqual({ ok: false, error: "Domain not verified" });
  });

  it("returnerer fejl når kaldet kaster", async () => {
    sendMock.mockRejectedValue(new Error("netværk nede"));
    expect(await sendKundeMail(mail)).toEqual({ ok: false, error: "netværk nede" });
  });
});
```

- [ ] **Step 2: Kør — skal fejle**

Run: `npx vitest run lib/email/send-kunde-mail.test.ts`
Expected: FAIL — `Failed to resolve import "./send-kunde-mail"`

- [ ] **Step 3: Implementér**

```ts
import { Resend } from "resend";

export const STANDARD_BCC = "kontakt+sendt@krydsbyg.com";

export interface KundeMail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  replyTo?: string;
}

export type SendResultat = { ok: true; id: string } | { ok: false; error: string };

/**
 * Eneste vej ud for kundevendte mails (outreach, opfølgning, tilbud).
 * Tilføjer altid blind kopi til Krystians indbakke. Plus-adressen bruges fordi
 * Gmail kan skjule en kopi sendt fra og til samme adresse.
 * Resend SDK v6 kaster ikke ved API-fejl — fejlen returneres her som værdi.
 */
export async function sendKundeMail(mail: KundeMail): Promise<SendResultat> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: mail.from,
      to: [mail.to],
      bcc: [process.env.KUNDEMAIL_BCC || STANDARD_BCC],
      replyTo: mail.replyTo ?? "kontakt@krydsbyg.com",
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: mail.headers,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
```

- [ ] **Step 4: Kør — skal bestå**

Run: `npx vitest run lib/email/send-kunde-mail.test.ts`
Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/email/send-kunde-mail.ts lib/email/send-kunde-mail.test.ts
git commit -m "feat(email): sendKundeMail med bcc til kontakt+sendt@ og fejl som vaerdi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Valgfri signatur i email-builder

**Files:**
- Modify: `lib/email-builder.ts`
- Test: `lib/email-builder.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
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
```

- [ ] **Step 2: Kør — skal fejle**

Run: `npx vitest run lib/email-builder.test.ts`
Expected: FAIL — test 2 finder "Sarah Møller" i output

- [ ] **Step 3: Implementér** — fire ændringer i `lib/email-builder.ts`

Erstat `interface EmailParts { ... }` med:

```ts
export interface Signatur {
  navn: string;
  titel: string;
}

const SARAH: Signatur = { navn: "Sarah Møller", titel: "Assistent, KrydsByg" };

interface EmailParts {
  body: string;       // Plain text body fra Sarah (med \n linjeskift)
  preheader?: string; // Skjult preview-tekst i indbakken (under emnefelt)
  recipientEmail?: string; // Saettes paa cold/opfoelgning: personligt afmeld-link i footer
  signatur?: Signatur; // Standard: Sarah Møller
}
```

Erstat funktionssignaturen:

```ts
export function buildEmailHtml({ body, preheader, recipientEmail }: EmailParts): string {
```

med:

```ts
export function buildEmailHtml({ body, preheader, recipientEmail, signatur = SARAH }: EmailParts): string {
```

Erstat de to signaturlinjer i HTML'en:

```html
                  <p style="margin:0 0 2px 0;font-size:15px;font-weight:bold;color:${KRYDSBYG_BLACK};letter-spacing:.02em">Sarah Møller</p>
                  <p style="margin:0 0 12px 0;font-size:13px;color:${KRYDSBYG_GRAY}">Assistent, KrydsByg</p>
```

med:

```html
                  <p style="margin:0 0 2px 0;font-size:15px;font-weight:bold;color:${KRYDSBYG_BLACK};letter-spacing:.02em">${escapeHtml(signatur.navn)}</p>
                  <p style="margin:0 0 12px 0;font-size:13px;color:${KRYDSBYG_GRAY}">${escapeHtml(signatur.titel)}</p>
```

Erstat `buildEmailText`:

```ts
export function buildEmailText(body: string, signatur: Signatur = SARAH): string {
  return `${body.trim()}

---
${signatur.navn}
${signatur.titel}
Telefon: +45 42 77 88 66
Email: kontakt@krydsbyg.com
Web: krydsbyg.com

Ønsker du ikke at høre mere fra os, svar blot med "afmeld".`;
}
```

- [ ] **Step 4: Kør — skal bestå**

Run: `npx vitest run lib/email-builder.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/email-builder.ts lib/email-builder.test.ts
git commit -m "feat(email): valgfri signatur i email-builder (standard uaendret: Sarah)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Omlæg de 7 kundevendte send-steder

**Files:**
- Modify: `app/api/admin/leads/sarah/route.ts`
- Modify: `app/api/admin/leads/followup/route.ts`
- Modify: `app/api/admin/sarah/run/route.ts`
- Modify: `app/api/cron/auto-outreach/route.ts`
- Modify: `app/api/admin/tilbud/route.ts`

Ingen nye tests: adfærden er testet i Task 2. Verificeres med typecheck, grep og den fulde testsuite.

- [ ] **Step 1: `leads/sarah/route.ts`**

Erstat `import { Resend } from "resend";` med:

```ts
import { sendKundeMail } from "@/lib/email/send-kunde-mail";
```

Slet linjen `    const resend = new Resend(process.env.RESEND_API_KEY);`

Erstat hele `try { await resend.emails.send({...}) } catch (err) {...}`-blokken med:

```ts
    const sendt = await sendKundeMail({
      from,
      to: lead.email,
      subject: lead.draftSubject,
      html,
      text: textVersion,
      headers: {
        // List-Unsubscribe: Gmail og Outlook stoler mere på afsendere der har dette
        ...buildUnsubHeaders(lead.email),
        // X-Mailer signatur (undgå generiske "sent via" headers der trigger spam)
        "X-Mailer": "KrydsByg Outreach",
      },
    });
    if (!sendt.ok) {
      return NextResponse.json({ error: `Email-afsendelse fejlede: ${sendt.error}` }, { status: 500 });
    }
```

- [ ] **Step 2: `leads/followup/route.ts`**

Erstat `import { Resend } from "resend";` med:

```ts
import { sendKundeMail } from "@/lib/email/send-kunde-mail";
```

Slet linjen `    const resend = new Resend(process.env.RESEND_API_KEY);`

Erstat `await resend.emails.send({ ... });` (linje ~184-195) med:

```ts
    const sendt = await sendKundeMail({
      from,
      to: lead.email,
      subject: draft.subject,
      html: buildEmailHtml({ body: draft.body, preheader: draft.subject }),
      text: buildEmailText(draft.body),
      headers: {
        ...buildUnsubHeaders(lead.email),
        "X-Mailer": "KrydsByg Outreach",
      },
    });
    if (!sendt.ok) {
      return NextResponse.json(
        { ok: false, error: `Email-afsendelse fejlede: ${sendt.error}` },
        { status: 502 }
      );
    }
```

- [ ] **Step 3: `sarah/run/route.ts`**

Erstat `import { Resend } from "resend";` med:

```ts
import { sendKundeMail } from "@/lib/email/send-kunde-mail";
```

Slet linjen `const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");`

Erstat hele funktionen `sendEmail` med:

```ts
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const unsubUrl = `${SITE_URL}/afmeld?e=${encodeURIComponent(to)}`;
  const sendt = await sendKundeMail({
    from: FROM,
    to,
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<mailto:kontakt@krydsbyg.com?subject=afmeld>, <${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (!sendt.ok) console.error("Resend fejl:", sendt.error);
  return sendt.ok;
}
```

- [ ] **Step 4: `cron/auto-outreach/route.ts`** — tre steder

Erstat `import { Resend } from "resend";` med:

```ts
import { sendKundeMail } from "@/lib/email/send-kunde-mail";
```

**Sted 1 (cold, linje ~312-329):** slet `      const resend = new Resend(process.env.RESEND_API_KEY);` og erstat `await resend.emails.send({ ... "X-Mailer": "KrydsByg Outreach", }, });` med:

```ts
      const sendt = await sendKundeMail({
        from,
        to: lead.email,
        subject: draft.subject,
        html,
        text: textVersion,
        headers: {
          ...buildUnsubHeaders(lead.email),
          "X-Mailer": "KrydsByg Outreach",
        },
      });
      if (!sendt.ok) throw new Error(`Resend: ${sendt.error}`);
```

Kastet fanges af løkkens eksisterende `catch`, som tæller `stats.errors++`. Før talte en afvist mail som sendt.

**Sted 2+3 (opfølgning trin 1 og 2):** slet `  const resend = new Resend(process.env.RESEND_API_KEY);` (linje ~511). Blokken er identisk i trin 1 og trin 2 — erstat **begge forekomster** af:

```ts
      await resend.emails.send({
        from,
        to: [lead.email!],
        replyTo: "kontakt@krydsbyg.com",
        subject: draft.subject,
        html,
        text: buildEmailText(draft.body),
        headers: buildUnsubHeaders(lead.email!),
      });
```

med:

```ts
      const sendt = await sendKundeMail({
        from,
        to: lead.email!,
        subject: draft.subject,
        html,
        text: buildEmailText(draft.body),
        headers: buildUnsubHeaders(lead.email!),
      });
      if (!sendt.ok) throw new Error(`Resend: ${sendt.error}`);
```

- [ ] **Step 5: `tilbud/route.ts`**

Erstat `import { Resend } from "resend";` med:

```ts
import { sendKundeMail } from "@/lib/email/send-kunde-mail";
```

Slet linjen `const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");`

Erstat:

```ts
    await resend.emails.send({
      from: FROM,
      to: [t.clientEmail],
```

med:

```ts
    const sendt = await sendKundeMail({
      from: FROM,
      to: t.clientEmail,
```

og indsæt direkte efter kaldets afsluttende `      text: body,\n    });`:

```ts
    if (!sendt.ok) {
      return NextResponse.json({ error: `Tilbuddet blev ikke sendt: ${sendt.error}` }, { status: 502 });
    }
```

- [ ] **Step 6: Verificér at ingen kundevendt `emails.send` er tilbage**

Run: `grep -rn "emails.send\|new Resend" app/api/admin/leads/sarah app/api/admin/leads/followup app/api/admin/sarah/run app/api/cron/auto-outreach app/api/admin/tilbud`
Expected: ingen output

- [ ] **Step 7: Typecheck + tests**

Run: `npx tsc --noEmit && npm test`
Expected: tsc uden output · `7 passed`

- [ ] **Step 8: Commit**

```bash
git add app/api/admin/leads/sarah/route.ts app/api/admin/leads/followup/route.ts app/api/admin/sarah/run/route.ts app/api/cron/auto-outreach/route.ts app/api/admin/tilbud/route.ts
git commit -m "fix(email): alle kundevendte mails via sendKundeMail

Kopi til kontakt+sendt@krydsbyg.com paa outreach, opfoelgning og tilbud.
Resend SDK v6 kaster ikke ved API-fejl; afviste mails blev foer talt
som sendt. Nu returneres fejlen og haandteres paa alle 7 steder.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Salg-typer

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Tilføj typer** direkte efter linjen `export type LeadType = "company" | "private" | "employee";`:

```ts

export type SalgStatus = "ny" | "mail_sendt" | "ringet" | "samtale" | "tilbud" | "vundet" | "tabt";

export interface SalgInfo {
  status: SalgStatus;
  historik: { status: SalgStatus; at: string }[];
  beloeb?: number; // kr. ekskl. moms, sættes ved "vundet"
  note?: string;
}
```

- [ ] **Step 2: Tilføj feltet på `Lead`** — erstat `  sourceFile?: string;` i `interface Lead` med:

```ts
  sourceFile?: string;
  salg?: SalgInfo;            // Salgssiden (/admin/salg) — adskilt fra status, som LeadBot bruger
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: ingen output

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat(salg): SalgStatus og SalgInfo paa Lead

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: `lib/salg/beregn.ts`

**Files:**
- Create: `lib/salg/beregn.ts`
- Test: `lib/salg/beregn.test.ts`

- [ ] **Step 1: Skriv de fejlende tests**

```ts
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
```

- [ ] **Step 2: Kør — skal fejle**

Run: `npx vitest run lib/salg/beregn.test.ts`
Expected: FAIL — `Failed to resolve import "./beregn"`

- [ ] **Step 3: Implementér**

```ts
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
```

- [ ] **Step 4: Kør — skal bestå**

Run: `npx vitest run lib/salg/beregn.test.ts`
Expected: `11 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/salg/beregn.ts lib/salg/beregn.test.ts
git commit -m "feat(salg): statusskift, ring-i-dag og ugetal som rene funktioner

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: `lib/salg/skabelon.ts`

**Files:**
- Create: `lib/salg/skabelon.ts`
- Test: `lib/salg/skabelon.test.ts`

- [ ] **Step 1: Skriv de fejlende tests**

```ts
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
```

- [ ] **Step 2: Kør — skal fejle**

Run: `npx vitest run lib/salg/skabelon.test.ts`
Expected: FAIL — `Failed to resolve import "./skabelon"`

- [ ] **Step 3: Implementér**

```ts
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
```

- [ ] **Step 4: Kør — skal bestå**

Run: `npx vitest run lib/salg/skabelon.test.ts`
Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/salg/skabelon.ts lib/salg/skabelon.test.ts
git commit -m "feat(salg): fast salgsmail-skabelon med Krystians signatur

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: `lib/salg/import.ts`

**Files:**
- Create: `lib/salg/import.ts`
- Test: `lib/salg/import.test.ts`

- [ ] **Step 1: Skriv de fejlende tests**

```ts
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
```

- [ ] **Step 2: Kør — skal fejle**

Run: `npx vitest run lib/salg/import.test.ts`
Expected: FAIL — `Failed to resolve import "./import"`

- [ ] **Step 3: Implementér**

```ts
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
```

- [ ] **Step 4: Kør — skal bestå**

Run: `npx vitest run lib/salg/import.test.ts`
Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/salg/import.ts lib/salg/import.test.ts
git commit -m "feat(salg): import af kontakter fra formular og Excel-rækker

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: API `/api/admin/salg`

**Files:**
- Create: `app/api/admin/salg/route.ts`

- [ ] **Step 1: Implementér**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: ingen output

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/salg/route.ts
git commit -m "feat(salg): API til liste, tilfoej og statusskift

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: API `/api/admin/salg/send`

**Files:**
- Create: `app/api/admin/salg/send/route.ts`

- [ ] **Step 1: Implementér**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readLeads, writeLeads } from "@/lib/db";
import { buildEmailHtml, buildEmailText, buildUnsubHeaders } from "@/lib/email-builder";
import { sendKundeMail } from "@/lib/email/send-kunde-mail";
import { erBlokeret } from "@/lib/outreach/suppression";
import { skiftStatus } from "@/lib/salg/beregn";
import { KRYSTIAN_SIGNATUR } from "@/lib/salg/skabelon";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, subject, body } = (await req.json()) as { id?: string; subject?: string; body?: string };
  if (typeof subject !== "string" || typeof body !== "string" || !subject.trim() || !body.trim()) {
    return NextResponse.json({ error: "Emne og tekst skal udfyldes" }, { status: 400 });
  }

  const leads = await readLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead?.salg) return NextResponse.json({ error: "Kontakt ikke fundet" }, { status: 404 });
  if (!lead.email) {
    return NextResponse.json({ error: "Kontakten har ingen e-mail — ring i stedet" }, { status: 400 });
  }
  if (lead.emailBounced || lead.emailComplained || (await erBlokeret(lead.email))) {
    return NextResponse.json({ error: "Adressen er afmeldt eller har bouncet — der sendes ikke" }, { status: 400 });
  }

  const emne = subject.trim();
  const sendt = await sendKundeMail({
    from: process.env.RESEND_FROM_COLD ?? "KrydsByg <kontakt@krydsbyg.com>",
    to: lead.email,
    subject: emne,
    html: buildEmailHtml({ body, preheader: emne, recipientEmail: lead.email, signatur: KRYSTIAN_SIGNATUR }),
    text: buildEmailText(body, KRYSTIAN_SIGNATUR),
    headers: { ...buildUnsubHeaders(lead.email), "X-Mailer": "KrydsByg Salg" },
  });
  if (!sendt.ok) {
    return NextResponse.json({ error: `Mailen blev ikke sendt: ${sendt.error}` }, { status: 502 });
  }

  const nu = new Date();
  const opdateret: Lead = {
    ...lead,
    salg: skiftStatus(lead.salg, "mail_sendt", nu),
    sentAt: nu.toISOString(),
    updatedAt: nu.toISOString(),
  };
  await writeLeads(leads.map((l) => (l.id === id ? opdateret : l)));
  return NextResponse.json({ lead: opdateret });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: ingen output

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/salg/send/route.ts
git commit -m "feat(salg): send salgsmail med afmeldingstjek og Krystians signatur

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Siden `/admin/salg`

**Files:**
- Create: `app/admin/(protected)/salg/page.tsx`

- [ ] **Step 1: Implementér**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lead, SalgStatus } from "@/lib/types";
import { mandagDenneUge, ringIDag, ugetal } from "@/lib/salg/beregn";
import { fornavnAf, lavMail } from "@/lib/salg/skabelon";
import { parseIndsatteRaekker, type SalgRaekke } from "@/lib/salg/import";

const STATUS_TEKST: Record<SalgStatus, string> = {
  ny: "Ny",
  mail_sendt: "Mail sendt",
  ringet: "Ringet",
  samtale: "Samtale",
  tilbud: "Tilbud",
  vundet: "Vundet",
  tabt: "Tabt",
};
const STATUS_FARVE: Record<SalgStatus, string> = {
  ny: "bg-white/10 text-cream/70",
  mail_sendt: "bg-blue-500/20 text-blue-300",
  ringet: "bg-purple-500/20 text-purple-300",
  samtale: "bg-[rgba(245,196,0,.15)] text-yellow",
  tilbud: "bg-orange-500/20 text-orange-300",
  vundet: "bg-green-500/20 text-green-300",
  tabt: "bg-red-500/20 text-red-300",
};
const STATUSSER = Object.keys(STATUS_TEKST) as SalgStatus[];
const TOM_FORM: SalgRaekke = { firma: "", kontaktnavn: "", email: "", telefon: "" };
const JSON_HEADERS = { "Content-Type": "application/json" };

const kort = "bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]";
const knap = "font-condensed font-semibold text-[11px] tracking-[.12em] uppercase px-3 py-2 rounded-[2px] transition-colors disabled:opacity-40";
const gulKnap = `${knap} bg-yellow text-black hover:opacity-90`;
const stilleKnap = `${knap} border border-[rgba(242,238,230,.15)] text-muted hover:text-cream`;
const felt = "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow";
const overskrift = "font-condensed font-black text-[18px] uppercase text-cream";

type Preview = { lead: Lead; subject: string; body: string };

export default function SalgPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [indlaeser, setIndlaeser] = useState(true);
  const [fejl, setFejl] = useState<string | null>(null);
  const [besked, setBesked] = useState<string | null>(null);
  const [filter, setFilter] = useState<SalgStatus | "alle">("alle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [arbejder, setArbejder] = useState(false);
  const [form, setForm] = useState<SalgRaekke>(TOM_FORM);
  const [indsat, setIndsat] = useState("");

  const kald = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (res.status === 401) {
      setFejl("Din session er udløbet. Du sendes til login.");
      setTimeout(() => { window.location.href = "/admin/login"; }, 2000);
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      setFejl(data.error ?? "Ukendt fejl");
      return null;
    }
    return data;
  }, []);

  const hent = useCallback(async () => {
    const data = await kald("/api/admin/salg");
    if (data) setLeads(data.leads);
    setIndlaeser(false);
  }, [kald]);

  useEffect(() => { hent(); }, [hent]);

  const erstat = (opdateret: Lead) =>
    setLeads((alle) => alle.map((l) => (l.id === opdateret.id ? opdateret : l)));

  const patch = async (payload: Record<string, unknown>) => {
    setFejl(null);
    const data = await kald("/api/admin/salg", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(payload) });
    if (data) erstat(data.lead);
  };

  const vaelgStatus = (lead: Lead, status: SalgStatus) => {
    if (status !== "vundet") return patch({ id: lead.id, status });
    const svar = window.prompt("Beløb ekskl. moms (kr.)", String(lead.salg?.beloeb ?? 6000));
    if (svar === null) return;
    const beloeb = Number(svar.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(beloeb) || beloeb < 0) {
      setFejl("Ugyldigt beløb");
      return;
    }
    return patch({ id: lead.id, status, beloeb });
  };

  const gemNote = (lead: Lead, note: string) => {
    if (note !== (lead.salg?.note ?? "")) patch({ id: lead.id, note });
  };

  const tilfoej = async (rows: SalgRaekke[]) => {
    setFejl(null);
    setBesked(null);
    setArbejder(true);
    const data = await kald("/api/admin/salg", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ rows }) });
    setArbejder(false);
    if (!data) return false;
    const sprunget = data.sprunget.length ? ` · sprunget over: ${data.sprunget.join(", ")}` : "";
    setBesked(`${data.tilfoejet} tilføjet${sprunget}`);
    await hent();
    return true;
  };

  const aabnPreview = (lead: Lead) => {
    const mail = lavMail({ fornavn: fornavnAf(lead.contactName), firma: lead.companyName }, new Date());
    setPreview({ lead, ...mail });
  };

  const send = async () => {
    if (!preview) return;
    setFejl(null);
    setArbejder(true);
    const data = await kald("/api/admin/salg/send", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ id: preview.lead.id, subject: preview.subject, body: preview.body }),
    });
    setArbejder(false);
    if (!data) return;
    erstat(data.lead);
    setBesked(`Mail sendt til ${preview.lead.companyName} — kopi ligger i din indbakke`);
    setPreview(null);
  };

  const tal = useMemo(() => ugetal(leads, mandagDenneUge(new Date())), [leads]);
  const ringListe = useMemo(() => ringIDag(leads, new Date()), [leads]);
  const viste = useMemo(
    () =>
      leads
        .filter((l) => filter === "alle" || l.salg?.status === filter)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [leads, filter],
  );
  const tal4: [string, string | number][] = [
    ["Samtaler", tal.samtaler],
    ["Tilbud sendt", tal.tilbud],
    ["Opgaver solgt", tal.solgt],
    ["Faktureret", `${tal.faktureret.toLocaleString("da-DK")} kr`],
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-yellow mb-2">Salg</p>
        <h1 className="font-condensed font-black text-[40px] uppercase tracking-[-.01em] text-cream leading-none">Salgsliste</h1>
        <p className="text-muted text-[14px] mt-2">Tilføj → send mail → ring → samtale → tilbud → vundet.</p>
      </div>

      {fejl && <p className={`${kort} p-3 text-[13px] text-red-400`}>{fejl}</p>}
      {besked && <p className={`${kort} p-3 text-[13px] text-green-300`}>{besked}</p>}

      <section className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2">
        {tal4.map(([label, vaerdi]) => (
          <div key={label} className={`${kort} p-4`}>
            <p className="text-[11px] uppercase tracking-[.15em] text-muted">{label} · denne uge</p>
            <p className="font-condensed font-black text-[32px] text-cream leading-none mt-2">{vaerdi}</p>
          </div>
        ))}
      </section>

      <section className={`${kort} p-4`}>
        <h2 className="font-condensed font-black text-[20px] uppercase text-yellow">Ring i dag ({ringListe.length})</h2>
        {ringListe.length === 0 ? (
          <p className="text-[13px] text-muted mt-2">Ingen at ringe til lige nu.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[rgba(242,238,230,0.07)]">
            {ringListe.map((lead) => (
              <li key={lead.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-cream text-[14px] font-medium">{lead.companyName}</p>
                  <p className="text-muted text-[12px]">
                    {lead.contactName ?? "Ukendt kontakt"} · {lead.salg ? STATUS_TEKST[lead.salg.status] : ""}
                  </p>
                </div>
                {lead.phone ? (
                  <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className={gulKnap}>Ring {lead.phone}</a>
                ) : (
                  <span className="text-[12px] text-muted">Intet telefonnummer</span>
                )}
                <button className={stilleKnap} onClick={() => vaelgStatus(lead, "ringet")}>Ingen svar</button>
                <button className={stilleKnap} onClick={() => vaelgStatus(lead, "samtale")}>Samtale</button>
                <button className={stilleKnap} onClick={() => vaelgStatus(lead, "tabt")}>Tabt</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${kort} p-4 grid grid-cols-2 gap-6 max-[900px]:grid-cols-1`}>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await tilfoej([form])) setForm(TOM_FORM);
          }}
        >
          <h2 className={overskrift}>Tilføj kontakt</h2>
          <input className={felt} placeholder="Firma *" required value={form.firma} onChange={(e) => setForm({ ...form, firma: e.target.value })} />
          <input className={felt} placeholder="Kontaktperson" value={form.kontaktnavn ?? ""} onChange={(e) => setForm({ ...form, kontaktnavn: e.target.value })} />
          <input className={felt} placeholder="E-mail" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={felt} placeholder="Telefon" type="tel" value={form.telefon ?? ""} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
          <button type="submit" className={gulKnap} disabled={arbejder}>Tilføj</button>
        </form>
        <div className="space-y-2">
          <h2 className={overskrift}>Indsæt fra Excel</h2>
          <p className="text-[12px] text-muted">Kopiér rækker med kolonnerne Firma · Kontaktperson · E-mail · Telefon og indsæt her.</p>
          <textarea className={felt} rows={6} value={indsat} onChange={(e) => setIndsat(e.target.value)} />
          <button
            className={gulKnap}
            disabled={arbejder || !indsat.trim()}
            onClick={async () => {
              if (await tilfoej(parseIndsatteRaekker(indsat))) setIndsat("");
            }}
          >
            Tilføj rækker
          </button>
        </div>
      </section>

      <section className={`${kort} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={overskrift}>Alle kontakter ({viste.length})</h2>
          <select className={`${felt} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as SalgStatus | "alle")}>
            <option value="alle">Alle</option>
            {STATUSSER.map((s) => <option key={s} value={s}>{STATUS_TEKST[s]}</option>)}
          </select>
        </div>
        {indlaeser ? (
          <p className="text-[13px] text-muted mt-3">Indlæser…</p>
        ) : viste.length === 0 ? (
          <p className="text-[13px] text-muted mt-3">Ingen kontakter endnu. Tilføj den første ovenfor.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[rgba(242,238,230,0.07)]">
            {viste.map((lead) => (
              <li key={lead.id} className="py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-cream text-[14px] font-medium">{lead.companyName}</p>
                    <p className="text-muted text-[12px]">
                      {[lead.contactName, lead.email || "ingen e-mail", lead.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {lead.salg && (
                    <span className={`text-[11px] px-2 py-1 rounded-[2px] ${STATUS_FARVE[lead.salg.status]}`}>
                      {STATUS_TEKST[lead.salg.status]}
                      {lead.salg.status === "vundet" && lead.salg.beloeb ? ` · ${lead.salg.beloeb.toLocaleString("da-DK")} kr` : ""}
                    </span>
                  )}
                  <button className={gulKnap} disabled={!lead.email} onClick={() => aabnPreview(lead)}>Send mail</button>
                  <select
                    className={`${felt} w-auto`}
                    value={lead.salg?.status}
                    onChange={(e) => vaelgStatus(lead, e.target.value as SalgStatus)}
                  >
                    {STATUSSER.map((s) => <option key={s} value={s}>{STATUS_TEKST[s]}</option>)}
                  </select>
                </div>
                <input
                  className={felt}
                  placeholder="Note"
                  defaultValue={lead.salg?.note ?? ""}
                  onBlur={(e) => gemNote(lead, e.target.value)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className={`${kort} bg-black2 w-full max-w-[640px] p-5 space-y-3`}>
            <p className="font-condensed font-black text-[20px] uppercase text-cream">Mail til {preview.lead.companyName}</p>
            <p className="text-[12px] text-muted">Til: {preview.lead.email} · kopi til din indbakke</p>
            <input className={felt} value={preview.subject} onChange={(e) => setPreview({ ...preview, subject: e.target.value })} />
            <textarea className={felt} rows={12} value={preview.body} onChange={(e) => setPreview({ ...preview, body: e.target.value })} />
            <p className="text-[11px] text-muted">Signatur (Krystian Balasz) og afmeldingslink tilføjes automatisk.</p>
            <div className="flex gap-2 justify-end">
              <button className={stilleKnap} onClick={() => setPreview(null)} disabled={arbejder}>Annullér</button>
              <button className={gulKnap} onClick={send} disabled={arbejder}>{arbejder ? "Sender…" : "Send"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: tsc uden output · lint `✔ No ESLint warnings or errors` (eller kun advarsler, der fandtes før)

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/salg/page.tsx"
git commit -m "feat(salg): salgsside med ugetal, ring-liste, tilfoej og mail-preview

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Menu

**Files:**
- Modify: `app/admin/(protected)/layout.tsx`
- Modify: `app/admin/(protected)/_mobile-nav.tsx`

- [ ] **Step 1: Desktopmenu** i `layout.tsx` — erstat:

```tsx
              { href: "/admin", label: "Dashboard" },
```

med:

```tsx
              { href: "/admin", label: "Dashboard" },
              { href: "/admin/salg", label: "Salg ◆" },
```

og slet disse to linjer:

```tsx
              { href: "/admin/sarah", label: "Sarah ✦" },
              { href: "/admin/leads", label: "Leads ◆" },
```

- [ ] **Step 2: Mobilmenu** i `_mobile-nav.tsx` — erstat:

```tsx
  { href: "/admin/leads",        label: "Leads",        icon: "◆" },
  { href: "/admin/sarah",        label: "Sarah",        icon: "✦" },
```

med:

```tsx
  { href: "/admin/salg",         label: "Salg",         icon: "◆" },
```

- [ ] **Step 3: Verificér**

Run: `grep -n "admin/salg\|admin/leads\|admin/sarah" "app/admin/(protected)/layout.tsx" "app/admin/(protected)/_mobile-nav.tsx"`
Expected: præcis to linjer, begge med `/admin/salg`

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/layout.tsx" "app/admin/(protected)/_mobile-nav.tsx"
git commit -m "feat(salg): Salg i menuen, Leads og Sarah skjult (ruterne bestaar)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: Fuld verifikation og preview

- [ ] **Step 1: Hele testsuiten**

Run: `npm test`
Expected: `31 passed` (5 + 2 + 11 + 7 + 6)

- [ ] **Step 2: Typecheck, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: build ender med `✓ Compiled successfully` og route-listen indeholder `/admin/salg` og `/api/admin/salg/send`

- [ ] **Step 3: Push branch** (giver Vercel-preview; `main` røres ikke)

```bash
git push -u origin feat/salg
```

- [ ] **Step 4: Manuel test på preview-URL** (Vercel → projektet `krydsbyg.com` → Deployments → `feat/salg`)

Mangler preview-miljøet env-vars (login eller Redis fejler), testes i stedet efter merge med én testkontakt.
**NB:** preview og lokal udvikling skriver til samme Upstash-database som produktion, hvis de deler nøgler.

1. Log ind → menuen viser "Salg", ikke "Leads"/"Sarah"
2. Tilføj testkontakt: firma "TEST KrydsByg", e-mail = en privat adresse du selv læser
3. Send mail → preview viser "Hej," og "Har I en opgave i oktober" → ret én linje → Send
4. Privat indbakke: mailen er signeret "Krystian Balasz" og har afmeldingslink
5. kontakt@krydsbyg.com: kopien ligger der (tjek også "Alle mails", hvis ikke i indbakken)
6. Skift status → Samtale → ugetallet "Samtaler" bliver 1
7. Skift status → Vundet → beløbsprompt → "Faktureret" viser beløbet
8. Marker testkontakten "Tabt"

- [ ] **Step 5: Gmail-filter** (Krystian, én gang)

Gmail → søg `to:kontakt+sendt@krydsbyg.com` → "Opret filter" → "Anvend etiketten: Sendt fra systemet".

- [ ] **Step 6: Merge til `main` kun efter Krystians ja**
