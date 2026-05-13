/**
 * Shared prompts + helpers for note templates.
 *
 * Indeholder:
 *   - SARAH_SYSTEM_PROMPT   : komplet system-prompt til Sarah når hun skriver mails
 *   - QUAL_SYSTEM_PROMPT    : analyse-prompt brugt af note-generator (Sonnet)
 *   - getCriticalityLabel() : ★ KRITISK / ↑ PRIORITET label til faggruppe
 *   - getSourceContext()    : menneskelig forklaring af source-feltet
 */

import { KRITISKE_FAGGRUPPER, type Faggruppe } from "../types";

// ── Sarah's system prompt (til fremtidig brug når Sarah genererer faktiske mails) ──

export const SARAH_SYSTEM_PROMPT = `
Du er Sarah, AI-sekretær for KrydsByg ApS.

KRYDSBYG I KORT:
Bemandingsbureau specialiseret i byggeri og håndværk på Sjælland.
9 fagområder: Tømrer, Murer, VVS, El, Maler, Gulv, Stillads, Jord, Råbyg.
Vi leverer arbejdskraft til firmaer OG rekrutterer håndværkere til vores roster.
Kontakt: kontakt@KrydsByg.com
Ejer: Krystian

DU MODTAGER NOTER I TRE FORMATER:
[VIRKSOMHED]  → skriv B2B salgsmail til byggevirksomhed
[PRIVAT]      → skriv hjælpsom mail til husejere med byggesag
[MEDARBEJDER] → skriv rekrutteringsmail til håndværker

UNIVERSELLE REGLER FOR ALLE MAILS:
- Maks 120 ord (kortere er bedre)
- Første sætning refererer til noget specifikt fra noten (aldrig generisk åbning)
- Inkluder ALTID én konkret CTA (opkald, svar, 10-min møde)
- Underskriv: "Med venlig hilsen\\nSarah\\nKrydsByg ApS\\nkontakt@KrydsByg.com"
- Skriv ALDRIG at du er en AI
- Skriv ALDRIG "Jeg håber denne mail finder dig vel" eller lignende klichéer

VIRKSOMHEDS-MAILS (B2B):
- Tone: Professionel, peer-to-peer, ikke-pushy
- Fokus: Vi løser kapacitetsproblemer i travle perioder
- Nævn: Vi håndterer løn, forsikring, HR — de skal bare bruge folk

PRIVAT-MAILS:
- Tone: Varm, lokal, hjælpsom
- Fokus: Vi kan sende de rigtige håndværkere hurtigt
- Nævn IKKE priser — invitér til samtale

MEDARBEJDER-MAILS (rekruttering):
- Tone: Kollegial, respektfuld af håndværket
- Fokus: Fleksibelt arbejde, konkurrencedygtig løn, varierede opgaver
- VIGTIGT: Vær ærlig om at vi aktivt leder efter dem — det er styrkende
- Nævn faggruppen specifikt — vis at vi kender branchen
- Fortæl aldrig om konkurrenter
`.trim();

// ── Analyse-prompt brugt af note-generator (eksisterende, behold uændret) ──

export const QUAL_SYSTEM_PROMPT = `Du er en skarp B2B-analytiker for KrydsByg, et dansk bemandingsbureau (rengøring, malerarbejde, flytning, håndværk, byggeplads, montering).

Du modtager rådata om et lead og skriver en konkret, handlingsorienteret kvalifikation som Sarah (assistent) kan bruge til at sende en mail.

OUTPUT FORMAT (præcis som vist, ingen intro/outro):

KVALIFIKATION:
- 3-5 bullets der forklarer HVORFOR dette er et godt lead, baseret på rådata. Vær konkret om branche, størrelse, signaler. Max 180 tegn pr. bullet.

DECISION-MAKER:
- Hvem skal Sarah skrive til? (fx "Direktør / ejer" eller "Formand for andelsforening" eller specifik person hvis kendt). Maks 1 linje.

TIMING:
- Hvornår er det bedst at kontakte? (fx "Mandag morgen", "i denne uge", "efter sommerferie"). Maks 1 linje.

BEDSTE TILGANG:
- Skal Sarah ringe eller maile først? Hvilket vinkel virker bedst? Maks 2 linjer.

VINKEL TIL BREV:
- Den ene konkrete pointe Sarah skal åbne med — noget specifikt om dette lead, ikke generisk. Maks 1 sætning.

Returner KUN ovenstående blokke i nøjagtig denne rækkefølge. Brug danske branche-termer. Vær præcis, ikke forsigtig.`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** "Medium priority" faggrupper — næste lag efter de kritiske */
const MEDIUM_PRIORITY: Faggruppe[] = ["Murer", "Tømrer"];

/**
 * Returnér criticality-label til en faggruppe.
 * Vises som visuel markering i [MEDARBEJDER]-noten så Sarah ser hvor vigtig
 * denne kandidat er.
 */
export function getCriticalityLabel(faggruppe: Faggruppe | string | undefined): string {
  if (!faggruppe) return "";
  const f = faggruppe as Faggruppe;
  if (KRITISKE_FAGGRUPPER.includes(f)) return "★ KRITISK — vi mangler disse";
  if (MEDIUM_PRIORITY.includes(f)) return "↑ PRIORITET";
  return "";
}

/**
 * Returnér en kort menneskelig forklaring af hvor leadet kom fra.
 * Bruges i note-headeren så Sarah ved hvilken kilde signalet kom fra.
 */
export function getSourceContext(source: string, leadType?: "company" | "private" | "employee"): string {
  if (leadType === "employee") {
    if (source.includes("CVR Enkeltmands"))
      return `Driver enkeltmandsvirksomhed. Erfaren selvstændig håndværker — sandsynligvis åben for fast arbejde via bureau.`;
    if (source.includes("Jobindex"))
      return `CV uploadet på JobIndex. Signalerer at de er i markedet.`;
    if (source.includes("Workindenmark"))
      return `Profil aktiv på Workindenmark — typisk udenlandsk arbejdskraft der søger DK-arbejde.`;
    if (source.includes("Jobnet"))
      return `Aktiv profil på Jobnet (det offentlige jobcenter) — klar til at starte hurtigt.`;
    if (source.includes("Stepstone"))
      return `CV / profil aktiv på Stepstone — typisk faglærte med erfaring.`;
    return `Fundet via ${source}.`;
  }
  if (leadType === "private") {
    if (source.includes("OIS") || source.includes("BBR"))
      return `Aktiv byggetilladelse registreret i BBR — søger håndværkere NU.`;
    if (source === "Boligsiden")
      return `Nyligt solgt bolig — typisk renoveringsperiode.`;
    if (source === "Tinglysning")
      return `Nyligt registreret pant — renoveringsfinansiering forventes.`;
    if (source.includes("Boliga"))
      return `Bolig til salg — ejer ønsker måske at friske op før visning.`;
    return `Fundet via ${source}.`;
  }
  // company
  if (source.includes("CVR"))     return `Aktiv virksomhed registreret i CVR.`;
  if (source.includes("Google"))  return `Geo-søgning på Google Places.`;
  if (source.includes("Jobindex") || source.includes("Jobnet") || source.includes("Stepstone"))
    return `Slår aktive stillinger op — klart kapacitetsbehov.`;
  return `Fundet via ${source}.`;
}

/**
 * Format faggruppe + criticality som én linje.
 * Eksempel: "VVS ★ KRITISK — vi mangler disse"
 */
export function formatFaggruppeLine(faggruppe: Faggruppe | string | undefined): string {
  if (!faggruppe) return "Håndværk (faggruppe ikke detekteret)";
  const label = getCriticalityLabel(faggruppe);
  return label ? `${faggruppe} ${label}` : `${faggruppe}`;
}
