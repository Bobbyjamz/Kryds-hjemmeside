import type { LeadCandidate } from "../types";

// Søgeforespørgsler — roterer så vi får nye resultater hver dag
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

export async function fetchGooglePlacesLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return []; // Springer over hvis ingen API nøgle

  const results: LeadCandidate[] = [];

  // 3 forskellige søgninger per dag — roterer dagligt
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

      for (const place of data.results || []) {
        const addressParts = place.formatted_address.split(",");
        const city = addressParts[addressParts.length - 2]?.trim() || "København";

        results.push({
          companyName: place.name,
          address: place.formatted_address,
          city,
          source: "Google Places",
          leadType: "company",
          serviceType: "Malerarbejde + facility services",
          notes: `Fundet via Google Places: "${query}"`,
        });
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch {
      continue;
    }
  }

  return results;
}
