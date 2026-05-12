/**
 * OpenStreetMap Overpass API — gratis, ingen login, struktureret data.
 *
 * Returnerer firmaer med navn, telefon, email, website, adresse fra OSM-tagging.
 * Mange håndværkere, malere, byggepladser, rengøringsfirmaer er taggede i OSM
 * og har email tilknyttet deres point/area.
 *
 * Endpoint: https://overpass-api.de/api/interpreter
 * Rate limit: ~10.000 queries/dag (gratis), max 30s per query
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import type { LeadCandidate } from "../types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// OSM tag-kategorier vi leder efter — dækker alle KrydsByg's målgrupper
const OSM_CATEGORIES = [
  // ── Håndværker-firmaer (craft=*) ──────────────────────────────────────
  { tag: "craft", values: ["painter", "carpenter", "electrician", "plumber", "tiler", "roofer", "gardener", "mason", "metal_construction"], serviceType: "Maler/Tømrer/VVS/etc." },
  // ── Bygge-/anlægs-firmaer ─────────────────────────────────────────────
  { tag: "office", values: ["construction_company", "company"], serviceType: "Byggefirma / Entreprenør" },
  { tag: "building", values: ["construction"], serviceType: "Byggeplads / Renovering" },
  // ── Service-firmaer ───────────────────────────────────────────────────
  { tag: "shop", values: ["paint", "hardware", "doityourself", "garden_centre", "building_materials"], serviceType: "Byggemarked / Maling-butik" },
  // ── Plejehjem, hoteller, restauranter (potentielle rengørings-kunder) ─
  { tag: "amenity", values: ["nursing_home", "social_facility"], serviceType: "Plejehjem (rengøring)" },
  { tag: "tourism", values: ["hotel", "guest_house"], serviceType: "Hotel (rengøring + service)" },
  { tag: "amenity", values: ["restaurant", "cafe", "fast_food", "bar"], serviceType: "Restaurant (rengøring + events)" },
  // ── Ejendomsadministrationer & boligforeninger ────────────────────────
  { tag: "office", values: ["estate_agent", "property_management"], serviceType: "Ejendomsadministrator" },
];

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
}

interface OverpassResponse {
  elements?: OsmElement[];
  remark?: string;
}

/** Storkøbenhavn bounding box: south, west, north, east */
const STORKBH_BBOX = "55.55,12.30,55.85,12.75";

export async function fetchOSMLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // Vælg 3 kategorier pr. dag (roterer over 8 kategorier = 3 dages cyklus)
  const todayCategories = [0, 1, 2].map((o) => OSM_CATEGORIES[(dayOfYear + o) % OSM_CATEGORIES.length]);

  for (const category of todayCategories) {
    if (results.length >= 60) break;

    // Byg Overpass-query: hent alle nodes/ways i bbox med matching tags
    const valueRegex = category.values.join("|");
    const query = `
[out:json][timeout:25];
(
  nwr["${category.tag}"~"^(${valueRegex})$"](${STORKBH_BBOX});
);
out center tags;
`;

    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "KrydsByg-LeadFinder/1.0 (kontakt@krydsbyg.com)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(28000),
      });

      if (!res.ok) {
        console.warn(`[osm] HTTP ${res.status} for ${category.tag}=${category.values[0]}`);
        continue;
      }

      const data: OverpassResponse = await res.json();
      if (data.remark) console.warn(`[osm] Remark: ${data.remark}`);

      const elements = data.elements || [];

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags["name:da"] || tags["operator"];
        if (!name) continue;

        const key = name.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        // Saml kontaktinfo fra OSM tags (mange variationer)
        const email = tags.email || tags["contact:email"] || tags["addr:email"];
        const phone = tags.phone || tags["contact:phone"] || tags["addr:phone"];
        const website = tags.website || tags["contact:website"] || tags.url;

        // Skip leads helt uden kontaktinfo
        if (!email && !phone && !website) continue;

        const street = tags["addr:street"];
        const housenumber = tags["addr:housenumber"];
        const postcode = tags["addr:postcode"];
        const city = tags["addr:city"] || "København";

        const fullAddress = [street && housenumber ? `${street} ${housenumber}` : street, postcode, city]
          .filter(Boolean)
          .join(", ");

        // Spring over hvis ikke i Storkøbenhavn (postcode 1xxx-2xxx)
        if (postcode) {
          const pc = parseInt(postcode, 10);
          if (pc < 1000 || pc > 2999) continue;
        }

        results.push({
          companyName: name,
          email,
          phone: phone ? phone.replace(/\+45\s*/, "").trim() : undefined,
          website,
          address: fullAddress || undefined,
          city,
          industry: category.serviceType,
          serviceType: category.serviceType,
          source: "OpenStreetMap",
          leadType: "company",
          notes: [
            `Fundet via OSM (${category.tag}=${tags[category.tag]})`,
            tags["opening_hours"] ? `Åbningstider: ${tags["opening_hours"]}` : "",
            tags["description"] ? `Beskrivelse: ${tags["description"].slice(0, 150)}` : "",
          ].filter(Boolean).join(" · "),
        });
      }
    } catch (err) {
      console.error(`[osm] fejl for ${category.tag}:`, err);
    }

    // Pause så vi ikke hammer Overpass-API'et
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`[osm] Returnerer ${results.length} leads med kontaktinfo`);
  return results;
}
