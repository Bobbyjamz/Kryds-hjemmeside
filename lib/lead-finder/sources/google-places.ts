import type { LeadCandidate } from "../types";

const SEARCH_QUERIES = [
  "ejendomsadministration København",
  "facility management Copenhagen",
  "andelsboligforening administrator København",
  "ejendomsservice Frederiksberg",
  "property management Copenhagen",
  "bygningsservice København",
  "ejendomsinspektør København",
  "vicevært firma Storkøbenhavn",
  "rengøringsselskab erhverv København",
  "malervirksomhed Frederiksberg",
  "gulvlægger firma København",
  "håndværkerservice Copenhagen",
  "ejendomsdrift Gentofte",
  "boligadministration Amager",
  "facility services Lyngby",
];

interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
}

interface PlacesTextResponse {
  results: PlaceResult[];
  status: string;
}

interface PlaceDetails {
  name?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  formatted_address?: string;
}

interface PlacesDetailsResponse {
  result?: PlaceDetails;
  status: string;
}

export async function fetchGooglePlacesLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const results: LeadCandidate[] = [];
  const queries = [0, 1, 2].map((offset) =>
    SEARCH_QUERIES[(dayOfYear + offset) % SEARCH_QUERIES.length]
  );

  for (const query of queries) {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(query)}&language=da&region=dk&key=${apiKey}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;

      const data: PlacesTextResponse = await res.json();
      if (data.status !== "OK") continue;

      // Hent Details for de første 5 resultater (telefon + website)
      for (const place of data.results.slice(0, 5)) {
        const addressParts = place.formatted_address.split(",");
        const city = addressParts[addressParts.length - 2]?.trim() || "København";

        const candidate: LeadCandidate = {
          companyName: place.name,
          address: place.formatted_address,
          city,
          source: "Google Places",
          leadType: "company",
          serviceType: "Malerarbejde + facility services",
          notes: `Fundet via Google Places: "${query}"`,
        };

        // Hent Details API for telefon og website
        try {
          const detailsUrl =
            `https://maps.googleapis.com/maps/api/place/details/json` +
            `?place_id=${place.place_id}&fields=name,formatted_phone_number,international_phone_number,website&language=da&key=${apiKey}`;

          const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(6000) });
          if (detailsRes.ok) {
            const details: PlacesDetailsResponse = await detailsRes.json();
            if (details.status === "OK" && details.result) {
              const d = details.result;
              if (d.formatted_phone_number) {
                // Normaliser til dansk 8-cifret format
                candidate.phone = d.formatted_phone_number.replace(/\s/g, " ").trim();
              }
              if (d.website) candidate.website = d.website;
            }
          }
          await new Promise((r) => setTimeout(r, 200));
        } catch { /* Details-opslag fejlede — fortsæt med basis-data */ }

        results.push(candidate);
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch {
      continue;
    }
  }

  return results;
}
