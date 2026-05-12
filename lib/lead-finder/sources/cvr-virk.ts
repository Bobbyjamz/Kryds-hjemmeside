/**
 * Officiel CVR-data via Erhvervsstyrelsens distribution-API.
 *
 * KRAVER GRATIS REGISTRERING:
 *   1. Gå til https://datacvr.virk.dk/data/cvr-distribution
 *   2. Klik "Bestil dataadgang" og opret bruger
 *   3. Tilføj credentials til Vercel:
 *      CVR_VIRK_USERNAME = <brugernavn>
 *      CVR_VIRK_PASSWORD = <password>
 *
 * Returnerer kvalitets-data inkl. email og telefon for de fleste firmaer.
 * Helt anderledes end cvrapi.dk (3. part) som blokerer Vercel-IPs.
 */

import type { LeadCandidate } from "../types";

const ENDPOINT = "https://distribution.virk.dk/cvr-permanent/_search";

// Brancher (NACE/DB07 koder) der er gode KrydsByg-kunder
const TARGET_INDUSTRIES = [
  // Bygge & håndværk
  "412000", "412010", "412020", // Bygge entreprenører
  "433200", "433210",            // Tømrer
  "433300", "433310",            // Maler
  "432100",                       // Elektriker
  "432200",                       // VVS
  "431200",                       // Nedrivning
  // Service & rengøring
  "812100",                       // Almindelig rengøring
  "812200",                       // Industrirengøring
  "811000",                       // Facility management
  // Ejendom
  "681000", "682040",            // Ejendomsudlejning + administration
  // Hotel & restaurant
  "551000", "551010",            // Hotel
  "561010", "561011",            // Restaurant
];

const KBH_KOMMUNER = [
  "København", "Frederiksberg", "Gentofte", "Lyngby-Taarbæk",
  "Gladsaxe", "Tårnby", "Hvidovre", "Rødovre", "Glostrup", "Albertslund",
];

interface VirkCompany {
  Vrvirksomhed?: {
    cvrNummer?: number;
    virksomhedMetadata?: {
      nyesteNavn?: { navn?: string };
      nyesteBeliggenhedsadresse?: {
        vejnavn?: string;
        husnummerFra?: number;
        postnummer?: number;
        postdistrikt?: string;
        kommune?: { kommuneNavn?: string };
      };
      nyesteHovedbranche?: {
        branchekode?: string;
        branchetekst?: string;
      };
      antalAnsatte?: number;
    };
    elektroniskPost?: Array<{ kontaktoplysning?: string; periode?: { gyldigTil?: string | null } }>;
    telefonNummer?: Array<{ kontaktoplysning?: string; periode?: { gyldigTil?: string | null } }>;
    hjemmeside?: Array<{ kontaktoplysning?: string; periode?: { gyldigTil?: string | null } }>;
  };
}

interface VirkResponse {
  hits?: {
    total?: { value?: number };
    hits?: Array<{ _source?: VirkCompany }>;
  };
  error?: { type?: string; reason?: string };
}

export async function fetchVirkCVRLeads(dayOfYear: number): Promise<LeadCandidate[]> {
  const username = process.env.CVR_VIRK_USERNAME;
  const password = process.env.CVR_VIRK_PASSWORD;

  if (!username || !password) {
    console.log("[cvr-virk] Skipped — CVR_VIRK_USERNAME/CVR_VIRK_PASSWORD ikke sat (registrer gratis på datacvr.virk.dk)");
    return [];
  }

  const results: LeadCandidate[] = [];
  const seen = new Set<string>();

  // Rotér 3 brancher per dag for variation
  const todayIndustries = [0, 1, 2].map((o) => TARGET_INDUSTRIES[(dayOfYear + o) % TARGET_INDUSTRIES.length]);

  const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  for (const branchekode of todayIndustries) {
    if (results.length >= 50) break;

    const query = {
      _source: [
        "Vrvirksomhed.cvrNummer",
        "Vrvirksomhed.virksomhedMetadata.nyesteNavn",
        "Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse",
        "Vrvirksomhed.virksomhedMetadata.nyesteHovedbranche",
        "Vrvirksomhed.virksomhedMetadata.antalAnsatte",
        "Vrvirksomhed.elektroniskPost",
        "Vrvirksomhed.telefonNummer",
        "Vrvirksomhed.hjemmeside",
      ],
      query: {
        bool: {
          must: [
            { term: { "Vrvirksomhed.virksomhedMetadata.nyesteHovedbranche.branchekode": branchekode } },
            // Aktiv virksomhed
            { exists: { field: "Vrvirksomhed.virksomhedMetadata.nyesteNavn.navn" } },
            // I Storkøbenhavn
            { terms: { "Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse.kommune.kommuneNavn": KBH_KOMMUNER } },
          ],
          // Skal have email for at være interessant for outreach
          should: [
            { exists: { field: "Vrvirksomhed.elektroniskPost" } },
          ],
          minimum_should_match: 0,
        },
      },
      size: 30,
      from: (dayOfYear % 5) * 30, // Paginer så vi får forskellige firmaer hver dag
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.warn(`[cvr-virk] HTTP ${res.status} for branche ${branchekode}`);
        continue;
      }

      const data: VirkResponse = await res.json();
      if (data.error) {
        console.warn(`[cvr-virk] CVR API error: ${data.error.reason}`);
        continue;
      }

      const hits = data.hits?.hits || [];
      for (const hit of hits) {
        const vc = hit._source?.Vrvirksomhed;
        if (!vc?.virksomhedMetadata?.nyesteNavn?.navn) continue;

        const name = vc.virksomhedMetadata.nyesteNavn.navn;
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        // Kun aktive (uden gyldigTil) email + tlf
        const email = vc.elektroniskPost?.find((e) => !e.periode?.gyldigTil)?.kontaktoplysning;
        const phone = vc.telefonNummer?.find((t) => !t.periode?.gyldigTil)?.kontaktoplysning;
        const website = vc.hjemmeside?.find((h) => !h.periode?.gyldigTil)?.kontaktoplysning;

        const addr = vc.virksomhedMetadata.nyesteBeliggenhedsadresse;
        const city = addr?.postdistrikt || addr?.kommune?.kommuneNavn;
        const industry = vc.virksomhedMetadata.nyesteHovedbranche?.branchetekst;

        results.push({
          companyName: name,
          email,
          phone,
          website,
          address: addr ? `${addr.vejnavn || ""} ${addr.husnummerFra || ""}, ${addr.postnummer || ""} ${city || ""}`.trim() : undefined,
          city,
          cvr: vc.cvrNummer ? String(vc.cvrNummer) : undefined,
          industry,
          source: "CVR Virk",
          leadType: "company",
          notes: [
            `CVR: ${vc.cvrNummer}`,
            vc.virksomhedMetadata.antalAnsatte ? `Ansatte: ${vc.virksomhedMetadata.antalAnsatte}` : "",
            industry ? `Branche: ${industry}` : "",
          ].filter(Boolean).join(" · "),
        });
      }
    } catch (err) {
      console.error(`[cvr-virk] fejl for branche ${branchekode}:`, err);
    }

    // Pause så vi ikke hammer API'et
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`[cvr-virk] Returnerer ${results.length} leads`);
  return results;
}
