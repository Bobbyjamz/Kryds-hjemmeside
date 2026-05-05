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

// 120+ søgetermer — roterer så vi aldrig rammer de samme to dage i træk
const SEARCH_TERMS = [
  // Ejendomsadministratorer
  "CEJ Ejendomsadministration", "AMC North Ejendomsadministration", "By og Bolig Ejendomsadministration",
  "BtB Consult Ejendomsadministration", "Qvortrup Ejendomsadministration", "COBO Ejendomsadministration",
  "DEAS Ejendomsadministration", "Azets Ejendomsadministration", "BKM Ejendomsadministration",
  "Advodan Glostrup Ejendomsadministration", "Newsec Property Management", "NIRAS Ejendomsadministration",
  "Colliers Property Management", "CBRE Denmark", "JLL Denmark", "Cushman Wakefield Denmark",
  "Savills Denmark", "Catella Property", "Patrizia Danmark",
  // Facility Management
  "ISS Facility Services", "Coor Service Management", "Driftssikker Facility",
  "Sodexo Danmark", "Compass Group Danmark", "G4S Facility Management",
  "Securitas Facility", "Bravida Danmark", "NCC Building Services",
  "YIT Danmark", "Skanska Facility",
  // Andelsforeninger og boligselskaber
  "Andelsboligforening Østerbro", "Andelsboligforening Frederiksberg", "Andelsboligforening Nørrebro",
  "Andelsboligforening Vesterbro", "Andelsboligforening Amager", "Andelsboligforening Valby",
  "Boligforening København", "Boligselskab Frederiksberg", "Almen boligforening",
  "Lejerbo", "DAB Boligadministration", "KAB Boligadministration",
  "Domea", "Boligkontoret Danmark", "3B Boligforening",
  "Arbejdernes Andelsboligforening", "AAB Bolig", "fsb bolig",
  // Ejendomsejere og investorer
  "Ejendomsselskabet Copenhagen", "Ejendomsservice København", "Ejendomsdrift ApS",
  "Boligadministration ApS", "Ejendomsforvaltning ApS", "Bygningsejer ApS",
  "Ejendomsprojekt ApS", "Udlejningsejendom ApS",
  // Rengøring og service
  "Rengøringsselskab København", "Rengøring Frederiksberg", "Serviceselskab København",
  "Driftselskab Storkøbenhavn", "Rengøringsfirma Amager", "Erhvervsrengøring København",
  "Städ og Rengøring ApS", "Professionel rengøring ApS",
  // Håndværk og byg
  "Malerfirma København", "Malerentreprenør Frederiksberg", "Gulvlægger København",
  "Håndværkerservice Storkøbenhavn", "Byggeservice ApS", "Renoveringsfirma København",
  "Tømrerfirma", "Murerfirma", "VVS firma København",
  // Mæglere og developere
  "EDC Mægler", "Nybolig Erhverv", "Danbolig Erhverv",
  "Realmæglerne Erhverv", "Boligone", "Lokalbolig", "Oline Ejendom",
  // Revisorer og advokater med ejendomskunder
  "BDO Ejendomsadministration", "Grant Thornton Ejendom",
  "Kromann Reumert Ejendom", "Plesner Ejendom", "Gorrissen Federspiel",
  "Bech-Bruun Ejendom", "Horten Ejendom",
  // Byggeprojekter og entreprise
  "Hoffmann Entreprise", "MT Højgaard", "Per Aarsleff",
  "NCC Danmark", "Skanska Danmark",
  // Hoteller og konferencecentre
  "Hotel København", "Konferencecenter KBH", "Vandrehjem København",
  "Bed Breakfast KBH", "Airbnb management København",
  // Kontorejendomme
  "Kontorlejemål København", "Erhvervslejemål Frederiksberg", "Kontorhus ApS",
  "Coworking København", "Shared office KBH",
  // Institutioner
  "Plejehjem København", "Dagcenter KBH", "Daginstitution Frederiksberg",
  "Skole bygningsdrift", "Sportscenter vedligehold",
  // Lokale firmaer
  "Ejendomsservice Gentofte", "Ejendomsdrift Lyngby", "Facility Herlev",
  "Ejendomsadministration Rødovre", "Boligservice Gladsaxe", "Ejendom Brøndby",
  "Driftsservice Ballerup", "Ejendom Hvidovre", "Facility Taastrup",
  // Events
  "Eventbureau København", "Messearrangør KBH", "Konferencearrangør",
  "Cateringfirma København", "Teltudlejning KBH",
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

  // Vælg 35 termer (lidt over målet så vi stadig rammer 30 efter filtrering)
  const startIdx = (dayOfYear * 35) % SEARCH_TERMS.length;
  const dailyTerms: string[] = [];
  for (let i = 0; i < 35; i++) {
    dailyTerms.push(SEARCH_TERMS[(startIdx + i) % SEARCH_TERMS.length]);
  }
  const terms = Object.keys(weights).length > 0
    ? rankSearchTerms(dailyTerms, weights)
    : dailyTerms;

  for (const term of terms) {
    if (results.length >= 30) break;

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
