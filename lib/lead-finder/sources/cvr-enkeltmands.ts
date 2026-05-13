/**
 * CVR Enkeltmands — finder selvstændige håndværkere som potentielle medarbejdere.
 *
 * Hvorfor det virker: enkeltmandsvirksomheder med 0-1 ansatte i håndværks-
 * brancher er typisk en person der laver freelance — og som ofte er åben for
 * fast arbejde gennem et bemandingsbureau. CVR giver os navn + direkte telefon.
 *
 * Strategi:
 *   1. Iterér gennem alle 9 faggrupper
 *   2. For hver faggruppes branchekode(r), søg CVR efter virksomheder
 *   3. Filtrér til enkeltmandsvirksomheder i Storkøbenhavn/Sjælland
 *   4. Map til LeadCandidate med leadType: "employee" og tradeCategory sat
 *
 * Bemærk: cvrapi.dk er pt. deaktiveret (samme som cvr.ts) — kræver
 * CVRAPI_ENABLED=true. Vi prøver alligevel at hente data så vi er klar
 * når API'et er åbnet igen.
 */

import type { LeadCandidate, Faggruppe } from "../types";
import { ALL_FAGGRUPPER } from "../types";
import { FAGGRUPPE_CONFIG, getCurrentFilters, getMissingFaggrupper } from "../filters/filter-config";

interface CVRHit {
  name?: string;
  company_name?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  phone?: string;
  email?: string;
  vat?: number;
  industry_code?: string;
  industrydesc?: string;
  owners?: Array<{ name?: string }>;
  employees?: number;
  startdate?: string;
  status?: string;
}

interface CVRSearchResponse {
  hits?: CVRHit[];
  error?: string;
}

const SJÆLLAND_POSTNR_MIN = 1000;
const SJÆLLAND_POSTNR_MAX = 4999;

/**
 * Søg CVR for enkeltmandsvirksomheder i én branchekode.
 * Returnerer rå hits — filtrering sker i caller.
 */
async function searchByBranchekode(kode: string): Promise<CVRHit[]> {
  // cvrapi.dk understøtter ?industry_code=XX.YY men har ikke et officielt
  // 'company_type=enkeltmandsvirksomhed'-filter. Vi filtrerer i koden ved
  // employees <= 1.
  const url = `https://cvrapi.dk/api/search?country=dk&industry_code=${encodeURIComponent(kode)}&limit=50`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "KrydsByg-LeadFinder/1.0 (kontakt@krydsbyg.com)" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return [];
      const data = (await res.json()) as CVRSearchResponse;
      return data.hits || [];
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return [];
}

/**
 * Hent enkeltmands-håndværkere fra alle (eller prioriterede) faggrupper.
 *
 * @param dayOfYear  Bruges til rotation så vi ikke rammer samme branchekode hver dag
 * @returns Liste af LeadCandidate med leadType="employee"
 */
export async function fetchCVREnkeltmandsLeads(
  dayOfYear: number,
): Promise<LeadCandidate[]> {
  // Samme gating som cvr.ts — vores Vercel-IP er blokeret af cvrapi.dk
  if (process.env.CVRAPI_ENABLED !== "true") {
    console.log("[cvr-enkeltmands] Skipped — cvrapi.dk blokerer vores IP (sæt CVRAPI_ENABLED=true)");
    return [];
  }

  const filters = getCurrentFilters().medarbejdere;
  const missing = getMissingFaggrupper();

  // Hvis Brain har markeret missing faggrupper, prioritér dem først.
  // Ellers iterér alle 9 i rotation baseret på dayOfYear.
  const orderedFaggrupper: Faggruppe[] =
    missing.length > 0
      ? [...missing, ...ALL_FAGGRUPPER.filter((f) => !missing.includes(f))]
      : rotateFaggrupper(dayOfYear);

  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  for (const faggruppe of orderedFaggrupper) {
    if (results.length >= 60) break;

    const branchekoder = FAGGRUPPE_CONFIG[faggruppe].cvr;

    for (const kode of branchekoder) {
      const hits = await searchByBranchekode(kode);

      for (const h of hits) {
        if (results.length >= 60) break;

        // Filter 1: kun aktive enkeltmandsvirksomheder
        const ansatte = h.employees ?? 0;
        if (ansatte > 1) continue;
        if (h.status && h.status !== "NORMAL") continue;

        // Filter 2: geografi — Sjælland
        const zip = parseInt(h.zipcode || "0");
        if (zip < SJÆLLAND_POSTNR_MIN || zip > SJÆLLAND_POSTNR_MAX) continue;
        if (filters.geografiRadius === "København" && (zip < 1000 || zip > 2999)) continue;

        // Dedup på CVR-nummer
        const cvr = h.vat ? String(h.vat) : "";
        if (cvr && seen.has(cvr)) continue;
        if (cvr) seen.add(cvr);

        // Ejer-navnet er typisk personen vi vil kontakte
        const ownerName = h.owners?.[0]?.name || undefined;
        const displayName = ownerName || h.name || h.company_name || "Ukendt håndværker";

        const candidate: LeadCandidate = {
          companyName: displayName,
          contactName: ownerName,
          contactTitle: `Selvstændig ${faggruppe.toLowerCase()}`,
          phone: h.phone || undefined,
          email: h.email || undefined,
          address: [h.address, h.zipcode, h.city].filter(Boolean).join(", "),
          city: h.city || undefined,
          cvr: cvr || undefined,
          industry: h.industrydesc || `${faggruppe} (enkeltmands)`,
          branchekode: kode,
          source: "CVR Enkeltmands",
          leadType: "employee",
          tradeCategory: faggruppe,
          openToWork: false,           // CVR siger ikke noget om dette
          notes: `Selvstændig ${faggruppe.toLowerCase()} (enkeltmandsvirksomhed). ` +
                 `Erfaren håndværker — sandsynligvis åben for fast arbejde via bureau.`,
        };

        // Erfaring fra startdate
        if (h.startdate) {
          const startYear = parseInt(h.startdate.split("-")[0] || "0");
          if (startYear > 1980) {
            const years = new Date().getFullYear() - startYear;
            candidate.experienceYears = Math.max(0, years);
            candidate.notes += ` Driver eget firma siden ${startYear} (~${years} års erfaring).`;
          }
        }

        results.push(candidate);
      }

      // Pause mellem CVR-kald
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`[cvr-enkeltmands] ${results.length} håndværkere fundet på tværs af ${orderedFaggrupper.length} faggrupper`);
  return results;
}

/**
 * Rotér alle 9 faggrupper baseret på dayOfYear så vi rammer forskellige
 * fag på forskellige dage. Returnerer hele listen — bare i forskellig orden.
 */
function rotateFaggrupper(dayOfYear: number): Faggruppe[] {
  const offset = dayOfYear % ALL_FAGGRUPPER.length;
  return [
    ...ALL_FAGGRUPPER.slice(offset),
    ...ALL_FAGGRUPPER.slice(0, offset),
  ];
}
