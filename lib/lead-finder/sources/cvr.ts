import type { LeadCandidate } from "../types";
import { rankSearchTerms, type IndustryWeights } from "../scoring";

// 90+ søgetermer — roterer dagligt så vi aldrig rammer de samme firmaer to dage i træk
const SEARCH_TERMS = [
  // Ejendomsadministratorer
  "CEJ Ejendomsadministration", "AMC North Ejendomsadministration", "By og Bolig Ejendomsadministration",
  "BtB Consult Ejendomsadministration", "Qvortrup Ejendomsadministration", "COBO Ejendomsadministration",
  "DEAS Ejendomsadministration", "Azets Ejendomsadministration", "BKM Ejendomsadministration",
  "Advodan Glostrup Ejendomsadministration", "Steingrim Advokater", "Advokatfirmaet Turley",
  "Newsec Property Management", "NIRAS Ejendomsadministration", "Colliers Property Management",
  "CBRE Denmark", "JLL Denmark", "Cushman Wakefield Denmark", "Knight Frank Denmark",
  "Savills Denmark", "Aberdeen Standard", "Patrizia Danmark", "Catella Property",
  // Facility Management
  "ISS Facility Services", "Coor Service Management", "Driftssikker Facility",
  "Bilfinger Services", "Sodexo Danmark", "Compass Group Danmark",
  "G4S Facility Management", "Securitas Facility", "Bravida Danmark",
  "NCC Building Services", "YIT Danmark", "Skanska Facility",
  // Andelsforeninger og boligselskaber
  "Andelsboligforening Østerbro", "Andelsboligforening Frederiksberg", "Andelsboligforening Nørrebro",
  "Andelsboligforening Vesterbro", "Andelsboligforening Amager", "Andelsboligforening Valby",
  "Boligforening København", "Boligselskab Frederiksberg", "Almen boligforening",
  "Lejerbo", "DAB Boligadministration", "KAB Boligadministration",
  "Domea", "Boligkontoret Danmark", "3B Boligforening",
  // Ejendomsejere og investorer
  "Ejendomsselskabet Copenhagen", "Ejendomsservice København", "Ejendomsdrift ApS",
  "Boligadministration ApS", "Ejendomsforvaltning ApS", "Ejendomsinvestering",
  "Ejendomsprojekt", "Bygningsejer", "Udlejningsejendom",
  // Rengøring og service
  "Rengøringsselskab København", "Rengøring Frederiksberg", "Serviceselskab København",
  "Driftselskab Storkøbenhavn", "Rengøringsfirma Amager", "Erhvervsrengøring",
  // Håndværk og byg
  "Malerfirma København", "Malerentreprenør Frederiksberg", "Gulvlægger København",
  "Håndværkerservice Storkøbenhavn", "Byggeservice ApS", "Renoveringsfirma København",
  "Tømrerfirma", "Murerfirma", "VVS firma København",
  // Mæglere og developere
  "Home Ejendomsmægler", "EDC Mægler", "Nybolig Erhverv", "Danbolig Erhverv",
  "Realmæglerne Erhverv", "Boligone", "Lokalbolig", "Oline Ejendom",
  // Revisorer med ejendomskunder
  "PwC Ejendom", "Deloitte Real Estate", "KPMG Ejendom",
  "BDO Ejendomsadministration", "Grant Thornton Ejendom",
  // Advokater med ejendomsdivision
  "Kromann Reumert Ejendom", "Plesner Ejendom", "Gorrissen Federspiel",
  "Bech-Bruun Ejendom", "Horten Ejendom", "Bird Bird Ejendom",
  // Byggeprojekter og entreprise
  "Hoffmann Entreprise", "MT Højgaard", "Per Aarsleff",
  "NCC Danmark", "Skanska Danmark", "Pihl Søn",
  // Lokale firmaer
  "Ejendomsservice Gentofte", "Ejendomsdrift Lyngby", "Facility Herlev",
  "Ejendomsadministration Rødovre", "Boligservice Gladsaxe", "Ejendom Brøndby",
];

interface CVRApiResponse {
  name?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  phone?: string;
  email?: string;
  vat?: number;
  industrydesc?: string;
}

export async function fetchCVRLeads(
  dayOfYear: number,
  weights: IndustryWeights = {}
): Promise<LeadCandidate[]> {
  const results: LeadCandidate[] = [];

  // Hent 30 termer baseret på dagens dato — roterer gennem alle ~90 termer over 3 dage
  const startIdx = (dayOfYear * 30) % SEARCH_TERMS.length;
  const dailyTerms: string[] = [];
  for (let i = 0; i < 30; i++) {
    dailyTerms.push(SEARCH_TERMS[(startIdx + i) % SEARCH_TERMS.length]);
  }

  // Hvis vi har historiske vægte, ranger termerne så top-konverterende brancher prøves først
  // (vigtigt hvis CVR-API'et timer ud halvvejs)
  const terms = Object.keys(weights).length > 0
    ? rankSearchTerms(dailyTerms, weights)
    : dailyTerms;

  for (const term of terms) {
    try {
      const url = `https://cvrapi.dk/api?search=${encodeURIComponent(term)}&country=dk`;
      const res = await fetch(url, {
        headers: { "User-Agent": "KrydsByg-LeadFinder/1.0 (kontakt@krydsbyg.com)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;

      const data: CVRApiResponse = await res.json();
      if (!data.name) continue;

      // Filtrér: kun Storkøbenhavn (postnr 1000–3999)
      const zip = parseInt(data.zipcode || "0");
      if (zip < 1000 || zip > 3999) continue;

      results.push({
        companyName: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: `${data.address || ""}, ${data.zipcode || ""} ${data.city || ""}`.trim(),
        city: data.city || undefined,
        cvr: data.vat ? String(data.vat) : undefined,
        industry: data.industrydesc || undefined,
        source: "CVR API",
        serviceType: "Malerarbejde + gulvlægning",
        notes: `Fundet via CVR-søgning: "${term}"`,
      });

      // Respektér rate limit
      await new Promise((r) => setTimeout(r, 250));
    } catch {
      continue;
    }
  }

  return results;
}
