# Salgsside + mail-kopi — design

**Dato:** 2026-09-16 · **Status:** godkendt af Krystian · **Branch:** `feat/salg`
**Forretningsgrundlag:** vault `Strategi/Plan 90 dage - Efteraar 2026.md`

## Problem

1. Leadsystemet er to systemer oven i hinanden: `SarahContact` (Sarah-siden, 1.053 linjer) og
   `Lead` (leads-siden, 1.576 linjer). Det er langsomt og uoverskueligt at bruge.
2. Outreach-mails sendes fra 7 steder med hver sin kopi af afsendelseskoden. Svar lander i
   kontakt@krydsbyg.com (via `replyTo`), men de **udsendte** mails ses aldrig i indbakken.
3. Salgsplanen er manuel og lille (5-10 håndplukkede kontakter/uge, mail + telefon). Systemet
   er bygget til 60 automatiske leads/dag.

## Mål

- Én side, **/admin/salg**, der understøtter planens flow: tilføj → send → ring → samtale →
  tilbud → vundet/tabt, med de fire ugetal øverst.
- Blind kopi af alle kundevendte mails til Krystians indbakke.

## Ikke-mål

- AI-personalisering af mails (fast skabelon, rettes manuelt før send)
- Automatiske opfølgningsmails (erstattes af ring-listen)
- Sletning af LeadBot-, Sarah- eller leads-koden (skjules kun fra menuen)
- Migrering af `SarahContact`-data

## Del 1 — Mail-kopi

**`lib/email/send-kunde-mail.ts`** eksporterer `sendKundeMail(input)`. Den kalder
`resend.emails.send` med præcis de felter kalderen giver, og tilføjer altid
`bcc: [process.env.KUNDEMAIL_BCC ?? "kontakt+sendt@krydsbyg.com"]`. Returnerer
`{ ok: true, id } | { ok: false, error }` — kaster ikke.

Plus-adressen bruges, fordi kontakt@krydsbyg.com ligger på Google Workspace (MX =
aspmx.l.google.com), og Gmail kan skjule en kopi, der er sendt fra og til samme adresse.
Plus-adresser leveres til samme indbakke og kan filtreres.

**Omlægges til `sendKundeMail()` (kundevendte mails):**

| Fil | Mail |
|---|---|
| `app/api/admin/leads/sarah/route.ts` | Outreach dag 0 |
| `app/api/admin/leads/followup/route.ts` | Opfølgning |
| `app/api/admin/sarah/run/route.ts` | Sarah-kontakter |
| `app/api/cron/auto-outreach/route.ts` (3 steder) | Automatisk outreach + opfølgninger |
| `app/api/admin/tilbud/route.ts` | Tilbud til kunde |

**Uden for scope:** onboarding, vagter, kodeord, e-mailverifikation, broadcast,
kontaktformular, help-request, SMS-relæ, admin-debug.

**Manuelt trin (Krystian):** Gmail-filter `to:kontakt+sendt@krydsbyg.com` → label
"Sendt fra systemet".

## Del 2 — Data

Genbruger `Lead` og Redis-nøglen `leads` (`readLeads`/`writeLeads`). Nyt valgfrit felt:

```ts
export type SalgStatus = "ny" | "mail_sendt" | "ringet" | "samtale" | "tilbud" | "vundet" | "tabt";

export interface SalgInfo {
  status: SalgStatus;
  historik: { status: SalgStatus; at: string }[];
  beloeb?: number;   // kr. ekskl. moms, sættes ved "vundet"
  note?: string;
}

// på Lead:
salg?: SalgInfo;
```

Separat fra `Lead.status`, fordi LeadBot og `auto-outreach` bruger `status` til egen logik.
Salgssiden viser kun leads med `salg` sat.

Kendt begrænsning: `leads` gemmes som ét array (læs-ændr-skriv). To samtidige skrivninger kan
overskrive hinanden. Acceptabelt ved én bruger; ikke ændret her.

## Del 3 — Regler (rene funktioner i `lib/salg/beregn.ts`)

- **`skiftStatus(salg, ny, nu)`** → ny `SalgInfo` med status sat og `{status, at}` tilføjet
  historikken. Muterer ikke input.
- **`ringIDag(leads, nu)`** → leads med `salg.status === "mail_sendt"`, hvor seneste
  `mail_sendt` i historikken er ≥ 2 døgn gammel, **plus** leads med `salg.status === "ny"`
  uden e-mail. Sorteret ældste først.
- **`ugetal(leads, ugeStart)`** → for historik-indgange i [ugeStart, ugeStart+7 døgn):
  `samtaler` = antal overgange til `samtale`; `tilbud` = overgange til `tilbud`;
  `solgt` = overgange til `vundet`; `faktureret` = sum af `beloeb` for leads med overgang til
  `vundet` i ugen. Ugen starter mandag 00:00 dansk tid.

## Del 4 — Skabelon (`lib/salg/skabelon.ts`)

`lavMail({ fornavn, firma })` → `{ subject, body }`.

- Emne: `Ekstra hænder til {firma}`
- Brødtekst: planens mail (flytning, montering, oprydning, indvendigt vedligehold; 1-2 mand;
  3.000 kr pr. mand pr. dag ekskl. moms; reference til KommuneKredit; CTA "Har I en opgave i
  {måned}, vi kan tage?"; signatur med telefon).
- Mangler fornavn → "Hej,". `{måned}` = næste måned på dansk.

## Del 5 — API

Alle ruter kræver `getAdminSession()` → 401 ellers.

- **`GET /api/admin/salg`** → `{ leads: Lead[] }` (kun med `salg`)
- **`POST /api/admin/salg`** body `{ rows: { firma, kontaktnavn?, email?, telefon? }[] }` →
  opretter `Lead` med `salg = { status: "ny", historik: [{ny, nu}] }`. Findes e-mailen
  (case-insensitive) allerede blandt leads: har den `salg` → springes over; har den ikke →
  `salg` sættes på det eksisterende lead. Svar `{ tilfoejet, sprunget: string[] }`.
  Række uden firma → sprunget over.
- **`PATCH /api/admin/salg`** body `{ id, status?, note?, beloeb? }` → `skiftStatus` + gem.
- **`POST /api/admin/salg/send`** body `{ id, subject, body }` → afvis hvis ingen e-mail,
  `emailBounced` eller `emailComplained` (400 m. dansk besked). Ellers `sendKundeMail` med
  `buildEmailHtml`/`buildEmailText`/`buildUnsubHeaders`. Kun ved `ok` → status `mail_sendt`,
  `sentAt` sat. Ved fejl → 502, status uændret.

## Del 6 — Side (`app/admin/(protected)/salg/page.tsx`)

1. **Fire ugetal** (denne uge)
2. **Ring i dag** — firma, navn, `tel:`-link, knapper: *Ingen svar* (→ ringet), *Samtale*,
   *Tabt*
3. **Tilføj** — formular (firma, navn, e-mail, telefon) + tekstfelt til rækker indsat fra
   Excel (tab-separeret: firma, navn, e-mail, telefon)
4. **Liste** — alle salgs-leads, statusfilter, pr. række: *Send mail* (åbner preview med
   redigerbart emne/brødtekst), statusvælger, note, beløb ved vundet

401 fra et kald → "Session udløbet", redirect til `/admin/login`.

**Menu:** "Salg" tilføjes i `(protected)/layout.tsx` og `_mobile-nav.tsx`. "Leads" og "Sarah"
fjernes fra begge menuer; ruterne består.

## Del 7 — Tests

Vitest (nyt). Unit-tests for `skiftStatus`, `ringIDag`, `ugetal`, `lavMail` og
`sendKundeMail` (Resend mocket: bcc sættes altid; fejl returneres, kastes ikke).
Route-handlere og UI verificeres manuelt i Vercel-preview.

## Juridisk note

Markedsføringslovens §10 omfatter også uopfordret elektronisk markedsføring til virksomheder.
Systemet understøtter både "mail først" og "ring først, mail som aftalt". Valget er
Krystians. Ikke juridisk rådgivning.

## Udrulning

`feat/salg` → push → Vercel-preview → manuel test → merge til `main` kun efter Krystians ja.
