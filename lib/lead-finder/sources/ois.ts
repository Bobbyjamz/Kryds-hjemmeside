/**
 * OIS / Datafordeler BBR-kilde
 *
 * Finder private bygherrer via aktive byggesager og nyregistrerede bygninger
 * i Storkøbenhavn — det stærkeste signal for private renoveringskunder.
 *
 * Auth: Gratis API fra datafordeler.dk
 *   DATAFORDELER_USER     = brugernavn (opret på datafordeler.dk)
 *   DATAFORDELER_PASSWORD = adgangskode
 *
 * Uden credentials: returnerer tom liste (graceful fallback).
 *
 * Kommunekoder (KBH-area):
 *   0101 København · 0147 Frederiksberg · 0157 Gentofte · 0159 Gladsaxe
 *   0161 Glostrup  · 0163 Herlev        · 0165 Albertslund · 0167 Hvidovre
 *   0169 Høje-Taastrup · 0173 Lyngby    · 0175 Rødovre    · 0183 Ishøj
 *   0185 Tårnby    · 0187 Vallensbæk    · 0190 Furesø     · 0400 Bornholm
 */

import type { LeadCandidate } from "../types";

const BASE = "https://services.datafordeler.dk/BBR/BBRPublic/1/REST";

// Kommunekoder for Storkøbenhavn
const KBH_KOMMUNER = [
  "0101", "0147", "0151", "0153", "0155", "0157", "0159",
  "0161", "0163", "0165", "0167", "0169", "0173", "0175",
];

interface BBRBygning {
  id_lokalId?: string;
  husnummer_id?: string;
  kommunekode?: string;
  koordinatsystem?: string;
  // Adresse-felter
  vejnavn?: string;
  husnummertekst?: string;
  postnr?: string;
  postnrnavn?: string;
  // Bygnings-felter
  bygningstatus?: string;          // 1=projekteret, 2=under opførelse, 3=opført, 6=midlertidig
  byg021BygningensAnvendelse?: string; // Anvendelseskode
  byg038SamletBygningsareal?: number;
  byg054AntalEtager?: number;
  byg132KælderAreal?: number;
  registreringFra?: string;        // ISO dato for seneste registrering
}

export async function fetchOISLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const user = process.env.DATAFORDELER_USER;
  const pass = process.env.DATAFORDELER_PASSWORD;

  if (!user || !pass) {
    // Ingen credentials — returnér tom liste uden at kaste fejl
    return [];
  }

  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // Rotér kommuner — 3 per dag
  const kommuner = [0, 1, 2].map(
    (o) => KBH_KOMMUNER[(dayOfYear + o) % KBH_KOMMUNER.length]
  );

  // Søg bygninger "under opførelse" (bygningstatus=2) i dag's kommuner
  const cutoffDate = getDateMinus(60); // Byggesager startet inden for 60 dage

  await Promise.allSettled(
    kommuner.map(async (kommunekode) => {
      try {
        const url =
          `${BASE}/Bygning` +
          `?kommunekode=${kommunekode}` +
          `&bygningstatus=2` + // Under opførelse
          `&registreringFraFra=${cutoffDate}` +
          `&pagesize=25` +
          `&username=${encodeURIComponent(user)}` +
          `&password=${encodeURIComponent(pass)}`;

        const res = await fetch(url, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) return;

        const raw: unknown = await res.json();
        const bygninger = extractBygninger(raw);

        for (const byg of bygninger) {
          if (results.length >= 30) break;

          const adresse = buildAddress(byg);
          if (!adresse) continue;

          const key = adresse.toLowerCase().trim();
          if (seen.has(key)) continue;
          seen.add(key);

          const areal = byg.byg038SamletBygningsareal;
          const etager = byg.byg054AntalEtager;
          const anvendelse = mapAnvendelse(byg.byg021BygningensAnvendelse);

          results.push({
            companyName: adresse,
            address: adresse,
            city: byg.postnrnavn || `Postnr. ${byg.postnr}` || "Storkøbenhavn",
            source: "Datafordeler BBR",
            leadType: "private",
            buildingPermit: true,
            propertyType: anvendelse,
            serviceType: "Malerarbejde + montering + rengøring (ny-/ombygning)",
            budget: estimateBudget(areal),
            notes: buildOISNote(adresse, areal, etager, anvendelse, byg.registreringFra),
          });
        }
      } catch {
        // Enkelt-kommune fejl stopper ikke resten
      }
    })
  );

  return results;
}

// ── Hjælpefunktioner ──────────────────────────────────────────────────────────

function extractBygninger(raw: unknown): BBRBygning[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;

  // GeoJSON format
  if (Array.isArray(obj.features)) {
    return (obj.features as Array<{ properties?: BBRBygning }>)
      .map((f) => f.properties || {})
      .filter(Boolean);
  }

  // Flat array format
  if (Array.isArray(raw)) {
    return raw as BBRBygning[];
  }

  // Wrapped in results key
  for (const key of ["results", "data", "bygninger", "features"]) {
    if (Array.isArray(obj[key])) {
      return obj[key] as BBRBygning[];
    }
  }

  return [];
}

function buildAddress(byg: BBRBygning): string {
  const parts = [byg.vejnavn, byg.husnummertekst, byg.postnr, byg.postnrnavn]
    .filter(Boolean);
  return parts.join(" ").trim();
}

function mapAnvendelse(kode?: string): string {
  if (!kode) return "bolig";
  const k = kode.toString();
  if (k.startsWith("1")) return "enfamiliehus";
  if (k.startsWith("2")) return "flerfamiliehus";
  if (k.startsWith("3")) return "etageejendom";
  if (k.startsWith("4")) return "erhverv";
  if (k.startsWith("5")) return "institution";
  return "bolig";
}

function estimateBudget(areal?: number): string {
  if (!areal) return "15.000–30.000";
  if (areal > 200) return "30.000–80.000";
  if (areal > 100) return "20.000–50.000";
  return "15.000–30.000";
}

function buildOISNote(
  adresse: string,
  areal?: number,
  etager?: number,
  type?: string,
  regFra?: string
): string {
  const parts: string[] = [
    `SIGNAL: Aktiv byggesag registreret${regFra ? ` ${regFra.split("T")[0]}` : ""} (Datafordeler BBR)`,
    `TYPE: ${type || "bolig"}${areal ? `, ${areal} m²` : ""}${etager ? `, ${etager} etager` : ""}`,
    ``,
    `KVALIFIKATION:`,
    `- Aktiv ny-/ombygning i gang — ejer søger sandsynligvis håndværkere NU`,
    `- ${adresse} er i KrydsBygs primære zone`,
    `- Potentiale: maler, gulv, montering, rengøring efter byggeri`,
    ``,
    `SARAH — SKRIV EN BESKED DER:`,
    `1. Er meget personlig og konkret om adressen`,
    `2. Tilbyder hjælp til de håndværksmæssige opgaver efter byggeriet`,
    `3. Nævner at KrydsByg kan levere hurtigt og rydde op undervejs`,
    `TONE: Varm, hjælpsom, lokal — ikke salgsorienteret`,
  ];
  return parts.join("\n");
}

function getDateMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
