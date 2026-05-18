# KrydsByg.com

Production-website + admin-panel for KrydsByg ApS — dansk vikarbureau til håndværk, byggeplads, rengøring og montering i København.

## Tech stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Upstash Redis** til al data-storage (`lib/db.ts`)
- **Resend** til transaktionel email
- **Anthropic Claude** (`claude-sonnet-4-6`) til AI-features (Council, Sarah, LeadBot)
- Deployed på **Vercel**

## Komme i gang

```bash
# 1. Installer dependencies
npm install

# 2. Kopier env-template og udfyld
cp .env.example .env.local

# 3. Start dev-server
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000).

### Minimum krævede env-vars

For at siden starter overhovedet:

- `JWT_SECRET` — min. 32 tegn
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (eller `_B64`)

For fuld funktionalitet — se `.env.example`.

## Arkitektur

```
app/
├── page.tsx                  # Forside (desktop + mobile split)
├── ydelser/                  # Services-side
├── priser/                   # Pris-side
├── om-os/                    # About
├── tilmeld/                  # Booking-wizard
├── admin/
│   ├── login/                # Admin login (rate-limited)
│   ├── (protected)/          # Beskyttede admin-sider
│   │   ├── medarbejdere/     # CRUD af vikarer
│   │   ├── vagter/           # Shift-management
│   │   ├── kunder/           # Kunde-database
│   │   ├── leads/            # LeadBot v2 dashboard
│   │   ├── council/          # AI rådgiver-chat
│   │   ├── sarah/            # Outreach-bot
│   │   └── tilbud/           # Quote-management
│   └── helbred/              # Personlig helbreds-modul (Krystian)
├── medarbejder/              # Vikar-portal
└── api/
    ├── contact/              # Kontakt-formular + auto-reply
    ├── admin/                # Beskyttede admin-routes (session-required)
    └── cron/                 # Vercel Scheduled Jobs (CRON_SECRET-required)

components/                   # Genbrugelige UI-komponenter
lib/
├── auth.ts                   # JWT + bcrypt
├── consent.ts                # Cookie-consent (GDPR)
├── cron-auth.ts              # Cron-secret verifikation
├── db.ts                     # Upstash Redis wrappers
├── rate-limit.ts             # Redis-baseret rate limiting
├── scrollToContract.ts       # Delt scroll-helper
└── lead-finder/              # LeadBot v2 (13 scrapers + Brain Layer)
hooks/
├── useCountUp.ts             # Animeret tæller
└── useReveal.ts              # Scroll-reveal observer
```

## Brand

- Sort baggrund (`#0C0C0A`) + gul accent (`#F5C400`)
- Barlow Condensed (headlines) + Barlow (body)
- Alle brugervendte tekster på dansk

## Sikkerhed

- **Login rate-limit:** 5 forsøg pr. IP pr. 5 min (`lib/rate-limit.ts`)
- **JWT_SECRET:** Min. 32 tegn (HS256)
- **CRON_SECRET:** Required — alle `/api/cron/*` routes kræver `Authorization: Bearer <secret>`
- **GDPR:** Cookie-consent reelt blokerer analytics når brugeren afviser
- **Email-fejl:** Returnerer 502 til klient (ingen silent failures)

## Cron-jobs (sat op i `vercel.json`)

| Endpoint | Schedule | Formål |
|----------|----------|--------|
| `/api/cron/find-leads` | dagligt | Scrape nye leads (max 60/dag) |
| `/api/cron/auto-outreach` | dagligt 13:00 DK | Council + Sarah analyse + send |
| `/api/cron/morning-report` | dagligt 08:00 DK | KPI-SMS til admin |
| `/api/cron/leadbot-feedback` | ugentligt mandag 06:00 | Feedback-loop til Brain |

## Scripts

```bash
npm run dev        # Dev-server
npm run build      # Produktion-build
npm run start      # Kør produktion-build
npm run lint       # ESLint
```

## Deployment

Push til `main` → Vercel auto-deployer.  
Sørg for at alle env-vars fra `.env.example` er sat i Vercel-projektet.

## Kontakt

KrydsByg ApS · CVR 46369947 · kontakt@krydsbyg.com · +45 42 77 88 66
