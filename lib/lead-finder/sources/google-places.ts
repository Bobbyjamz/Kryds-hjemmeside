/**
 * Google Places API — PRIMÆR firma-kilde efter cvrapi.dk blev IP-blokeret.
 *
 * Strategi:
 *   - 80+ diverse søgeforespørgsler fordelt på 16 brancher × flere KBH-områder
 *   - 14 søgninger per dag (roterer dagligt = ~6 dages cyklus)
 *   - Hver søgning: op til 15 resultater + Details-opslag for telefon/website
 *   - Total: op til 200 firma-leads/dag
 *
 * Pris (Google Cloud — $200 gratis kredit/md):
 *   - Text Search: $32 / 1000 = 14 kald = $0.45/dag = $13/md
 *   - Place Details (Contact): $17 / 1000 = ~150 kald = $2.55/dag = $76/md
 *   - Total: ~$90/md = inden for $200 gratis kredit
 */

import type { LeadCandidate } from "../types";

const SEARCH_QUERIES = [
  // ── Hoteller (rengøring + vedligehold) ────────────────────────────────────
  "hotel København", "hotel Frederiksberg", "hotel Lyngby",
  "boutique hotel Copenhagen", "konferencehotel København",
  "vandrehjem København", "B&B København", "feriehotel Storkøbenhavn",

  // ── Restauranter & cafeer (rengøring, events) ─────────────────────────────
  "restaurant København city", "restaurant Vesterbro", "restaurant Østerbro",
  "restaurant Nørrebro", "restaurant Frederiksberg", "café København",
  "bistro København", "pizzeria København", "fine dining Copenhagen",
  "tapas restaurant København",

  // ── Eventbureauer & konferencecentre ──────────────────────────────────────
  "eventbureau København", "konferencecenter København", "messecenter København",
  "festlokale København", "selskabslokale København", "kongrescenter København",

  // ── Plejehjem & institutioner ─────────────────────────────────────────────
  "plejehjem København", "plejecenter Frederiksberg", "dagcenter København",
  "private skole København", "børnehave Frederiksberg",
  "rehabiliteringscenter Storkøbenhavn",

  // ── Klinikker & sundhed ───────────────────────────────────────────────────
  "tandlæge København", "lægeklinik København", "fysioterapi København",
  "fitnesscenter København", "wellnesscenter Frederiksberg",
  "kiropraktor København", "skønhedsklinik København",

  // ── Erhvervsejendomme & administratorer ───────────────────────────────────
  "ejendomsadministration København", "facility management København",
  "ejendomsservice Storkøbenhavn", "vicevært firma København",
  "boligadministration København", "property management Copenhagen",

  // ── Byggefirmaer (kunne bruge ekstra hænder) ──────────────────────────────
  "byggefirma København", "tømrerfirma København", "malerfirma København",
  "VVS firma København", "elektriker København", "anlægsgartner København",
  "murerfirma København", "renoveringsfirma København",

  // ── Rengøringsfirmaer (subcontract) ───────────────────────────────────────
  "rengøringsfirma København", "kontorrengøring København",
  "erhvervsrengøring København", "industrirengøring København",

  // ── Logistik, lager & flytning ────────────────────────────────────────────
  "flyttefirma København", "lager logistik København",
  "speditionsfirma København", "transportfirma København",

  // ── Retail & butikker ─────────────────────────────────────────────────────
  "møbelbutik København", "tøjbutik København city",
  "elektronikforhandler København", "boghandel København",

  // ── Kontorhuse & coworking ────────────────────────────────────────────────
  "kontorhotel København", "coworking København",
  "advokatkontor København", "revisor København", "konsulentfirma København",

  // ── Nordkøbenhavn ─────────────────────────────────────────────────────────
  "facility management Lyngby", "ejendomsservice Gentofte",
  "hotel Charlottenlund", "restaurant Hellerup",
  "byggefirma Lyngby",

  // ── Vestkøbenhavn ─────────────────────────────────────────────────────────
  "ejendomsadministration Glostrup", "facility services Brøndby",
  "byggefirma Rødovre", "rengøringsfirma Albertslund",

  // ── Sydkøbenhavn ──────────────────────────────────────────────────────────
  "rengøringsfirma Hvidovre", "ejendomsservice Vallensbæk",
  "facility Tårnby", "byggefirma Greve",

  // ── IT & software ─────────────────────────────────────────────────────────
  "softwarevirksomhed København", "tech startup København",
  "IT firma København", "digital bureau København",

  // ── Industri & produktion ─────────────────────────────────────────────────
  "produktionsvirksomhed Storkøbenhavn", "trykkeri København",
  "værksted København", "fabrik København",

  // ── Bilservice ────────────────────────────────────────────────────────────
  "autoværksted København", "bilforhandler København",
];

interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

interface PlacesTextResponse {
  results: PlaceResult[];
  status: string;
  error_message?: string;
  next_page_token?: string;
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
  if (!apiKey) {
    console.warn("[google-places] GOOGLE_PLACES_API_KEY mangler — kilde springes over");
    return [];
  }

  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // 14 søgninger per dag (var 6) — roterer (~6 dages cyklus over 80 termer)
  const queries = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((offset) =>
    SEARCH_QUERIES[(dayOfYear + offset) % SEARCH_QUERIES.length]
  );

  for (const query of queries) {
    if (results.length >= 100) break; // safety cap

    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(query)}&language=da&region=dk&key=${apiKey}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        console.warn(`[google-places] HTTP ${res.status} for "${query}"`);
        continue;
      }

      const data: PlacesTextResponse = await res.json();

      // Tjek for fejl
      if (data.status === "REQUEST_DENIED") {
        console.error(`[google-places] REQUEST_DENIED: ${data.error_message || "API key invalid"}`);
        return []; // Stop helt hvis nøglen er ugyldig
      }
      if (data.status === "OVER_QUERY_LIMIT") {
        console.error(`[google-places] Over kvote — stopper`);
        return results;
      }
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.warn(`[google-places] Status ${data.status} for "${query}"`);
        continue;
      }

      // Hent op til 15 resultater per søgning
      for (const place of (data.results || []).slice(0, 15)) {
        if (results.length >= 100) break;

        const key = place.place_id || place.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        // Skip lukkede virksomheder
        if (place.business_status === "CLOSED_PERMANENTLY") continue;

        const addressParts = place.formatted_address.split(",");
        const city = addressParts[addressParts.length - 2]?.trim() || "København";

        const candidate: LeadCandidate = {
          companyName: place.name,
          address: place.formatted_address,
          city,
          source: "Google Places",
          leadType: "company",
          serviceType: guessServiceType(query),
          notes: `Fundet via Google Places søgning: "${query}"${place.rating ? ` · ${place.rating}★ (${place.user_ratings_total || 0} anmeldelser)` : ""}`,
        };

        // Hent Details for telefon + website
        try {
          const detailsUrl =
            `https://maps.googleapis.com/maps/api/place/details/json` +
            `?place_id=${place.place_id}` +
            `&fields=name,formatted_phone_number,international_phone_number,website` +
            `&language=da&key=${apiKey}`;

          const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(6000) });
          if (detailsRes.ok) {
            const details: PlacesDetailsResponse = await detailsRes.json();
            if (details.status === "OK" && details.result) {
              const d = details.result;
              if (d.formatted_phone_number) {
                candidate.phone = d.formatted_phone_number.replace(/\s+/g, " ").trim();
              }
              if (d.website) candidate.website = d.website;
            }
          }
          await new Promise((r) => setTimeout(r, 150));
        } catch { /* fortsæt med basis-data */ }

        results.push(candidate);
      }

      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      console.warn(`[google-places] Fejl for "${query}":`, err instanceof Error ? err.message : err);
      continue;
    }
  }

  console.log(`[google-places] Returnerer ${results.length} leads fra ${queries.length} søgninger`);
  return results;
}

/** Mapper søgeforespørgsel → KrydsByg's serviceområde */
function guessServiceType(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("hotel") || q.includes("restaurant") || q.includes("café")) return "Rengøring + events";
  if (q.includes("event") || q.includes("messe") || q.includes("konference")) return "Events & Scener";
  if (q.includes("plejehjem") || q.includes("skole") || q.includes("dagcenter") || q.includes("børnehave")) return "Rengøring + vedligehold";
  if (q.includes("klinik") || q.includes("tandlæge") || q.includes("læge") || q.includes("fysioterapi")) return "Rengøring & Oprydning";
  if (q.includes("ejendoms") || q.includes("facility") || q.includes("vicevært") || q.includes("bolig")) return "Maling + vedligehold";
  if (q.includes("malerfirma")) return "Maling & Spartling";
  if (q.includes("tømrer") || q.includes("murer") || q.includes("vvs") || q.includes("elektriker")) return "Mindre Håndværk";
  if (q.includes("byggefirma") || q.includes("renoveringsfirma")) return "Byggepladsbehjælp";
  if (q.includes("rengøring")) return "Rengøring & Oprydning";
  if (q.includes("flytte") || q.includes("transport") || q.includes("logistik") || q.includes("lager") || q.includes("spedition")) return "Flytning & Transport";
  if (q.includes("anlægsgartner")) return "Have & Anlæg";
  if (q.includes("butik") || q.includes("forhandler") || q.includes("boghandel")) return "Montering & Samling";
  if (q.includes("kontor") || q.includes("coworking") || q.includes("advokat") || q.includes("revisor") || q.includes("konsulent")) return "Rengøring + montering";
  if (q.includes("software") || q.includes("tech") || q.includes("it ") || q.includes("digital")) return "Rengøring + montering";
  if (q.includes("produktion") || q.includes("trykkeri") || q.includes("fabrik") || q.includes("værksted")) return "Industrirengøring + facility";
  if (q.includes("auto")) return "Industrirengøring + facility";
  return "Kombineret vedligehold";
}
