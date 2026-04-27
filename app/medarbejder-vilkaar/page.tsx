import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import LegalHeader from "./LegalHeader";

export const metadata: Metadata = {
  title: "Medarbejdervilkår — KrydsByg",
  description: "Vilkår for medarbejdere tilknyttet KrydsByg ApS — vikaransættelse, løn, mødetid, sikkerhed, GDPR og lovvalg.",
};

const sections = [
  {
    num: "1",
    title: "Formidlingsforholdet",
    body: "Tilmelding hos KrydsByg ApS oprettes som vikaransættelse — ikke fastansættelse. KrydsByg formidler arbejde til dig på enkeltopgaver eller løbende vagter hos vores kunder. Du forpligter dig til at møde til de aftalte vagter, du har accepteret, og udføre arbejdet i overensstemmelse med kundens anvisninger og dansk arbejdsret.",
  },
  {
    num: "2",
    title: "Løn og udbetaling",
    body: "Løn aftales individuelt og følger den til enhver tid gældende overenskomst eller aftalte timeløn for det pågældende fag. Lønnen udbetales senest 8 dage efter afsluttet vagt eller månedsskifte, jf. den enkelte aftale. KrydsByg trækker A-skat, AM-bidrag og ATP iht. dansk lovgivning. Du modtager lønseddel via e-mail eller via medarbejderportalen.",
  },
  {
    num: "3",
    title: "Mødetid og fravær",
    body: "Du skal møde til den aftalte tid og fuldt udhvilet. Sygdom og andet uventet fravær skal meldes til KrydsByg senest 2 timer inden vagtens start på +45 42 77 88 66 eller via medarbejderportalen. Gentagne udeblivelser uden gyldig grund kan medføre øjeblikkelig opsigelse af samarbejdet og fortabelse af planlagte vagter.",
  },
  {
    num: "4",
    title: "Sikkerhed og instruktion",
    body: "Du forpligter dig til at følge kundens APV (arbejdspladsvurdering), sikkerhedsinstruktioner og brug af personligt værnemiddel. Indtagelse af alkohol eller euforiserende stoffer på arbejdspladsen medfører øjeblikkelig bortvisning. Mistanke om uforsvarlige arbejdsforhold skal straks meldes til KrydsByg.",
  },
  {
    num: "5",
    title: "Tavshedspligt",
    body: "Du har tavshedspligt om kundens forretningsforhold, projekter, beboere, beboeres ejendele samt interne KrydsByg-forhold du måtte få kendskab til gennem dit arbejde. Tavshedspligten gælder uden tidsbegrænsning og fortsætter også efter dit samarbejde med KrydsByg ophører.",
  },
  {
    num: "6",
    title: "GDPR og persondata",
    body: "KrydsByg behandler dine persondata (navn, kontaktoplysninger, CV, foto, ansøgning, lønoplysninger) i overensstemmelse med GDPR og databeskyttelsesloven. Data opbevares så længe samarbejdet løber + 5 år af bogføringsmæssige hensyn. Du har ret til indsigt, berigtigelse og sletning iht. vores medarbejder-privatlivspolitik på krydsbyg.com/medarbejder-privatpolitik.",
  },
  {
    num: "7",
    title: "Direkte ansættelse hos kunden",
    body: "Du må ikke i 12 måneder efter sidste vagt for en kunde indgå direkte ansættelses- eller konsulentforhold med den pågældende kunde uden KrydsByg's skriftlige samtykke. Overtrædelse kan medføre erstatningskrav svarende til 3 måneders bruttoløn.",
  },
  {
    num: "8",
    title: "Lovvalg og tvister",
    body: "Vilkårene er underlagt dansk ret. Eventuelle tvister søges først løst i mindelighed. Kan enighed ikke opnås, afgøres tvisten ved Retten i København som aftalt værneting.",
  },
];

export default function MedarbejderVilkaarPage() {
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
