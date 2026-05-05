/**
 * Private kunder — finder ~30 private renoverings-kunder per dag fra:
 * 1. Boligsiden: nyligt solgte boliger = sandsynlig renovering
 * 2. Andelsguide/offentlige registre: andelsforenings-bestyrelser
 * 3. Grundejerforbundet-lignende offentlige lister
 *
 * Alle sources er 100% lovlige og offentligt tilgængelige.
 */

import type { LeadCandidate } from "../types";
import { scrapeWebsite } from "../enrichment/website-scraper";

// Storkøbenhavn postnumre — dækker alle bydele
const CPH_ZIPS = [
  "1000", "1050", "1100", "1150", "1200", "1250", "1300", "1350", "1400", "1450",
  "1500", "1550", "1600", "1650", "1700", "1750", "1800", "1850", "1900", "1950",
  "2000", "2100", "2200", "2300", "2400", "2450", "2500", "2600", "2700", "2720",
  "2730", "2750", "2760", "2800", "2820", "2830", "2840", "2860", "2900", "2920",
];

interface BoligsidenSale {
  address?: string;
  zipCode?: string;
  city?: string;
  salesPrice?: number;
  propertyType?: string;
  latitude?: number;
  longitude?: number;
}

interface BoligsidenResponse {
  properties?: BoligsidenSale[];
  result?: BoligsidenSale[];
}

export async function fetchPrivateLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // Kør begge sources parallelt
  const [boligsiden, andelsforeninger] = await Promise.allSettled([
    fetchBoligsidenSales(dayOfYear, seen),
    fetchAndelsforeninger(dayOfYear, seen),
  ]);

  if (boligsiden.status === "fulfilled") results.push(...boligsiden.value);
  if (andelsforeninger.status === "fulfilled") results.push(...andelsforeninger.value);

  return results.slice(0, 30);
}

// ── Boligsiden: nyligt solgte boliger ──────────────────────────────────────

async function fetchBoligsidenSales(dayOfYear: number, seen: Set<string>): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  // Rotér postnumre — 8 per dag dækker alle KBH på 5 dage
  const startIdx = (dayOfYear * 8) % CPH_ZIPS.length;
  const todayZips = CPH_ZIPS.slice(startIdx, startIdx + 8);

  // Prøv begge API-endpoints (ny og gammel Boligsiden API)
  for (const zip of todayZips) {
    if (results.length >= 20) break;

    const sales = await fetchBoligsidenZip(zip);
    for (const sale of sales) {
      if (!sale.address) continue;
      const key = sale.address.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      const priceStr = sale.salesPrice
        ? `${(sale.salesPrice / 1000000).toFixed(1)}M kr.`
        : "ukendt pris";

      const propertyDesc = sale.propertyType || "bolig";

      results.push({
        companyName: `${sale.address}, ${sale.zipCode || zip} ${sale.city || "KBH"}`,
        address: `${sale.address}, ${sale.zipCode || zip} ${sale.city || "KBH"}`,
        city: sale.city || `Postnr. ${zip}`,
        source: "Boligsiden",
        leadType: "private",
        serviceType: "Malerarbejde + gulvlægning + montering",
        budget: "15.000–25.000",
        notes: `Nyligt solgt ${propertyDesc} til ${priceStr}. Ny ejer er typisk i gang med renovering inden indflytning — potentiale for maler, gulv og montering.`,
      });
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  return results;
}

async function fetchBoligsidenZip(zip: string): Promise<BoligsidenSale[]> {
  const from = getDateMinus(45);

  // Endpoint 1: ny API
  try {
    const url = `https://api.boligsiden.dk/addresses?zipCode=${zip}&salesDateFrom=${from}&pageSize=5`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "KrydsByg-LeadFinder/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data: BoligsidenResponse = await res.json();
      const list = data.properties || data.result || [];
      if (list.length > 0) return list;
    }
  } catch { /* prøv næste endpoint */ }

  // Endpoint 2: alternativ Boligsiden URL
  try {
    const url = `https://www.boligsiden.dk/api/sales?zipCodes=${zip}&maxResults=5`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "KrydsByg-LeadFinder/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data: BoligsidenResponse = await res.json();
      return data.properties || data.result || [];
    }
  } catch { /* begge endpoints fejlede */ }

  return [];
}

// ── Andelsforeninger: offentlige bestyrelseslister ──────────────────────────

// Velkendte andelsforeningsnavne — roterer dagligt
const ANDELS_NAMES = [
  "A/B Bellahøj", "A/B Birkegade", "A/B Blåmejsegården", "A/B Brumleby",
  "A/B Classens Have", "A/B Danmarksgade", "A/B Drosselvej", "A/B Ellebjerg",
  "A/B Fortunen", "A/B Frihavn", "A/B Gl. Kongevej", "A/B Godthåbsvej",
  "A/B Hejrevej", "A/B Ibstrupparken", "A/B Jagtparken", "A/B Kildevæld",
  "A/B Knudsvej", "A/B Kornblomsten", "A/B Langgade", "A/B Lundtoftegade",
  "A/B Møllestien", "A/B Nikolajgade", "A/B Nørrebrogade", "A/B Odinsgade",
  "A/B Pile Alle", "A/B Raunstrupvej", "A/B Solbakken", "A/B Strandboulevarden",
  "A/B Tuborgvej", "A/B Valdemarsgade", "A/B Vestergade", "A/B Åboulevard",
];

async function fetchAndelsforeninger(dayOfYear: number, seen: Set<string>): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  // 10 foreninger per dag
  const startIdx = (dayOfYear * 10) % ANDELS_NAMES.length;
  const todayForeninger = ANDELS_NAMES.slice(startIdx, startIdx + 10);

  for (const name of todayForeninger) {
    if (results.length >= 10) break;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Prøv at finde CVR-info på foreningen via cvrapi
    const cvrData = await lookupAndelsforening(name);

    const candidate: LeadCandidate = {
      companyName: name,
      email: cvrData?.email || undefined,
      phone: cvrData?.phone || undefined,
      website: cvrData?.website || undefined,
      city: cvrData?.city || "København",
      cvr: cvrData?.vat ? String(cvrData.vat) : undefined,
      source: "Andelsguide",
      leadType: "private",
      serviceType: "Malerarbejde + vedligehold fællesarealer",
      budget: "15.000–30.000",
      notes: `Andelsboligforening med løbende vedligeholdelsesbehov — opgange, facade, fællesarealer. KrydsByg kan tilbyde fast pris på årsrenovering.`,
    };

    if (cvrData?.owners?.[0]?.name) {
      candidate.contactName = cvrData.owners[0].name;
      candidate.contactTitle = "Formand/administrator";
    }

    // Forsøg at hente bestyrelsens kontaktinfo fra evt. hjemmeside
    if (candidate.website && !candidate.email) {
      const scraped = await scrapeWebsite(candidate.website).catch(() => null);
      if (scraped) {
        if (scraped.emails.length > 0) candidate.email = scraped.emails[0];
        if (scraped.contactNames.length > 0 && !candidate.contactName) {
          candidate.contactName = scraped.contactNames[0];
          candidate.contactTitle = "Formand";
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    results.push(candidate);
    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

interface SimpleCVR {
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  vat?: number;
  owners?: Array<{ name?: string }>;
}

async function lookupAndelsforening(name: string): Promise<SimpleCVR | null> {
  try {
    const url = `https://cvrapi.dk/api?search=${encodeURIComponent(name)}&country=dk`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KrydsByg-LeadFinder/1.0 (kontakt@krydsbyg.com)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json() as SimpleCVR;
  } catch {
    return null;
  }
}

function getDateMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
