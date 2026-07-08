/**
 * KrydsByg — kanoniske mail-sekvenser (Council-godkendt v3.0, 4/9-model).
 * GENERERET 1:1 fra templates/sekvenser.py (rod-Leadbot, arkiveres) — denne fil er kanon nu.
 * Regenerér ved ændringer: python scripts/gen-sekvenser.py (fra rod-repoet).
 *
 * Struktur pr. mail: observation -> relevans -> ét tilbud -> ét CTA.
 * Timing: Dag 0 -> Dag 4 -> Dag 9 -> park Dag 14 (håndhæves allerede i auto-outreach-cronen).
 *
 * Bruges som ANKER for Sarahs AI-personalisering: AI'en skriver variationer
 * INDEN FOR disse rammer — den erstatter dem ikke. Ændringer kræver Council-review.
 */

export interface SekvensTrin {
  dag: number;
  emne: string; // {{variabel}}-pladsholdere udfyldes af udfyld()
  krop: string;
  sidste?: boolean;
}

export const SIGNATUR = "KrydsByg\nkontakt@krydsbyg.com · krydsbyg.com · CVR {{cvr}}\n\nVil du ikke høre fra os? Svar \"stop\".";

export const SIGNATUR_SIDSTE = "KrydsByg\nkontakt@krydsbyg.com · krydsbyg.com · CVR {{cvr}}\n\nSidste besked fra os. Svar \"stop\" for at bekræfte afmelding.";

export const SEKVENSER: Record<string, SekvensTrin[]> = {
  // A — Entreprenører & byggefirmaer (staffing, HØJ)
  A: [
    { dag: 0, emne: "{{firma_navn}} — ekstra hænder næste projekt?", krop: "Hej {{fornavn}},\n\nJeg faldt over {{firma_navn}} og kan se, I kører byggeprojekter i {{by}}-området.\n\nNår en sag spidser til, sender vi screenede håndværkere — tømrer, murer, VVS, el, maler — klar inden 24 timer. I betaler kun for de timer, I bruger.\n\nHar I en periode i {{kvartal}}, hvor I kan komme til at mangle folk?" },
    { dag: 4, emne: "Re: {{firma_navn}}", krop: "Hej {{fornavn}},\n\nKort opfølgning — løser I selv bemanding internt, eller køber I ekstra kapacitet til spidsbelastninger?\n\nVi har folk ledige i {{måned}}." },
    { dag: 9, emne: "Kapacitet i {{måned}}", sidste: true, krop: "Hej {{fornavn}},\n\nSidste besked fra mig.\n\nKonkret: vi har lige nu ledige tømrere og VVS'ere til Storkøbenhavn i {{måned}}. Skal jeg sende en kort liste over, hvad de kan — så har I den, hvis behovet opstår?" },
  ],
  // B — Facility managers & ejendomsselskaber (én kontakt / retainer, HØJ)
  B: [
    { dag: 0, emne: "{{firma_navn}} — én kontakt til håndværk?", krop: "Hej {{fornavn}},\n\nJeg kan se, {{firma_navn}} {{b_observation}}.\n\nDe fleste vi taler med jonglerer 4-5 leverandører til vedligehold. Vi samler det: tømrer, murer, VVS, el, maler, gulv — én kontakt, én faktura, fast aftale.\n\nGiver det mening at tale 10 minutter om jeres vedligehold i {{indeværende_år}}?" },
    { dag: 4, emne: "Re: {{firma_navn}}", krop: "Hej {{fornavn}},\n\nKort opfølgning — bruger I i dag én fast håndværkspartner, eller skifter I efter opgaven?\n\nMed en retainer hos os får I forudsigelig pris og garanteret kapacitet hele året." },
    { dag: 9, emne: "Fast vedligehold {{indeværende_år}}", sidste: true, krop: "Hej {{fornavn}},\n\nSidste besked.\n\nHvis I på et tidspunkt vil have ét nummer at ringe til for al håndværk på jeres portefølje — VVS-lækage, malersag, akut reparation — er vi her. Skal jeg sende vores retainer-model på én side?" },
  ],
  // C — Boligforeninger & andelsforeninger (jura + vedligehold, MEDIUM)
  C: [
    { dag: 0, emne: "{{firma_navn}} — vedligehold {{indeværende_år}}?", krop: "Kære {{fornavn}} / bestyrelse,\n\nJeg så, at {{firma_navn}} er en forening i {{by}}.\n\nVi laver vedligehold for foreninger — trappeopgange, facade, VVS, el, gulv — og kender juraen: forsikring, kontrakter og overenskomstløn er på plads, så bestyrelsen er dækket.\n\nSkal jeg sende et uforpligtende overslag til jeres næste bestyrelsesmøde?" },
    { dag: 4, emne: "Re: {{firma_navn}}", krop: "Kære {{fornavn}},\n\nKort opfølgning. Mange foreninger får et overslag inden budgetmødet — så har bestyrelsen noget konkret at drøfte.\n\nPasser det at tale 10 minutter i denne uge?" },
    { dag: 9, emne: "{{firma_navn}} — afsluttende besked", sidste: true, krop: "Kære {{fornavn}},\n\nRespekterer, at I måske har en fast leverandør.\n\nFår I brug for et second opinion på et tilbud — eller en partner til trappeopgange, facade og VVS — er vi her." },
  ],
  // D — Medarbejdere (rekruttering)
  D: [
    { dag: 0, emne: "{{kompetencer}}-opgaver i {{by}}?", krop: "Hej {{navn}},\n\nJeg så din profil på {{kilde}}.\n\nVi er KrydsByg — vi matcher håndværkere med opgaver i Storkøbenhavn. Du vælger selv, hvilke jobs du tager, og hvornår; vi klarer al kundekontakt.\n\nTypisk: 1-5 dage, god timeløn, hurtig betaling.\n\nHar du lyst til at høre mere?" },
    { dag: 4, emne: "Re: opgaver i {{by}}", krop: "Hej {{navn}},\n\nKort opfølgning — vi har ledige opgaver i {{by}} i {{måned}}.\n\nSkal vi tale 5 minutter om, hvad der passer dig?" },
    { dag: 9, emne: "En ting jeg glemte", sidste: true, krop: "Hej {{navn}},\n\nGlemte at nævne: du kan forbinde din Google Kalender til vores system og se ledige opgaver direkte — ingen app at installere, virker på telefonen.\n\nEr du ikke interesseret, er det helt fint. Er du, så skriv bare tilbage." },
  ],
  // E — Private via indkommende/samtykke (HandyHand). Cold = brev (se BREV).
  E: [
    { dag: 0, emne: "Re: din opgave — {{sandsynlig_opgave}}", krop: "Hej,\n\nJeg så din opgave ({{sandsynlig_opgave}}) på {{by}}.\n\nVi er KrydsByg og finder den rette håndværker til netop den type opgave — typisk hurtigere end at lede selv. Besigtigelse er uforpligtende.\n\nSkal vi kigge forbi og give et bud?" },
  ],
  // F — Re-aktivering (enkelt touch)
  F: [
    { dag: 0, emne: "KrydsByg — kort en", sidste: true, krop: "Hej {{fornavn}},\n\nVi var i kontakt for et stykke tid siden om {{opgave_reference}}.\n\nSiden da har vi udvidet med flere fag og folk — tænkte, timing måske er en anden i dag?\n\nEr det relevant, så svar bare tilbage." },
  ],
};

// Fysisk brev til private (cold-kanal — lovlig uden samtykke, Markedsføringsloven §10)
export const BREV = "{{dato}}\n\n{{adresse}}\n{{postnr}} {{by}}\n\n\nKære beboer på {{adresse}},\n\nVi har set, at {{boligtype}} på din adresse for nylig har skiftet ejer, og vil kort gøre opmærksom på os selv.\n\nVi er KrydsByg — vi leverer håndværkere til alle fag: tømrer, murer, VVS, el, maler og gulv, i Storkøbenhavn. Hvad enten det er en enkelt opgave eller en samlet renovering, finder vi de rette folk til den.\n\nVi tilbyder en uforpligtende besigtigelse. Ring på {{tlf}} eller scan QR-koden.\n\n[QR -> krydsbyg.com/bestil]\n\nMed venlig hilsen\nKrydsByg\nkrydsbyg.com · CVR {{cvr}} · {{tlf}}";

// SMS + LinkedIn (medarbejder — kun ved samtykke/eksisterende kontakt)
export const SMS_MEDARBEJDER = "Hej {{navn}}, det er KrydsByg. Vi har {{kompetencer}}-opgaver i {{by}} — interesseret? Svar her eller ring. Svar STOP for at afmelde.";

export const LINKEDIN_MEDARBEJDER = "Hej {{navn}}, jeg så din profil og tænkte, du måske er åben for fleksible opgaver. Vi er KrydsByg og matcher håndværkere med opgaver i Storkøbenhavn. Må jeg sende dig detaljer?";

/** Udfyld {{var}} med kontekst-værdier; ryd op i tomme salutationer (port af generate_emails.fill). */
export function udfyld(tekst: string, ctx: Record<string, string>): string {
  return tekst
    .replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, navn) => ctx[navn.trim()] ?? m)
    .replace(/Hej ,/g, "Hej,")
    .replace(/Kære {2}\/ bestyrelse/g, "Kære bestyrelse")
    .replace(/Kære {2}\//g, "Kære")
    .replace(/ {2,}/g, " ");
}

/** Vælg sekvens ud fra branche (port af generate_emails.vælg_sekvens_virksomhed). */
export function vaelgSekvens(branche: string): "A" | "B" | "C" {
  const t = branche.toLowerCase();
  if (["forening", "andel", "ejer"].some((k) => t.includes(k))) return "C";
  if (["entrepren", "bygge", "håndværk", "haandvaerk"].some((k) => t.includes(k))) return "A";
  return "B"; // ejendom, facility, kontor, restaurant, café, butik, co-working
}
