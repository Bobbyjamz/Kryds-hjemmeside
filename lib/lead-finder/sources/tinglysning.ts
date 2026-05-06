/**
 * Tinglysning-kilde — finder boliger med nyligt registrerede pant/lån.
 *
 * Logik: Når en privatperson optager nyt pant i sin bolig, er det ofte
 * fordi de skal renovere/ombygge. Det er et stærkt indirekte signal for
 * private leads til håndværker-services.
 *
 * Kilde: Boliga.dk udstiller offentligt tilgængelige Tinglysning-data
 * (gratis, ingen API-key nødvendig).
 *
 * Strategi: Søg på recent ejendomshandler (proxy for renovering) i KBH-zoner.
 */

import type { LeadCandidate } from "../types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Postnumre som proxy for "tinglyste handler i KBH" — rotér 6 om dagen
const KBH_AREAS = [
  { zip: "1050", area: "indre-by" },
  { zip: "1300", area: "indre-by" },
  { zip: "1450", area: "indre-by" },
  { zip: "1600", area: "vesterbro" },
  { zip: "1700", area: "vesterbro" },
  { zip: "1800", area: "frederiksberg" },
  { zip: "2000", area: "frederiksberg" },
  { zip: "2100", area: "østerbro" },
  { zip: "2200", area: "nørrebro" },
  { zip: "2300", area: "amager" },
  { zip: "2400", area: "nordvest" },
  { zip: "2450", area: "sydhavn" },
  { zip: "2500", area: "valby" },
  { zip: "2600", area: "glostrup" },
  { zip: "2700", area: "brønshøj" },
  { zip: "2720", area: "vanløse" },
  { zip: "2730", area: "herlev" },
  { zip: "2800", area: "lyngby" },
  { zip: "2820", area: "gentofte" },
  { zip: "2900", area: "hellerup" },
];

interface BoligaProperty {
  street?: string;
  zipCode?: string;
  city?: string;
  price?: number;
  registrationDate?: string;
  propertyType?: string;
  housingArea?: number;
  rooms?: number;
}

export async function fetchTinglysningLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 6 postnumre per dag
  const startIdx = (dayOfYear * 6) % KBH_AREAS.length;
  const todayAreas = KBH_AREAS.slice(startIdx, startIdx + 6);

  await Promise.allSettled(
    todayAreas.map(async ({ zip }) => {
      const props = await fetchRecentTrades(zip);
      for (const prop of props.slice(0, 5)) {
        if (results.length >= 30) return;
        if (!prop.street) continue;

        const fullAddress = `${prop.street}, ${prop.zipCode || zip} ${prop.city || ""}`.trim();
        const key = fullAddress.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const priceStr = prop.price
          ? `${(prop.price / 1_000_000).toFixed(1)}M kr.`
          : "ukendt pris";

        results.push({
          companyName: fullAddress,
          address: fullAddress,
          city: prop.city || `Postnr. ${zip}`,
          source: "Tinglysning",
          leadType: "private",
          propertyType: prop.propertyType || "bolig",
          salePrice: prop.price,
          serviceType: "Malerarbejde + montering + renovering",
          budget: prop.price && prop.price > 4_000_000 ? "30.000–60.000" : "15.000–30.000",
          notes: `Tinglyst handel for ${priceStr}${prop.housingArea ? `, ${prop.housingArea} m²` : ""}${prop.rooms ? `, ${prop.rooms} værelser` : ""}. Ny ejer er typisk i gang med renovering inden indflytning — potentiale for maler, gulv og montering.`,
        });
      }
    })
  );

  return results;
}

async function fetchRecentTrades(zip: string): Promise<BoligaProperty[]> {
  // Boliga's public API for solgte ejendomme
  const fromDate = getDateMinus(60);

  for (const url of [
    `https://api.boliga.dk/api/v2/sold/search/results?searchTab=1&zipCodes=${zip}&salesDateMin=${fromDate}&pageSize=10`,
    `https://www.boliga.dk/api/v2/sold/search/results?zipCodes=${zip}&salesDateMin=${fromDate}&pageSize=10`,
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;
      const data = await res.json() as { results?: BoligaProperty[] } | BoligaProperty[];

      if (Array.isArray(data)) return data;
      if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
    } catch {
      // Prøv næste endpoint
    }
  }

  return [];
}

function getDateMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
