/**
 * Boliga-kilde — finder boliger TIL SALG nu (modsat Boligsiden = nyligt solgt).
 *
 * Logik: Boligsælgere har ofte behov for opfriskning før salg:
 *   - Maling af vægge og lofter
 *   - Oprydning af kælder/loft
 *   - Mindre håndværk og småreparationer
 *   - Boligstaging-rengøring
 *
 * Dette er en helt anden målgruppe end "nyligt solgte" (= købere).
 *
 * Kilde: api.boliga.dk (gratis, offentlig).
 */

import type { LeadCandidate } from "../types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const KBH_ZIPS_LISTINGS = [
  "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900",
  "2000", "2100", "2200", "2300", "2400", "2450", "2500", "2600", "2700", "2720",
  "2730", "2750", "2800", "2820", "2900", "2920",
];

interface BoligaListing {
  street?: string;
  zipCode?: string;
  city?: string;
  price?: number;
  daysOnMarket?: number;
  propertyType?: string;
  housingArea?: number;
  rooms?: number;
  energyClass?: string;
}

export async function fetchBoligaListings(dayOfYear: number): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 8 postnumre per dag — fokus på dem med længst tid på markedet (mest tilbøjelige til opfriskning)
  const startIdx = (dayOfYear * 8) % KBH_ZIPS_LISTINGS.length;
  const todayZips = KBH_ZIPS_LISTINGS.slice(startIdx, startIdx + 8);

  await Promise.allSettled(
    todayZips.map(async (zip) => {
      const listings = await fetchActiveListings(zip);

      // Sortér efter længst tid på markedet — de "trænger" mest til hjælp
      const stale = listings
        .filter((l) => (l.daysOnMarket || 0) > 30)
        .slice(0, 4);

      for (const listing of stale) {
        if (results.length >= 30) return;
        if (!listing.street) continue;

        const fullAddress = `${listing.street}, ${listing.zipCode || zip} ${listing.city || ""}`.trim();
        const key = fullAddress.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const days = listing.daysOnMarket || 0;
        const priceStr = listing.price
          ? `${(listing.price / 1_000_000).toFixed(1)}M kr.`
          : "ukendt pris";

        results.push({
          companyName: fullAddress,
          address: fullAddress,
          city: listing.city || `Postnr. ${zip}`,
          source: "Boliga (til salg)",
          leadType: "private",
          propertyType: listing.propertyType || "bolig",
          salePrice: listing.price,
          serviceType: "Malerarbejde + oprydning + opfriskning før salg",
          budget: "10.000–25.000",
          notes: `Bolig til salg ${days} dage (${priceStr})${listing.housingArea ? `, ${listing.housingArea} m²` : ""}. Sælger har sandsynligvis brug for opfriskning, malerarbejde eller oprydning for at fremstå bedre. KrydsByg kan tilbyde "salgsklar"-pakke: vægge malet, fællesarealer ryddet, småreparationer fixet på 2-3 dage.`,
        });
      }
    })
  );

  return results;
}

async function fetchActiveListings(zip: string): Promise<BoligaListing[]> {
  for (const url of [
    `https://api.boliga.dk/api/v2/search/results?zipCodes=${zip}&pageSize=20&sort=daysForSale-desc`,
    `https://www.boliga.dk/api/v2/search/results?zipCodes=${zip}&pageSize=20&sort=daysForSale-desc`,
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
      const data = await res.json() as { results?: BoligaListing[] } | BoligaListing[];

      if (Array.isArray(data)) return data;
      if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
    } catch {
      // Prøv næste endpoint
    }
  }

  return [];
}
