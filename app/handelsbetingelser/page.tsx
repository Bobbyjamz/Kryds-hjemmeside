import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import LegalHeader from "./LegalHeader";

export const metadata: Metadata = {
  title: "Handelsbetingelser — KrydsByg",
  description: "Læs KrydsByg ApS' handelsbetingelser version 2.0 for vikarbemanding og entrepriseydelser til byggeprojekter i København.",
};

const sections = [
  {
    num: "1",
    title: "Aftalens parter og omfang",
    body: "Disse handelsbetingelser regulerer aftaleforholdet mellem KrydsByg ApS (herefter \"KrydsByg\") og enhver virksomhed eller privatperson (herefter \"Kunden\") der bestiller ydelser hos KrydsByg. KrydsByg leverer vikarbemanding, entrepriseydelser og specialiserede faglærte og ufaglærte medarbejdere til byggeprojekter, renoveringer, events og relaterede opgaver inden for ni fagområder: tømrer, murer, stillads, nedrivning, VVS, el, maler, jord og anlæg samt generel byggepladshjælp.",
  },
  {
    num: "2",
    title: "Bestilling og bekræftelse",
    body: "2.1 En bindende aftale opstår, når KrydsByg har sendt en skriftlig ordrebekræftelse til Kunden pr. e-mail. 2.2 Mundtlige aftaler er ikke bindende for KrydsByg, medmindre de efterfølgende bekræftes skriftligt. 2.3 Kunden er ansvarlig for at alle oplysninger afgivet ved bestilling er korrekte, herunder projektadresse, opgavebeskrivelse, krav til faglige kompetencer samt ønsket tidshorisont. 2.4 KrydsByg forbeholder sig ret til at afvise eller modificere en ordre, hvis de angivne betingelser ikke kan opfyldes.",
  },
  {
    num: "3",
    title: "Prismodel og fakturering",
    body: "KrydsByg tilbyder to prismodeller. Timebaseret model: Timepris fra kr. 295,– ekskl. moms pr. medarbejder pr. time. Minimumsopgave: 4 timer pr. dag pr. medarbejder. Overtid (efter 8 timer): +50% tillæg. Weekend og helligdage: +75% tillæg. Natarbejde (22:00–06:00): +75% tillæg. Projektbaseret (fastpris) model: Fast pris aftales skriftligt inden opgavestart. Eventuelle tillægsydelser udenfor aftalens scope faktureres særskilt. Alle priser er eksklusiv moms (25%), medmindre andet er angivet skriftligt. Fakturaer forfalder til betaling netto 8 dage fra fakturadato, medmindre andet er skriftligt aftalt. Ved forsinket betaling beregnes morarenter på 2% pr. påbegyndt måned fra forfaldsdato, samt et rykkergebyr på kr. 100,– pr. rykker. KrydsByg forbeholder sig ret til at regulere timepriser med op til 5% pr. kalenderår med 30 dages skriftligt varsel.",
  },
  {
    num: "4",
    title: "Arbejdstid, fravær og erstatningsmedarbejdere",
    body: "4.1 Arbejdstiden aftales konkret ved bestilling. Standardvagter er hverdage kl. 07:00–15:30. 4.2 Fravær pga. sygdom: KrydsByg bestræber sig på at stille erstatningsmedarbejder til rådighed senest 2 timer efter meddelelse om fravær. Kunden faktureres ikke for faktisk fravær. 4.3 KrydsByg garanterer ikke tilgængelighed af specifikke navngivne medarbejdere, men sikrer at afsendt personale besidder de aftalte kompetencer. 4.4 Kunden er ansvarlig for at anviste medarbejdere har adgang til arbejdspladsen og de nødvendige arbejdsredskaber, medmindre andet er aftalt.",
  },
  {
    num: "5",
    title: "Kundens forpligtelser",
    body: "5.1 Kunden er ansvarlig for at arbejdsmiljølovgivningen overholdes på arbejdspladsen, herunder APV, PSS og nødvendige sikkerhedsforanstaltninger. 5.2 Kunden skal meddele KrydsByg eventuelle særlige risici, krav til sikkerhedsudstyr eller certificeringer senest ved bestillingens afgørelse. 5.3 Kunden er ansvarlig for at KrydsByg's medarbejdere behandles i overensstemmelse med dansk arbejdsret og ikke udsættes for chikane, diskrimination eller usikre arbejdsforhold. 5.4 Kunden må ikke ansætte eller engagere KrydsByg's medarbejdere direkte uden KrydsByg's skriftlige samtykke i en periode på 12 måneder fra sidste udlejning af den pågældende medarbejder. Overtrædelse medfører et konventionalbod svarende til 3 måneders bruttoløn for den pågældende medarbejder.",
  },
  {
    num: "6",
    title: "Aflysning og ændringer",
    body: "Aflysning mere end 48 timer før opgavestart: Intet gebyr. Aflysning 24–48 timer før opgavestart: 50% af estimeret dagssats. Aflysning under 24 timer eller no-show: 100% af estimeret dagssats. Ændring af omfang undervejs faktureres efter faktisk forbrug.",
  },
  {
    num: "7",
    title: "Ansvar og forsikring",
    body: "7.1 KrydsByg's ansvar for direkte tab er begrænset til fakturabeløbet for den aktuelle opgave. KrydsByg hæfter ikke for indirekte tab, driftstab eller følgeskader. 7.2 KrydsByg er ansvarsforsikret. Kopi af forsikringsbevis fremsendes på forespørgsel. 7.3 Kunden er ansvarlig for skader forårsaget af Kundens egne fejlspecifikationer, mangelfuld APV eller ukorrekte bygningsoplysninger. 7.4 Force majeure (strejke, lockout, ekstraordinære vejrforhold, pandemi, myndighedspåbud mv.) fritager KrydsByg for ansvar, såfremt opfyldelse af aftalen hindres herved.",
  },
  {
    num: "8",
    title: "Fortrolighed og GDPR",
    body: "8.1 Begge parter forpligter sig til at behandle den anden parts forretningsmæssige oplysninger fortroligt. 8.2 KrydsByg behandler persondata i overensstemmelse med GDPR og databeskyttelsesloven. KrydsByg's fulde privatlivspolitik er tilgængelig på krydsbyg.com/privatpolitik. 8.3 Kundens kontaktoplysninger og projektdata opbevares af KrydsByg i op til 5 år til brug for fakturering, reference og lovpligtig bogføring.",
  },
  {
    num: "9",
    title: "Tvister og lovvalg",
    body: "9.1 Nærværende handelsbetingelser er underlagt dansk ret. 9.2 Eventuelle tvister søges løst i mindelighed. Kan enighed ikke opnås, afgøres tvisten ved Retten i København som aftalt værneting.",
  },
];

export default function HandelsbetingelserPage() {
  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px]">
        <div className="max-w-[800px] mx-auto">
          <LegalHeader />

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
