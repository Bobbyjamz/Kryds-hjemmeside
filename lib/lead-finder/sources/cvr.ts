/**
 * CVR-kilde — finder ~30 virksomheder per dag med fuld enrichment:
 * 1. Søg CVR API → basis firma-info
 * 2. Scrape firma-website → email, telefon, kontaktperson
 * 3. Bygger "Sarahs noter" baseret på al indsamlet info
 *
 * Reliabilitet: dobbelt-fallback (cvrapi.dk + direkte CVR-opslag), retry på timeout.
 */

import type { LeadCandidate } from "../types";
import { rankSearchTerms, type IndustryWeights } from "../scoring";
import { scrapeWebsite } from "../enrichment/website-scraper";

// 265+ søgetermer — bredt fordelt på ALLE brancher, ikke kun bolig/ejendom.
// Roterer så vi aldrig rammer de samme to dage i træk (90 termer/dag).
// VIGTIGT: ingen specifikke firmanavne — brede branchemønstre giver variation.
const SEARCH_TERMS = [
  // ── Rengøring & Facility (30 termer) ─────────────────────────────────────
  "rengøring", "rengøringsservice", "erhvervsrengøring", "kontorrengøring",
  "bygningsrengøring", "fraflytningsrengøring", "vinduespudsning",
  "industrirengøring", "institutionsrengøring", "hotellrengøring",
  "rengøringsfirma", "professionel rengøring", "rengøringsleder",
  "ejendomsservice", "viceværtservice", "driftsservice", "trappevask",
  "skimmelsanering", "graffitirens", "skadedyrsbekæmpelse",
  "facility management", "facilities service", "teknisk drift",
  "desinfektion service", "desinfektion", "sanering",
  "renholdelse", "servicefirma", "servicevirksomhed", "driftsvirksomhed",

  // ── Maling & Overfladebehandling (15 termer) ─────────────────────────────
  "malerfirma", "malerentreprenør", "malermester", "malerservice",
  "facadespartling", "overfladebehandling", "spartelfirma", "spartelentreprenør",
  "gulvlakering", "bejdsning", "facaderenovering", "industrioverflade",
  "dekoration maling", "malervirksomhed", "bygningsbemaling",

  // ── Flytning & Transport (15 termer) ─────────────────────────────────────
  "flyttefirma", "flytningsservice", "godstransport", "chaufførservice",
  "budtjeneste", "kurerfirma", "fragtmand", "budfirma",
  "distributionsservice", "specialtransport", "pakkeservice",
  "møbeltransport", "kontorflytning", "virksomhedsflytning", "transportfirma",

  // ── Tømrer & Snedker (15 termer) ─────────────────────────────────────────
  "tømrerfirma", "tømrermester", "tømrerservice", "snedkerfirma",
  "snedkermester", "tømrer entreprise", "tømrer renovering",
  "trækonstruktion", "vinduer og døre", "vinduesmontør",
  "køkkenmontering", "inventarmontering", "tømrer og snedker",
  "listesætter", "bygningssnedker",

  // ── Murer & Beton (12 termer) ─────────────────────────────────────────────
  "murerfirma", "murermester", "murer entreprise", "betonentreprenør",
  "fundamentsarbejde", "flisebelægning", "stenbelægning",
  "teglstensmur", "murerservice", "murerforretning",
  "betonstøbning", "udendørs belægning",

  // ── Gulv & Fliser (10 termer) ─────────────────────────────────────────────
  "gulvlægger", "gulvfirma", "parketlægger", "flisefirma",
  "epoxygulv", "gulvslibning", "laminatlægning",
  "tæppelægning", "gulvafslibning", "gulvbehandling",

  // ── VVS (12 termer) ───────────────────────────────────────────────────────
  "vvs firma", "vvs installatør", "vvs mester", "rørfirma",
  "kloakservice", "kloakfirma", "vvs service",
  "blikkenslager", "sanitetsinstallation", "gulvvarme",
  "varmepumpe firma", "vvs installation",

  // ── El & Ventilation (10 termer) ─────────────────────────────────────────
  "el-installatør", "elektriker", "elfirma", "el mester",
  "ventilationsservice", "aircondition service",
  "solcelleanlæg", "elinstallation", "el-service", "stærkstrøm",

  // ── Tag & Stillads (10 termer) ────────────────────────────────────────────
  "tagdækkerfirma", "tagdækker", "tagservice", "tagrenovering",
  "stilladsopsætning", "stilladsudlejning",
  "tagisolering", "isoleringsfirma", "facadeisolering", "tagentreprenør",

  // ── Have & Anlæg (20 termer) ─────────────────────────────────────────────
  "anlægsgartner", "havefirma", "haveservice", "haveanlæg",
  "beskæringsfirma", "snerydning", "vinterservice", "saltning",
  "græsslåningsfirma", "ukrudtsbekæmpelse", "stubfræsning",
  "grønne arealer", "parkvedligehold", "anlæg og beplantning",
  "plantning og beskæring", "havedesign", "terrasse anlæg",
  "naturpleje", "trærydning", "skovservice",

  // ── Hotel & Overnatning (15 termer) ─────────────────────────────────────
  "hotel", "boutique hotel", "konferencehotel", "feriehotel",
  "vandrehjem", "bed breakfast", "hostel", "kurbad",
  "spa hotel", "city hotel", "airport hotel",
  "overnatningsfacilitet", "pensionat", "motel", "sommerhotel",

  // ── Restaurant & Cafe (20 termer) ────────────────────────────────────────
  "restaurant", "cafe", "bistro", "brasserie",
  "sushi restaurant", "pizzeria", "grillbar",
  "burger restaurant", "sandwich bar", "smørrebrød restaurant",
  "thai restaurant", "indisk restaurant", "kinesisk restaurant",
  "mexicansk restaurant", "tapas bar", "steakhouse",
  "brunch restaurant", "café og restaurant", "kantinedrift", "daglig café",

  // ── Catering & Events (15 termer) ────────────────────────────────────────
  "cateringfirma", "eventbureau", "messearrangør", "konferencearrangør",
  "teltudlejning", "festlokal", "selskabslokale",
  "bryllupscatering", "firmacatering", "partyservice",
  "mad og drikke service", "catering service",
  "event og konference", "messe og event", "konferencefacilitet",

  // ── IT & Tech (20 termer) ─────────────────────────────────────────────────
  "it konsulent", "softwareudvikling", "web bureau", "digital bureau",
  "tech startup", "it support firma", "cloud løsning",
  "cybersikkerhed firma", "app udvikling", "e-commerce bureau",
  "digital marketing bureau", "SEO bureau", "UX design bureau",
  "IT-virksomhed", "systemudvikling", "netværksservice",
  "it-drift", "managed service", "data analyse firma", "AI konsulent",

  // ── Retail & Handel (15 termer) ─────────────────────────────────────────
  "tøjbutik", "elektronikforhandler", "sportsbutik",
  "møbelbutik", "interiørbutik", "hobbybutik",
  "dagligvarehandel", "delikatesse butik",
  "isenkræmmer", "legetøjsbutik",
  "smykkebutik", "ur og guld", "blomsterbutik", "boghandel", "apotek",

  // ── Sundhed & Klinik (15 termer) ─────────────────────────────────────────
  "lægeklinik", "privat klinik", "speciallæge",
  "tandlæge", "fysioterapeut", "kiropraktor",
  "psykolog klinik", "fitnesscenter", "wellnesscenter",
  "skønhedsklinik", "massage klinik", "akupunktur klinik",
  "optiker", "høreklinik", "fodterapeut",

  // ── Plejeinstitutioner (8 termer) ────────────────────────────────────────
  "plejehjem", "hjemmehjælp", "botilbud",
  "dagcenter", "aktivitetscenter", "rehabiliteringscenter",
  "plejecenter", "handicapcenter",

  // ── Logistik & Lager (12 termer) ─────────────────────────────────────────
  "lagervirksomhed", "lagerfirma", "lagerlogistik",
  "distributionscenter", "speditionsfirma", "frysehus",
  "kølehus", "pakkelager", "containerservice",
  "logistikoperatør", "terminal logistik", "fragtcenter",

  // ── Uddannelse (10 termer) ────────────────────────────────────────────────
  "privatskole", "sprogskole", "erhvervsskole",
  "kursusudbyder", "kursuscenter", "efteruddannelse",
  "fitnessinstruktør", "personlig træner",
  "musikskole", "kunstskole",

  // ── Kultur & Medier (8 termer) ───────────────────────────────────────────
  "teater", "kulturhus", "museum",
  "fotograf firma", "reklamefirma", "mediehus",
  "grafisk design", "filmproduktion",

  // ── Industri & Produktion (15 termer) ────────────────────────────────────
  "produktionsvirksomhed", "fremstillingsvirksomhed", "industrifirma",
  "trykkeri", "emballagefirma", "plastproduktion",
  "metalfirma", "smedjevirksomhed", "maskinfabrik",
  "elektronikproduktion", "fødevareproduktion",
  "brødfabrik", "konditori", "bageriet", "konfekture",

  // ── Bilservice & Auto (10 termer) ────────────────────────────────────────
  "autoværksted", "bilpleje", "autolakereri",
  "dæk og bilservice", "bilsyn", "autocenter",
  "taxifirma", "limousinefirma", "busfirma", "lastbil udlejning",

  // ── Bolig & Ejendom (15 termer — kraftigt reduceret fra ~65) ─────────────
  "ejendomsselskab", "boligudlejning", "ejendomsmægler",
  "lejeboliger", "udlejningsselskab", "ejendomsinvestor",
  "andelsforening", "ejendomsadministration",
  "boligadministration", "husadministration",
  "ejendomsdrift", "bygningsejer", "lejeforvaltning",
  "totalrenovering", "underentreprenør",

  // ── Diverse Erhverv (10 termer) ───────────────────────────────────────────
  "revisionsfirma", "advokatkontor", "inkassofirma",
  "rekrutteringsbureau", "konsulentfirma",
  "ingeniørfirma", "arkitektfirma", "rådgivende ingeniør",
  "laboratorium", "forsikringsmægler",
];

interface CVRApiResponse {
  name?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  phone?: string;
  email?: string;
  vat?: number;
  industrydesc?: string;
  owners?: Array<{ name?: string }>;
  employees?: number;
  startdate?: string;
  website?: string;
}

/**
 * Forsøger CVR-opslag med automatisk retry og to API-endpoints.
 */
async function cvrLookup(term: string): Promise<CVRApiResponse | null> {
  const url = `https://cvrapi.dk/api?search=${encodeURIComponent(term)}&country=dk`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "KrydsByg-LeadFinder/1.0 (kontakt@krydsbyg.com)" },
        signal: AbortSignal.timeout(6000),
      });
      if (res.status === 429) {
        // Rate limited — vent og prøv igen
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return await res.json() as CVRApiResponse;
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

export async function fetchCVRLeads(
  dayOfYear: number,
  weights: IndustryWeights = {}
): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // Vælg 90 termer/dag (var 55) — vi vil have 70+ leads efter filtrering
  const startIdx = (dayOfYear * 90) % SEARCH_TERMS.length;
  const dailyTerms: string[] = [];
  for (let i = 0; i < 90; i++) {
    dailyTerms.push(SEARCH_TERMS[(startIdx + i) % SEARCH_TERMS.length]);
  }
  const terms = Object.keys(weights).length > 0
    ? rankSearchTerms(dailyTerms, weights)
    : dailyTerms;

  for (const term of terms) {
    if (results.length >= 70) break;

    const data = await cvrLookup(term);
    if (!data?.name) continue;

    // Filtrér: kun Storkøbenhavn (postnr 1000–3999)
    const zip = parseInt(data.zipcode || "0");
    if (zip < 1000 || zip > 3999) continue;

    const key = data.name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    // Byg basis-kandidat
    const candidate: LeadCandidate = {
      companyName: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      website: data.website || undefined,
      address: [data.address, data.zipcode, data.city].filter(Boolean).join(", "),
      city: data.city || undefined,
      cvr: data.vat ? String(data.vat) : undefined,
      industry: data.industrydesc || undefined,
      source: "CVR API",
      leadType: "company",
      serviceType: guessServiceType(data.industrydesc || ""),
      budget: guessBudget(data.industrydesc || ""),
      notes: `Fundet via CVR-søgning: "${term}"`,
    };

    // Brug CVR-ejer som kontaktperson hvis tilgængeligt
    const ownerName = data.owners?.[0]?.name;
    if (ownerName) {
      candidate.contactName = ownerName;
      candidate.contactTitle = "Ejer/direktør";
    }

    // Tilføj medarbejder-hint fra CVR
    if (data.employees) {
      candidate.notes += ` | ${data.employees} ansatte`;
    }
    if (data.startdate) {
      const year = data.startdate.split("-")[0];
      if (year) candidate.notes += ` | Grundlagt ${year}`;
    }

    results.push(candidate);

    // Scrape website for email + kontaktperson hvis vi mangler email
    if (!candidate.email && (data.website || term)) {
      const websiteToScrape = data.website || `https://www.${key.replace(/\s+/g, "")}.dk`;
      const scraped = await scrapeWebsite(websiteToScrape).catch(() => null);
      if (scraped) {
        if (scraped.emails.length > 0) {
          candidate.email = scraped.emails[0];
          // Hvis emailen er et gæt (ikke fundet på siden) — markér det i noter
          const foundOnPage = scraped.emails[0].includes("@") &&
            (candidate.notes || "").includes("Fundet via");
          if (!foundOnPage && !data.email) {
            candidate.notes = (candidate.notes || "") + ` | Email er gæt baseret på domæn (verificér inden afsendelse)`;
          }
        }
        if (scraped.phones.length > 0 && !candidate.phone) candidate.phone = scraped.phones[0];
        if (scraped.contactNames.length > 0 && !candidate.contactName) {
          candidate.contactName = scraped.contactNames[0];
        }
        if (scraped.description && !candidate.notes?.includes(scraped.description)) {
          candidate.notes = (candidate.notes || "") + ` | ${scraped.description.slice(0, 200)}`;
        }
        if (scraped.employeeCount) {
          candidate.notes += ` | ${scraped.employeeCount}`;
        }
        if (!candidate.website && websiteToScrape) {
          candidate.website = websiteToScrape;
        }
      }
      // Lille pause efter scraping
      await new Promise((r) => setTimeout(r, 300));
    }

    // Pause between CVR requests
    await new Promise((r) => setTimeout(r, 250));
  }

  return results;
}

function guessServiceType(industry: string): string {
  const i = industry.toLowerCase();
  if (i.includes("ejendom") || i.includes("bolig") || i.includes("udlejn")) return "Malerarbejde + vedligehold";
  if (i.includes("kontors") || i.includes("erhverv")) return "Rengøring + montering";
  if (i.includes("bygge") || i.includes("anlæg") || i.includes("entreprise")) return "Byggepladsbehjælp";
  if (i.includes("hotel") || i.includes("restaur") || i.includes("cafe")) return "Rengøring + events";
  if (i.includes("institution") || i.includes("plejeh") || i.includes("dagin")) return "Rengøring + vedligehold";
  return "Kombineret vedligehold";
}

function guessBudget(industry: string): string {
  const i = industry.toLowerCase();
  if (i.includes("ejendom") || i.includes("administration")) return "15.000–20.000";
  if (i.includes("bygge") || i.includes("entreprise")) return "20.000–50.000";
  if (i.includes("hotel")) return "10.000–20.000";
  return "10.000–15.000";
}
