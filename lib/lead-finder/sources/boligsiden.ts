import type { LeadCandidate } from "../types";

// Boligsiden: nyligt solgte boliger = potentielle renoveringskunder
// Bruger Boligsidens offentlige søge-API

interface BoligsidenSale {
  address?: string;
  zipCode?: string;
  city?: string;
  salesPrice?: number;
  propertyType?: string;
}

interface BoligsidenResponse {
  properties?: BoligsidenSale[];
}

export async function fetchBoligsidenLeads(): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  // KBH postnumre — roterer for at dække hele området
  const postalCodes = ["1000", "1500", "2000", "2100", "2200", "2300", "2400", "2500", "2600", "2700", "2800", "2900"];

  for (const zip of postalCodes.slice(0, 4)) {
    try {
      // Boligsiden offentlig API for nyligt solgte
      const url = `https://api.boligsiden.dk/addresses?zipCode=${zip}&salesDateFrom=${getDateMinus(30)}&pageSize=5`;
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "KrydsByg-LeadFinder/1.0",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;
      const data: BoligsidenResponse = await res.json();

      for (const property of data.properties || []) {
        if (!property.address) continue;

        results.push({
          companyName: `Privat ejer — ${property.address}`,
          address: property.address,
          city: property.city || `Postnr. ${zip}`,
          source: "Boligsiden (nyligt solgt)",
          serviceType: "Malerarbejde + gulvlægning",
          notes: `Nyligt købt bolig — typisk i gang med renovering. Salgspris: ${property.salesPrice ? (property.salesPrice / 1000000).toFixed(1) + "M" : "ukendt"}`,
        });
      }

      await new Promise((r) => setTimeout(r, 400));
    } catch {
      continue;
    }
  }

  return results;
}

function getDateMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
