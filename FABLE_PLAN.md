# FABLE_PLAN — Optimering, oprydning & professionalisering af KrydsByg

> **Til Fable:** Udfør faserne i rækkefølge. FASE 0 har en hård godkendelses-gate —
> intet arbejde i FASE 1-5 må påbegyndes før brugeren eksplicit har godkendt HTML-mockupen.
> Efter hver fase: kør `npx tsc --noEmit` og ret fejl. Til sidst skal `npm run build` være grøn.

---

## Kontekst

- **Projekt:** `kryds hjemmeside/kryds-website/` — Next.js 14 (App Router), TypeScript, Tailwind, deployes til Vercel via git push.
- **Brand:** Sort/gul/creme (`--color-black #0C0C0A`, `--color-yellow #F5C400`, `--color-cream #F2EEE6`), Barlow + Barlow Condensed. Dark/light-tema via CSS-variabler og `data-theme`.
- **Sprog:** Alle brugervendte tekster går gennem `lib/translations.ts` (DA + EN, ~1112 linjer). Nye/ændrede tekster SKAL have begge sprog.
- **Vigtig forretningsændring:** Karl Kristian Ravn er ikke længere i firmaet. Krystian Seweryn Balasz er nu eneste stifter/ansigt udadtil.

---

## GUARDRAILS — MÅ IKKE ÆNDRES

- `lib/contract.ts` og `components/ContractBox.tsx` — kontrakttekst er juridisk.
- Auth-logik i `app/admin/(protected)/layout.tsx` og login/logout API-routes.
- Fungerende API-routes: `app/api/contact/route.ts`, `app/api/register/route.ts`, `app/api/upload/route.ts` (undtagelse: `app/api/admin/council/route.ts` — kun den ene tekstlinje nævnt i FASE 1).
- Ingen hardkodede hex-farver i komponenter — brug Tailwind-tokens (`bg-gray`, `text-cream`, `text-muted`, `text-yellow`) eller `var(--color-*)` / `border-[var(--border)]`.
- Commit efter hver afsluttet fase med beskrivende dansk commit-besked. Push først når brugeren beder om det (push = live deploy på Vercel).

---

## FASE 0 — HTML-mockup af det polerede look (GODKENDELSES-GATE)

**Mål:** Én statisk fil `public/redesign-preview.html` der viser det nye, renere design.
Brugeren åbner filen direkte i browseren (ingen server), godkender eller kommenterer.
**STOP efter denne fase. Fortsæt IKKE til FASE 1 uden eksplicit godkendelse.**

### Designretning: "Poleret, samme brand"

Behold identiteten 100 % (farver, fonte, X-logoet, uppercase condensed-overskrifter). Stram op:

1. **Mere luft:** Sektionsafstand øges konsekvent (fx 120px desktop / 72px mobil i mockupen), ens indre padding i alle kort.
2. **Færre konkurrerende elementer:** Én accent pr. sektion. Kort uden både border + skygge + hover-glow på samme tid — vælg border + diskret hover.
3. **Roligere animationer:** Behold scroll-reveal og ticker, men drop/afdæmp konstant kørende effekter der trækker øjet (fx langsommere spin på hero-X eller statisk X med subtil hover).
4. **Konsistente knapper:** Præcis to knap-varianter i hele mockupen — primær (gul baggrund, sort tekst) og sekundær (gul border, transparent). Ens padding, radius 2px, ens hover.
5. **Renere typografisk hierarki:** Eyebrow (11px tracking) → H2 (clamp) → brødtekst (16px/1.8). Ingen sektioner med tre forskellige tekststørrelser i samme afsnit.

### Mockupen skal vise (i én lang, scrollbar side med sektionsanker-menu øverst):

1. **Forside:** Hero, ticker, stats-bar, brancher/ydelses-grid, "Sådan fungerer det", "Hvorfor Kryds", team-teaser (kun Krystian), kontaktformular-mock, footer.
2. **Om os:** Hero + "Hvorfor vi startede" + **nyt ét-persons team-layout** — ét centreret kort med foto, navn "Krystian Seweryn Balasz", rolle "Stifter & direktør", bio. Ikke et halvtomt 2-kolonne-grid.
3. **Ydelser:** Grid med alle 9 ydelser i det strammere kort-design.
4. **Priser:** Pris-sektionen i samme rene stil.

### Tekniske krav til filen

- Tailwind CDN (`<script src="https://cdn.tailwindcss.com"></script>`) + Google Fonts (Barlow, Barlow Condensed).
- Alle CSS-variabler fra `app/globals.css` `:root` og `[data-theme="light"]` kopieres ind.
- Tema-toggle-knap øverst (dark ↔ light) med ren JS (`data-theme`-attribut).
- Ingen andre JS-afhængigheder. Skal virke ved dobbeltklik på filen.
- Kommentér øverst i filen: formål, dato, "slettes efter godkendt implementering".

### Verifikation FASE 0

- Filen åbner uden konsolfejl i browser.
- Begge temaer ser korrekte ud.
- **Spørg brugeren:** "Åbn `public/redesign-preview.html` — godkender du designet, eller skal noget justeres?" Vent på svar.

---

## FASE 1 — Fjern Karl fuldstændigt

Karl optræder 5 steder + én billedfil. Alle skal væk:

### 1a. `app/om-os/OmOsClient.tsx`
- Fjern objekt nr. 2 i `team`-arrayet (linje 19-25: `omos_team_2_*`, `/karl.jpg`).
- Ændr team-grid fra `grid grid-cols-2` til ét centreret kort (fx `max-w-[480px] mx-auto`), i overensstemmelse med det godkendte mockup-layout fra FASE 0.
- Overvej om overskriften "Folkene bag Kryds" skal ændres til fx "Manden bag Kryds" / "Mød stifteren" (DA) + "Meet the founder" (EN) — følg mockupens godkendte tekst.

### 1b. `lib/translations.ts`
- Slet nøglerne `omos_team_2_name`, `omos_team_2_role`, `omos_team_2_bio` i BÅDE `da`-blokken (~linje 440-443) og `en`-blokken (~linje 992-995).
- Opdater evt. `omos_team_h2_*`-nøgler hvis overskriften ændres (begge sprog).

### 1c. `app/om-os/page.tsx`
- Metadata-description (linje 7) nævner "drevet sammen med Karl Kristian Ravn" — omskriv til kun Krystian, fx: "Mød manden bag Kryds. Stiftet og drevet af Krystian Seweryn Balasz — fordi vi tror på at hjælpe hinanden."

### 1d. `app/ghost/page.tsx` (live på `/ghost` selvom den er ulinket)
- Omskriv historien til én-stifter-fortælling: fjern afsnittet om Karl (linje ~55) og hans kort i person-arrayet (linje ~83, inkl. citat og `/karl.jpg`).
- Historien skal stadig hænge sammen sprogligt efter fjernelsen — læs hele siden igennem og omskriv overgangene.

### 1e. `app/api/admin/council/route.ts`
- Linje ~127: `- Leder: Krystian (grundlægger) + Karl` → `- Leder: Krystian (grundlægger)`. Rør intet andet i filen.

### 1f. `public/karl.jpg`
- Slet filen. Verificér først med grep at ingen andre referencer findes: `grep -ri "karl" app/ components/ lib/ public/` skal kun returnere nul brugervendte hits efter 1a-1e.

### Verifikation FASE 1
- `grep -ri "karl\|ravn" app/ components/ lib/` → ingen hits (bortset fra evt. uvedkommende ord).
- `npx tsc --noEmit` grøn.
- `/om-os` og `/ghost` renderer korrekt lokalt (ét-persons layout, ingen brudte billeder).

---

## FASE 2 — Forbedring af Krystians foto

**Udgangspunkt:** `public/krystian.jpg` (960×2079) er et privat caféfoto: masser af tomt rum foroven/forneden, gaffel og tallerken i billedet, snapshot-æstetik. Bruges på `/om-os` (140px cirkel) og `/ghost`.

### 2a. Beskæring & optimering (gør dette)
Brug `sharp` via et engangs-script (`scripts/optimize-portrait.mjs`, slettes bagefter — `sharp` er allerede transitiv dependency i Next-projekter; ellers `npm i -D sharp`):
1. Beskær til tæt hoved/skulder-portræt i kvadrat: ansigtet sidder ca. ved x 380-720, y 340-900 i originalen — beskær til ca. `left 250, top 280, width 660, height 660` og finjustér visuelt så ansigtet er centreret i øverste tredjedel og gaffel/tallerken er helt ude.
2. Let korrektion: `modulate({ brightness: 1.05, saturation: 1.05 })` + mild `sharpen()`.
3. Eksportér `public/krystian.jpg` (erstat, 640×640, kvalitet 80, progressiv) — gem originalen som `public/krystian-original.jpg` indtil brugeren godkender, slet derefter originalen.
4. Opdater `facePosition`/`objectPosition` og `transform: scale(1.35)` i `app/om-os/OmOsClient.tsx` og `app/ghost/page.tsx` — med korrekt beskæring er scale-hacket sandsynligvis unødvendigt (fjern det hvis billedet fylder cirklen pænt uden).

### 2b. Kvalitets-gate
Vis brugeren resultatet (screenshot af `/om-os` team-kortet). **Hvis billedet stadig ser uprofessionelt ud efter beskæring, sig det ærligt** og anbefal et rigtigt fotograferet headshot (neutral baggrund, arbejdstøj eller skjorte) — gæt ikke videre med AI-manipulation uden accept.

### Verifikation FASE 2
- `/om-os`-kortet viser ansigt/skuldre uden bestik, mad eller tomt rum.
- Filstørrelse < 80 KB.
- Brugeren har set og accepteret resultatet.

---

## FASE 3 — Fuld korrektur (DA + EN)

**Metode:** Læs `lib/translations.ts` SYSTEMATISK fra linje 1 til slut — først hele `da`-blokken, så hele `en`-blokken. Derefter sider med hardkodet tekst: `app/ghost/page.tsx`, `app/handelsbetingelser/page.tsx`, `app/privatpolitik/page.tsx`, `app/cookie-politik/page.tsx`, `app/medarbejder-vilkaar/page.tsx`, `app/medarbejder-privatpolitik/page.tsx` (korrektur i legal-tekster: KUN rene stavefejl — ingen omformuleringer, jf. guardrails om juridisk tekst).

### Kendte fejl der SKAL rettes (fundet ved stikprøve):

| Sted | Fejl | Rettelse |
|------|------|----------|
| `svc_page_subtitle` (DA+EN) | "Én kontakt, syv brancher" — der er 9 ydelser | "Én kontakt, ni brancher" (eller drop tallet: "Én kontakt — alle brancher") |
| `contact_price_1` (DA) | "Handyman / oprydning" — engelsk i dansk prisliste | "Altmulig-arbejde / oprydning" el.lign. |
| `footer_svc_1` (DA) | "Bygge projekter" — særskrivning | "Byggeprojekter" |

### Tjekliste under gennemlæsning:
- Særskrivningsfejl (klassisk dansk fejl: "bygge projekter", "time pris", "vikar bureau").
- Konsekvent brug af "personale" vs. "folk" vs. "vikarer" — vælg én primær term pr. kontekst.
- EN-blokken: brug britisk ELLER amerikansk konsekvent (nuværende tekst bruger "mobilise" = britisk; hold den linje).
- Store/små bogstaver konsistent i knapper og labels.
- Tegnsætning: manglende punktummer i beskrivelser, dobbelt-mellemrum.
- Ret fejl direkte; lav en kort liste i commit-beskeden over hvad der blev rettet.

### Verifikation FASE 3
- `npx tsc --noEmit` grøn (nøgle-navne er urørte, kun værdier ændret).
- Stikprøve i browser: forside, ydelser, priser, om-os på både DA og EN.

---

## FASE 4 — Indholdskonsistens & professionalisme

Faktuelle påstande skal stemme overens på tværs af hele sitet. Fundne konflikter:

| Påstand | Steder | Problem |
|---------|--------|---------|
| Timepris | OG-description i `app/layout.tsx` siger "fra 345 kr/t"; `contact_price_1-3` siger "fra 320 kr/t"; tjek også `/priser`-siden | Ét tal skal være sandt — spørg brugeren hvilket, ret alle steder |
| Svartid/levering | OG siger "Leveringstid: 24 timer"; `hero`/`how_1_desc`/`contact_success_desc` siger "svar inden for 2 timer" | Afklar: 2t = svartid, 24t = levering? Formulér konsekvent, fx "Svar inden for 2 timer — folk på pladsen inden for 24" |
| Stats | `StatsBar` viser 50+ folk og 3 år; Krystians bio siger "over 7 år" (personligt — OK), men gammel `KRYDS_PROJECT.md`-tekst ("300+", "7 år") må ikke genindføres | Verificér at 50+/2t/100%/3 år er de tal brugeren står inde for |
| Email-casing | JSON-LD i `layout.tsx` har "Kontakt@KrydsByg.com" | Normalisér til "kontakt@krydsbyg.com" overalt |

### Øvrige punkter:
- Fjern placeholder-rester: grep for "kommer snart", "coming soon", "placeholder", "lorem" i `app/` og `components/` — erstat eller fjern.
- Unsplash-billeder bruges i `Services.tsx`, `Gallery.tsx`, `BranchCarousel.tsx`, `MobileApp.tsx`, `app/ydelser/page.tsx`, `lib/services-data.ts`: generiske stockfotos svækker troværdigheden. Kortlæg hvilke der vises offentligt, og foreslå brugeren en liste over hvilke egne arbejdsbilleder der bør erstatte dem (implementér kun udskiftning hvis brugeren leverer billeder — ellers behold Unsplash frem for tomme huller).
- Alle CTA'er tjekkes: hver knap/link peger på eksisterende route eller anker (`/#contract`, `/tilmeld`, `tel:`-links med korrekt nummer +45 42 77 88 66).
- `alternates.canonical` i `layout.tsx` er hardkodet til forsiden for ALLE sider — flyt canonical til per-side metadata så undersider ikke kanonicaliserer til forsiden.

### Verifikation FASE 4
- Grep-tjek: `grep -rn "345 kr\|320 kr" app/ lib/` viser kun det afklarede tal.
- Alle interne links klikket igennem lokalt uden 404.

---

## FASE 5 — Performance & SEO

### 5a. Billeder
- Audit alle `next/image`-brug: korrekt `sizes`-attribut, `priority` KUN på hero/above-the-fold, `fill` med defineret container.
- Unsplash-URL'er: tilføj eksplicitte `w=`/`q=`-parametre (fx `?w=800&q=75`) hvor de mangler, så der ikke hentes fuldstørrelse.
- Tjek at ingen `<img>`-tags bruges hvor `next/image` burde.

### 5b. Metadata & SEO
- Per-side canonical (jf. FASE 4).
- `/ghost`: Beslut med brugeren — enten tilføj `robots: { index: false }` (intern/skjult historie-side) eller link den fra footer og lad den indeksere. Ingen mellemvej (indekseret men forældreløs side er dårlig SEO).
- Sitemap (`app/sitemap.ts`): verificér at alle offentlige routes er med og ingen døde. Kun rigtige routes — ingen ankre eller admin-sider.
- JSON-LD: udvid `LocalBusiness` med `foundingDate`, `founder` (Person: Krystian Seweryn Balasz), `image` (logo/OG-billede) og ret `sameAs` (peger i dag kun på sitet selv — fjern eller tilføj rigtige profiler, fx CVR/LinkedIn hvis brugeren har dem).
- Alt-tekster: alle `<Image>` skal have beskrivende dansk alt (ikke bare navne).

### 5c. Bundle & runtime
- `npm run build` og notér First Load JS pr. route. Flag routes > 150 kB til brugeren.
- Tjek at tunge admin-komponenter ikke importeres i offentlige sider (ingen krydsimport fra `app/admin/` til public routes).
- `public/redesign-preview.html` SLETTES i denne fase (mockupen er implementeret).

### Verifikation FASE 5
- `npm run build` grøn, alle sider genereres.
- Lighthouse (lokal, mobil) på forsiden: Performance ≥ 90, SEO ≥ 95 — ellers dokumentér hvorfor.

---

## AFSLUTNING

1. `npx tsc --noEmit` → grøn.
2. `npm run build` → grøn, notér antal genererede sider.
3. Manuel gennemklikning: forside, ydelser, priser, om-os, tilmeld, ghost — begge temaer, DA + EN, desktop + mobilbredde.
4. Opsummér til brugeren: hvad blev ændret pr. fase, hvilke beslutninger venter (foto-kvalitet, timepris-tal, ghost-sidens skæbne, egne billeder til Unsplash-erstatning).
5. Commit pr. fase er allerede sket — spørg brugeren om der skal pushes (= live deploy).
