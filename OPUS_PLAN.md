> # ⛔ FORÆLDET (2026-07-08)
> Dette dokument beskriver JSON-fil-persistens og Resend-sandbox — koden bruger
> **Upstash Redis** (`lib/db.ts`), og Resend er **verificeret i produktion** (testet 2026-07-08).
> Aktuel arkitektur: `../../docs/superpowers/specs/2026-07-08-krydsbyg-email-og-struktur-design.md`.
> Beholdt kun til historik. Navigér IKKE efter denne fil.

# Opus Implementation Plan — KrydsByg

**Projekt:** `C:\Users\Bruger\OneDrive\Pulpit\kryds hjemmeside\kryds-website`  
**Stack:** Next.js 15 App Router · TypeScript · Tailwind CSS · Resend (email) · JSON filesystem DB  
**Seneste commit:** `a0f0356` på `main`

Læs dette dokument FØR du starter. Udfør opgaverne i præcis den rækkefølge de er listet. Efter hvert område: kør `npx tsc --noEmit` og ret fejl inden du fortsætter. Til sidst: kør `npm run build` og push til GitHub.

---

## EKSISTERENDE ARKITEKTUR (vigtigt at kende)

```
lib/
  types.ts          — Employee, Shift, Reference interfaces
  db.ts             — readEmployees/writeEmployees/readShifts/writeShifts (JSON filesystem)
  translations.ts   — DA + EN, alle brugervendte strings
  contract.ts       — CONTRACT_VERSION, kundevilkår punkter
  constants.ts      — TRADES, SKILL_SUGGESTIONS
data/
  employees.json    — liste af Employee[]
  shifts.json       — liste af Shift[]
app/
  api/
    contact/route.ts       — POST → send email til kontakt@krydsbyg.com via Resend
    register/route.ts      — POST → gem medarbejder + send email m. vedhæftede filer
    upload/route.ts        — POST → returnerer base64 dataUrl (ingen diskning)
    admin/
      login/route.ts, logout/route.ts, employees/route.ts, shifts/route.ts
    medarbejder/
      login/route.ts, logout/route.ts, shifts/route.ts, signup/route.ts
  admin/
    login/page.tsx
    (protected)/
      layout.tsx            — tjekker admin-session cookie
      page.tsx              — dashboard med stats + analytics
      medarbejdere/
        page.tsx            — liste over alle medarbejdere
        [id]/page.tsx       — detaljer + status-skift
      vagter/
        page.tsx            — vagtliste
        [id]/page.tsx       — vagtdetaljer
  medarbejder/
    login/page.tsx
    (protected)/
      layout.tsx            — tjekker medarbejder-session cookie
      page.tsx              — medarbejder-dashboard (vagter + tilmelding)
components/
  BranchCarousel.tsx   — karrosel m. hover-center + klik-til-book modal (ny)
  MobileApp.tsx        — mobil app-interface (vises < 900px)
  Contact.tsx          — kontaktformular (desktop)
  Nav.tsx, Hero.tsx, Footer.tsx, Ticker.tsx, ...
app/
  ydelser/page.tsx     — 7 service-kort (ny, bruger translations)
  priser/
    page.tsx + PriserClient.tsx
  om-os/
    page.tsx + OmOsClient.tsx
  tilmeld/
    page.tsx           — wrapper
  cookie-politik/, handelsbetingelser/, privatpolitik/, medarbejder-privatpolitik/
    page.tsx + LegalHeader.tsx
```

**Email-opsætning:**
- `RESEND_API_KEY` og `RESEND_TO=kontakt@krydsbyg.com` er sat i `.env.local`
- Resend er i sandbox — mails går kun til `krys00305@gmail.com` indtil domænet verificeres
- Al email-kode er allerede korrekt — bare vent på domæne-verificering

---

## OMRÅDE 1 — FEED-SYSTEM (admin → medarbejdere)

### 1A. Udvid typer og DB

**`lib/types.ts`** — tilføj FeedMessage interface til sidst:
```typescript
export interface FeedMessage {
  id: string;
  title: string;
  body: string;
  authorName: string;  // "Admin" / navn
  priority: "normal" | "urgent";
  createdAt: string;   // ISO
}
```

**`lib/db.ts`** — tilføj feed-funktioner efter de eksisterende:
```typescript
const FEED_FILE = path.join(DATA_DIR, "feed.json");

export async function readFeed(): Promise<FeedMessage[]> {
  return readJson<FeedMessage[]>(FEED_FILE, []);
}

export async function writeFeed(messages: FeedMessage[]): Promise<void> {
  return writeJson(FEED_FILE, messages);
}
```

### 1B. API Routes

**`app/api/admin/feed/route.ts`** — ny fil:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { readFeed, writeFeed, generateId } from "@/lib/db";
import { cookies } from "next/headers";
import type { FeedMessage } from "@/lib/types";

function isAdmin() {
  return cookies().get("kryds-admin")?.value === "authenticated";
}

// GET — hent alle beskeder (nyeste først)
export async function GET() {
  // Tillad medarbejdere at læse feed (ingen auth krav)
  const messages = await readFeed();
  return NextResponse.json(messages.slice().reverse());
}

// POST — opret ny besked (kun admin)
export async function POST(req: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, body, authorName, priority } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "title og body er påkrævet" }, { status: 400 });
  }
  const messages = await readFeed();
  const msg: FeedMessage = {
    id: generateId(),
    title: title.trim(),
    body: body.trim(),
    authorName: authorName?.trim() || "Admin",
    priority: priority === "urgent" ? "urgent" : "normal",
    createdAt: new Date().toISOString(),
  };
  messages.push(msg);
  await writeFeed(messages);
  return NextResponse.json({ ok: true, id: msg.id }, { status: 201 });
}

// DELETE — slet besked (kun admin)
export async function DELETE(req: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const messages = await readFeed();
  await writeFeed(messages.filter(m => m.id !== id));
  return NextResponse.json({ ok: true });
}
```

**`app/api/admin/broadcast/route.ts`** — ny fil, sender email til alle aktive medarbejdere:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { readEmployees } from "@/lib/db";
import { cookies } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (cookies().get("kryds-admin")?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, body, priority } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "title og body krævet" }, { status: 400 });
  }
  const employees = await readEmployees();
  const recipients = employees.filter(e => e.status !== "INAKTIV" && e.email);
  
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0, warning: "no_api_key" });
  }
  
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const isUrgent = priority === "urgent";
  
  let sent = 0;
  for (const emp of recipients) {
    try {
      await resend.emails.send({
        from,
        to: [emp.email!],
        subject: `${isUrgent ? "⚡ VIGTIGT: " : ""}${title} — Kryds`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0C0C0A;padding:32px;border-radius:4px;">
            <div style="background:#F5C400;padding:16px 24px;margin-bottom:24px;border-radius:2px;">
              <p style="margin:0;font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0C0C0A;">✕ KRYDS — Besked til dig</p>
            </div>
            <h2 style="color:${isUrgent ? '#F5C400' : '#F2EEE6'};margin:0 0 12px;">${title}</h2>
            <p style="color:#F2EEE6;font-size:15px;line-height:1.6;white-space:pre-wrap;">${body}</p>
            <hr style="border:none;border-top:1px solid rgba(242,238,230,0.1);margin:24px 0;">
            <p style="color:#888880;font-size:12px;">Hej ${emp.name.split(' ')[0]} — log ind på <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://krydsbyg.com'}/medarbejder/login" style="color:#F5C400;">medarbejder-portalen</a> for at se åbne vagter.</p>
          </div>
        `,
      });
      sent++;
    } catch {}
  }
  return NextResponse.json({ ok: true, sent, total: recipients.length });
}
```

### 1C. Admin Feed-side

**`app/admin/(protected)/feed/page.tsx`** — ny fil (client component):

Lav en side med:
- Header: "Meddelelser til personalet" med gul eyebrow "Feed"
- Formular med: `title` (input), `body` (textarea), `priority` radio (normal/urgent), `authorName` (input, default "Admin"), Send-knap + "Send email til alle"-checkbox
- POST til `/api/admin/feed` + hvis checkbox: POST til `/api/admin/broadcast`
- Liste over eksisterende beskeder (fra GET /api/admin/feed) med slet-knap
- Style: samme dark-card stil som resten af admin (bg-gray, border var(--border), text-cream)

### 1D. Admin Navigation

**`app/admin/(protected)/layout.tsx`** — læs filen og tilføj "Feed" link til nav-sidebaren, efter "Vagter" linket. Brug samme link-stil som de eksisterende.

### 1E. Medarbejder Dashboard — vis feed

**`app/medarbejder/(protected)/page.tsx`** — tilføj øverst i komponenten:
```typescript
const [feed, setFeed] = useState<Array<{id:string;title:string;body:string;priority:string;createdAt:string}>>([]);

useEffect(() => {
  fetch('/api/admin/feed').then(r => r.json()).then(setFeed).catch(() => {});
}, []);
```

Tilføj sektion OVER "Mine vagter":
```tsx
{feed.length > 0 && (
  <section className="mb-10">
    <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-4">
      Beskeder fra Kryds
    </h2>
    <div className="space-y-3">
      {feed.slice(0, 5).map(msg => (
        <div key={msg.id} className={`p-5 rounded-[2px] border ${msg.priority === 'urgent' ? 'border-yellow bg-[rgba(245,196,0,.06)]' : 'border-[rgba(242,238,230,0.07)] bg-gray'}`}>
          {msg.priority === 'urgent' && <span className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-yellow mb-2 block">⚡ Vigtigt</span>}
          <h3 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.02em] text-cream mb-2">{msg.title}</h3>
          <p className="text-[14px] text-muted leading-[1.6] whitespace-pre-wrap">{msg.body}</p>
          <p className="text-[11px] text-muted mt-3">{new Date(msg.createdAt).toLocaleDateString('da-DK', {day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
      ))}
    </div>
  </section>
)}
```

---

## OMRÅDE 2 — BRANCH KARROSEL TEKSTFARVE

**`components/BranchCarousel.tsx`** — find og ret:

1. Nummer-tag (`— 01`): 
   - FRA: `text-[rgba(242,238,230,.55)]`
   - TIL: `text-cream opacity-70`

2. Subtitle under titlen (branchens underskrift):
   - Den er allerede `text-yellow` — det er korrekt, lad den stå

3. Overlay-gradienten er for mørk — gør branchetitlen mere synlig:
   - FRA: `rgba(12,12,10,.88) 0%` 
   - TIL: `rgba(12,12,10,.75) 0%`

4. Branch-titel h4: skift fra blot `text-cream` til `text-white font-black` for mere kontrast.

---

## OMRÅDE 3 — YDELSER SIDE REDESIGN

**`app/ydelser/page.tsx`** — erstat hele indholdet.

Den nye side skal have:
1. **Hero-sektion** (ligner de andre siders toppe):
   - Gul eyebrow: "Vores ydelser" / "Our services"
   - H1: "Alt inden for" + gul "byggeprojekter" / "construction projects"
   - Subtitle: "Vi dækker hele spektret — fra renovering og byggeplads til events og havearbejde. Ét hold, syv brancher." / EN version

2. **7 branch-kort** (reorganiseret som et bedre grid):
   - Erstat de nuværende 7 kort med et nyt layout: billede-kort med hover-effekt (brug samme Unsplash-billeder som i BranchCarousel)
   - Hvert kort viser: Branchenummer (01-07), Branchenavn (stor), Underkategori (gul), Beskrivelse (2-3 linjer), 3-4 tags, "Book denne ydelse →" link til /#contact eller /priser

3. **"Hvorfor vi tilbyder dette" sektion** under kortene:
   - 3 kolonner med ikoner: 
     1. "Ét kontaktpunkt" — vi håndterer alt
     2. "Fleksibelt hold" — fra 1 til 20+ folk
     3. "Hurtig respons" — svar inden for 2 timer

4. **CTA-sektion** i bunden (allerede eksisterer, bevar den).

Brug de eksisterende translations-nøgler fra `lib/translations.ts` (svc_1_title, svc_1_desc, svc_1_tags etc. + branch_X_name, branch_X_sub).

Tilføj nye nøgler til `lib/translations.ts` for:
```
ydelser_why_eyebrow: "Hvorfor Kryds" / "Why Kryds"
ydelser_why_1_title: "Ét kontaktpunkt" / "One point of contact"
ydelser_why_1_desc: "..." / "..."
ydelser_why_2_title: "Fleksibelt hold" / "Flexible team"
ydelser_why_2_desc: "..." / "..."
ydelser_why_3_title: "Hurtig respons" / "Fast response"
ydelser_why_3_desc: "..." / "..."
```

Billeder til kortene (fra BranchCarousel, samme order):
```javascript
const BRANCH_IMGS = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80",
  "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
  "https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=900&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
];
```

---

## OMRÅDE 4 — MOBIL APP FORBEDRINGER

**`components/MobileApp.tsx`**

### 4A. FJERN "Vores folk" sektionen
Slet hele `{/* ── STAFF CARDS CAROUSEL ── */}` sektionen (ca. 55 linjer) inkl. `STAFF_CARDS` konstanten og `staffTrackRef`, `staffPaused` state.

### 4B. Gør branch-tiles mere prominente (som desktop)
Udskift de eksisterende service-tile kort med et nyt design der ligner desktop-brancher:
- Vis billede som baggrund (brug BRANCH_IMGS listen ovenfor — importer som konstant)
- Gradient overlay som på desktop
- Branchenummer + navn + undertekst
- "Book →" knap der åbner hurtig-book booking (genrug `prefillAndScroll` eller open mini-form)
- Behold swipe-karrosel, men giv kortene height 200px og fuld bredde (90vw, max 320px)

### 4C. Simplifér andre sektioner
- **Hero:** Behold som er, men fjern trust-badges (de fylder for meget på lille skærm — brugeren kan se dem på desktop)
- **Hurtig booking:** Behold, men gør den mere kompakt — fjern antal-feltet (det er forvirrende på mobil), lad det kun være: branche-vælger, telefon, dato-range, send-knap
- **Kontakt-strip:** Behold de to kort (ring / skriv), fjern legal quick-links (de hører til footer, ikke app)

### 4D. Bottom nav — simplificer
Reducer fra 4 til 3 items:
```javascript
{ id: "home", href: "#", label: isDA ? "Hjem" : "Home", icon: /* hus */ },
{ id: "book", href: "#appBook", label: isDA ? "Book" : "Book", icon: /* kalender */ },
{ id: "ring", href: "tel:+4542778866", label: isDA ? "Ring" : "Call", icon: /* telefon */ },
```

---

## OMRÅDE 5 — HTML VERIFIKATIONSSIDE

**`public/preview.html`** — ny statisk HTML-fil (ingen Next.js routing).

Lav en komplet stand-alone HTML-side der:

1. **Viser alle 7 brancher** som kort-grid (3+2+2) med rigtig styling
2. **Tester farvekontrast** — vis begge temaer side om side (dark venstre, light højre)
3. **Mobil viewport** — vis en iPhone-frame (390×844) med MobileApp-layoutet skitseret
4. **Typeografi-test** — alle font-størrelser brugt på siden
5. **Farvepalette** — alle CSS-variabler vist som swatches

Tekniske krav til HTML-filen:
- Inkluder Tailwind CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Inkluder Google Fonts: Barlow + Barlow Condensed
- Inkluder alle CSS custom properties (copy fra globals.css `:root` og `[data-theme="light"]`)
- Ingen JavaScript-afhængigheder udover Tailwind CDN
- Skal virke ved at åbne `public/preview.html` direkte i browser

Indhold:
```html
<!DOCTYPE html>
<html lang="da" data-theme="dark">
<!-- 
  KrydsByg — Visuel preview & verifikationsside
  Åbn i browser for at verificere layout, farver og typografi
  Ingen server krævet
-->
```

Afsnit i HTML-siden:
1. Kontrolpanel øverst: tema-toggle knap, skærmstørrelse-vælger
2. Farvepalette (alle --color-* variabler)
3. Typografi-skala (alle fontstørrelser)
4. Hero-sektions-mock (med gradient-baggrund)
5. Branch-karrosel mock (7 kort, hover-effekt via CSS :hover)
6. Priser-tiers mock (3 kort side om side)
7. Mobilvisning mock (390px ramme med branch-tiles og bottom-nav)
8. Kontaktformular mock
9. Lys-mørk-sammenligning side om side

---

## RÆKKEFØLGE OG CHECKPOINTS

1. **Område 1** (Feed): `lib/types.ts` → `lib/db.ts` → API routes → admin side → medarbejder dashboard
2. **Område 2** (Karrosel tekst): `components/BranchCarousel.tsx` — 3 linjer ændring
3. **Område 3** (Ydelser): `app/ydelser/page.tsx` — fuld omskrivning + translations
4. **Område 4** (Mobil): `components/MobileApp.tsx` — fjern staff, forbedre tiles
5. **Område 5** (HTML): `public/preview.html` — ny statisk fil

**Efter hvert område:** `npx tsc --noEmit` — ret eventuelle fejl.  
**Til sidst:** `npm run build` — skal returnere ✓ Generating static pages (33/33) eller flere.  
**Push:** `git add -A && git commit -m "..." && git push`

---

## VIGTIGE BEGRÆNSNINGER

- **MÅ IKKE ændre:** `app/api/contact/route.ts`, `app/api/register/route.ts`, `app/api/upload/route.ts` — disse virker korrekt
- **MÅ IKKE ændre:** `app/admin/(protected)/layout.tsx` auth-logik — kun tilføj nav-link
- **MÅ IKKE ændre:** `lib/contract.ts`, `components/ContractBox.tsx` — kontrakttekst er juridisk
- **DB-note:** `readFeed/writeFeed` bruger filesystem ligesom de andre — virker i development og på servere med persistent storage. På Vercel serverless er dette read-only efter deploy, men feed-data kan pre-populate via `data/feed.json` commit.
- **Translations:** Alle brugervendte strings skal have DA + EN nøgler i `lib/translations.ts`
- **Theme-aware:** Brug `var(--color-*)` eller Tailwind tokens (`bg-gray`, `text-cream`, `text-muted`, `text-yellow`, `border-[var(--border)]`) — aldrig hardkodede hex-farver

---

## EKSISTERENDE CSS-VARIABLER (reference)

```css
/* Dark (default) */
--color-black:  #0C0C0A   /* Side-baggrund */
--color-black2: #111110   /* Sekundær baggrund */
--color-gray:   #1E1E1C   /* Kort-baggrund */
--color-gray2:  #2A2A28   /* Input-baggrund */
--color-yellow: #F5C400   /* Accent/brand */
--color-cream:  #F2EEE6   /* Primær tekst */
--color-muted:  #888880   /* Sekundær tekst */
--border:       rgba(242,238,230,0.07)

/* Light overrides */
--color-black:  #F4F0E8
--color-gray:   #E0DBD3
--color-cream:  #1A1918
--color-muted:  #6B6760
--border:       rgba(26,25,24,0.10)
```

## Tailwind-klasser der virker i begge temaer
- `bg-black`, `bg-black2`, `bg-gray`, `bg-gray2` — følger CSS-variabler
- `text-cream`, `text-muted`, `text-yellow` — følger CSS-variabler
- `border-[var(--border)]` — følger CSS-variabel
- `bg-yellow`, `text-black` — faste farver (gul knap, sort tekst)
