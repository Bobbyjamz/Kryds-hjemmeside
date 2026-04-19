import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import LegalHeader from "./LegalHeader";

export const metadata: Metadata = {
  title: "Medarbejder Privatlivspolitik — Kryds",
  description: "Læs hvordan Kryds ApS behandler personoplysninger om nuværende og tidligere medarbejdere og vikarer.",
};

export default function MedarbejderPrivatpolitikPage() {
  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px]">
        <div className="max-w-[800px] mx-auto">
          <LegalHeader />

          <div className="space-y-10 text-[15px] leading-[1.8] text-[rgba(242,238,230,.65)]">

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">1. Dataansvarlig</h2>
              <p>
                Kryds ApS, CVR-nr. 46369947, er dataansvarlig for behandlingen af personoplysninger om nuværende og tidligere medarbejdere og vikarer. Kontakt: <a href="mailto:Kontakt@KrydsByg.com" className="text-yellow hover:underline">Kontakt@KrydsByg.com</a> · +45 42 77 88 66.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">2. Oplysninger vi indsamler</h2>
              <p className="mb-3">I forbindelse med tilmelding og ansættelse behandler vi:</p>
              <div className="space-y-2">
                {[
                  { label: "Identifikationsoplysninger", val: "Fulde navn, fødselsdato, CPR-nummer (kun til skatteindberetning og lønadministration)" },
                  { label: "Kontaktoplysninger", val: "Telefonnummer, emailadresse" },
                  { label: "Faglige oplysninger", val: "Fag, kompetencer, erfaring, CV, referencer" },
                  { label: "Profilbillede", val: "Valgfrit — bruges til intern identifikation og præsentation over for kunder" },
                  { label: "Lønoplysninger", val: "Bankkontonummer, trukket A-skat, AM-bidrag, optjente feriepenge" },
                  { label: "Adgangssikkerhed", val: "Bekræftelseskode og tilhørende telefonnummer til login på medarbejder-portal" },
                  { label: "Opgavehistorik", val: "Registrerede vagter, mødetider, afbud og evalueringer" },
                ].map((item) => (
                  <div key={item.label} className="bg-[rgba(242,238,230,.03)] border border-[rgba(242,238,230,.07)] rounded-[2px] p-4">
                    <p className="font-condensed font-bold text-[12px] tracking-[.1em] uppercase text-[rgba(242,238,230,.6)] mb-1">{item.label}</p>
                    <p className="text-[14px]">{item.val}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">3. Retsgrundlag</h2>
              <ul className="space-y-2 ml-4">
                {[
                  "Opfyldelse af ansættelseskontrakten: GDPR art. 6(1)(b)",
                  "Skatteindberetning og lønudbetaling (CPR-nr.): Retlig forpligtelse, GDPR art. 6(1)(c) + skattekontrolloven",
                  "Bogføring og faktura: Retlig forpligtelse, GDPR art. 6(1)(c) + bogføringsloven",
                  "Profilering og præsentation over for kunder (billede, CV): Samtykke, GDPR art. 6(1)(a)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-yellow opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">4. Opbevaring og sletning</h2>
              <div className="space-y-3">
                {[
                  { type: "Profiloplysninger og CV", period: "Op til 3 år efter seneste udførte opgave" },
                  { type: "Løndata og lønbilag", period: "5 år (bogføringsloven)" },
                  { type: "CPR-nummer", period: "Slettes straks efter afsluttet årsindberetning til SKAT" },
                  { type: "Bankkontonummer", period: "Slettes 30 dage efter afsluttet samarbejde" },
                  { type: "Login-oplysninger (telefon, bekræftelseskode)", period: "Slettes straks ved sletning af profil" },
                ].map((item) => (
                  <div key={item.type} className="flex gap-4 py-3 border-b border-[rgba(242,238,230,.06)] last:border-0">
                    <p className="flex-1 font-medium text-cream">{item.type}</p>
                    <p className="text-muted text-[14px] text-right">{item.period}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">5. Videregivelse</h2>
              <p className="mb-3">
                Vi videregiver kun nødvendige oplysninger om medarbejdere:
              </p>
              <ul className="space-y-2 ml-4">
                {[
                  "Til kunden på den konkrete opgave: fornavn og telefonnummer (med henblik på koordination)",
                  "Til SKAT: CPR-nummer, lønoplysninger og AM-bidrag (retlig forpligtelse)",
                  "Til Resend Inc.: navn og emailadresse (med henblik på udsendelse af bekræftelseskode)",
                  "Til Vercel Inc.: alle data er gemt på Vercels infrastruktur",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-yellow opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4">Dine oplysninger sælges aldrig til tredjeparter.</p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">6. Sikkerhed</h2>
              <p>
                Alle medarbejderdata opbevares sikkert på Vercels infrastruktur. Adgang til medarbejderprofiler kræver admin-login med bcrypt-krypteret adgangskode og JWT-baseret sessionstyring. Login til medarbejder-portalen kræver to faktorer: telefonnummer og en unik 6-cifret kode genereret af Kryds.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">7. Dine rettigheder</h2>
              <p className="mb-3">Du har ret til:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Indsigt i alle oplysninger vi behandler om dig",
                  "Berigtigelse af forkerte oplysninger",
                  "Sletning af din profil (med undtagelse af data, vi er lovpligtige til at bevare)",
                  "Portabilitet — vi kan udlevere dine data i maskinlæsbart format",
                  "At trække samtykke til profilbillede/CV tilbage — send en email",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-yellow opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                Send en anmodning til <a href="mailto:Kontakt@KrydsByg.com" className="text-yellow hover:underline">Kontakt@KrydsByg.com</a> — vi svarer inden for 30 dage.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">8. Klage</h2>
              <p>
                Klager over vores behandling kan indgives til{" "}
                <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="text-yellow hover:underline">
                  Datatilsynet
                </a>{" "}
                (datatilsynet.dk).
              </p>
            </section>

          </div>

          <div className="mt-12 bg-[#1A1A18] border border-[rgba(245,196,0,.12)] rounded-[2px] p-8">
            <p className="font-condensed font-bold text-[12px] tracking-[.15em] uppercase text-yellow mb-2">Anmodning om indsigt eller sletning</p>
            <p className="text-[14px] text-muted leading-[1.6]">
              Kontakt os på{" "}
              <a href="mailto:Kontakt@KrydsByg.com" className="text-cream hover:text-yellow transition-colors">
                Kontakt@KrydsByg.com
              </a>{" "}
              med emnefeltet &quot;Persondata-anmodning&quot;. Vi svarer inden for 30 dage.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
