import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Handelsbetingelser — Kryds",
  description: "Læs Kryds' handelsbetingelser for leje af vikarer og mandskab til byggeprojekter, flytninger og events.",
};

const sections = [
  {
    num: "1",
    title: "Parter og aftalens omfang",
    body: "Disse handelsbetingelser gælder for alle aftaler om levering af vikarer og mandskab indgået mellem Kryds ApS, CVR-nr. 46369947, Kontakt@KrydsByg.com (herefter \"Kryds\") og den bestillende virksomhed eller privatperson (herefter \"Kunden\"). Betingelserne gælder, medmindre andet udtrykkeligt er aftalt skriftligt.",
  },
  {
    num: "2",
    title: "Ydelsens karakter",
    body: "Kryds stiller kvalificeret mandskab til rådighed for Kunden til udførelse af konkrete opgaver i et aftalt tidsrum. Vikarerne er ansat af Kryds og forbliver ansat af Kryds under opgaven. Der opstår intet ansættelsesforhold mellem Kunden og den enkelte vikar. Kunden har instruktionsbeføjelse over det daglige arbejde på stedet og bærer ansvaret for, at arbejdsmiljølovens regler overholdes.",
  },
  {
    num: "3",
    title: "Bestilling og bekræftelse",
    body: "Bestillinger kan afgives via krydsbyg.com, email eller telefon. En bestilling er bindende, når den er skriftligt bekræftet af Kryds. Kryds forbeholder sig ret til at afvise bestillinger uden begrundelse. Ændringer i antal, startdato eller opgavetype skal meddeles Kryds skriftligt og er kun gældende, når de er bekræftet af Kryds.",
  },
  {
    num: "4",
    title: "Priser og betaling",
    body: "Alle priser er i danske kroner ekskl. moms, medmindre andet er angivet. Timepriser fremgår af det fremsendte tilbud og/eller Kryds' gældende prisliste på krydsbyg.com/priser. Faktura udstedes efter endt uge eller ved opgavens afslutning med en betalingsfrist på 8 dage netto. Ved forsinket betaling påløber morarenter svarende til Nationalbankens referencerente + 8 pct. p.a. samt et rykkergebyr på kr. 100 pr. rykker.",
  },
  {
    num: "5",
    title: "Afbestilling og ændringer",
    body: "Afbestilling eller reduktion af bestilt mandskab skal ske skriftligt. Afbestilling mere end 24 timer før aftalte mødetidspunkt er gratis. Afbestilling 2–24 timer før faktureres med 50 % af den aftalte dagspris. Afbestilling samme dag som mødetidspunktet faktureres fuldt ud. Kryds forbeholder sig ret til at ombooke mandskab ved uforudsete omstændigheder.",
  },
  {
    num: "6",
    title: "Kundens ansvar — arbejdsmiljø og instruktion",
    body: "Kunden er som arbejdsstedsansvarlig forpligtet til at sikre, at de arbejdsmiljøretlige regler overholdes på stedet, herunder at stille nødvendigt sikkerhedsudstyr til rådighed og instruere vikaren i arbejdsstedets særlige forhold. Kunden hæfter for skader, der skyldes mangelfuld instruktion eller usikre arbejdsforhold.",
  },
  {
    num: "7",
    title: "Værktøj og materialer",
    body: "Kryds' vikarer medbringer alment håndværktøj, medmindre andet er aftalt ved bestillingen. Specialværktøj, maskiner, stilladser, lift, materialer og forbrugsstoffer stilles til rådighed af Kunden. Kunden hæfter for tab eller beskadigelse af eget udstyr, medmindre tabet er forvoldt ved vikarens forsætlige eller groft uagtsomme adfærd.",
  },
  {
    num: "8",
    title: "Kryds' ansvar og forsikring",
    body: "Kryds har tegnet lovpligtig arbejdsskadeforsikring for alle vikarer samt erhvervsansvarsforsikring, der dækker skader forvoldt af vikaren under udførelse af arbejdet. Kryds' erstatningsansvar er begrænset til direkte tab og kan maksimalt udgøre det fakturerede beløb for den konkrete opgave. Kryds hæfter ikke for indirekte tab, herunder driftstab, avancetab, tidstab eller dagbodsforpligtelser.",
  },
  {
    num: "9",
    title: "Reklamation",
    body: "Reklamation over udført arbejde eller mandskabets adfærd skal ske skriftligt til Kontakt@KrydsByg.com senest 3 hverdage efter den dag, forholdet opstod. Berettigede reklamationer afhjælpes ved omlevering af mandskab eller et forholdsmæssigt afslag i prisen efter Kryds' valg.",
  },
  {
    num: "10",
    title: "Solohvervningsforbud",
    body: "Kunden må ikke — i en periode på 6 måneder regnet fra den pågældende vikars seneste arbejdsdag hos Kunden — indgå direkte ansættelses- eller samarbejdsaftaler med en vikar, som Kryds har stillet til rådighed, uden forudgående skriftlig aftale med Kryds. Overtrædelse udløser en konventionalbod på kr. 50.000 pr. overtrædelse, dog mindst svarende til 3 måneders fakturerede ydelser beregnet ud fra vikarens gennemsnitlige timeforbrug.",
  },
  {
    num: "11",
    title: "Tavshedspligt og fortrolighed",
    body: "Begge parter forpligter sig til at behandle den anden parts forretningsmæssige og tekniske oplysninger fortroligt. Fortrolighedspligten gælder også efter aftalens ophør. Kryds videregiver kun nødvendige oplysninger om vikaren (navn og kontaktoplysninger) til Kunden med henblik på den konkrete opgaves udførelse.",
  },
  {
    num: "12",
    title: "Behandling af personoplysninger",
    body: "Kryds behandler Kundens kontakt- og virksomhedsoplysninger med henblik på opfyldelse af ordren og fakturering, jf. GDPR art. 6(1)(b). Oplysningerne opbevares i 5 år iht. bogføringsloven og slettes derefter. Se vores fulde privatlivspolitik på krydsbyg.com/privatpolitik.",
  },
  {
    num: "13",
    title: "Force majeure",
    body: "Ingen af parterne er ansvarlige for manglende opfyldelse af aftalen som følge af omstændigheder uden for partens rimelige kontrol, herunder men ikke begrænset til: strejker, lockout, brand, oversvømmelse, epidemi, pandemi, krig, terror, myndighedsindgreb eller andre ekstraordinære begivenheder. Den forhindrede part skal straks underrette den anden part.",
  },
  {
    num: "14",
    title: "Lovvalg og værneting",
    body: "Aftalen er i alle henseender underlagt dansk ret. Enhver tvist, der måtte opstå i forbindelse med aftalen og ikke kan løses i mindelighed, skal afgøres ved Københavns Byret som første instans.",
  },
  {
    num: "15",
    title: "Ikrafttræden og ændringer",
    body: "Disse betingelser er gældende fra april 2026 (version v1-2026-04). Kryds forbeholder sig ret til at ændre betingelserne med 30 dages varsel. Den til enhver tid gældende version fremgår af krydsbyg.com/handelsbetingelser.",
  },
];

export default function HandelsbetingelserPage() {
  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px]">
        <div className="max-w-[800px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 font-condensed font-semibold text-[13px] tracking-[.1em] uppercase text-muted no-underline hover:text-yellow mb-8 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Forsiden
          </Link>

          <div className="mb-10">
            <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">Juridisk</p>
            <h1 className="font-condensed font-black text-[clamp(34px,5vw,56px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-4">
              Handelsbetingelser
            </h1>
            <p className="text-[15px] text-muted leading-[1.7]">
              Version v1-2026-04 · Gældende fra april 2026 · Kryds ApS, CVR 46369947
            </p>
          </div>

          <div className="space-y-0 border-t border-[rgba(242,238,230,.07)]">
            {sections.map((s) => (
              <div key={s.num} className="py-7 border-b border-[rgba(242,238,230,.07)]">
                <div className="flex gap-5 items-start">
                  <span className="font-condensed font-black text-[13px] tracking-[.12em] text-yellow flex-shrink-0 mt-[3px] w-6">
                    {s.num}.
                  </span>
                  <div>
                    <h2 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.06em] text-cream mb-2">
                      {s.title}
                    </h2>
                    <p className="text-[15px] leading-[1.75] text-[rgba(242,238,230,.65)]">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-[#1A1A18] border border-[rgba(245,196,0,.12)] rounded-[2px] p-8">
            <p className="font-condensed font-bold text-[12px] tracking-[.15em] uppercase text-yellow mb-2">Spørgsmål?</p>
            <p className="text-[14px] text-muted leading-[1.6]">
              Kontakt os på{" "}
              <a href="mailto:Kontakt@KrydsByg.com" className="text-cream hover:text-yellow transition-colors">
                Kontakt@KrydsByg.com
              </a>{" "}
              eller på telefon{" "}
              <a href="tel:+4542778866" className="text-cream hover:text-yellow transition-colors">
                +45 42 77 88 66
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
