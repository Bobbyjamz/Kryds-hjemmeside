import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privatlivspolitik — Kryds",
  description: "Læs hvordan Kryds ApS behandler dine personoplysninger i overensstemmelse med GDPR.",
};

export default function PrivatpolitikPage() {
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
              Privatlivspolitik
            </h1>
            <p className="text-[15px] text-muted leading-[1.7]">
              Version v1-2026-04 · Gældende fra april 2026 · Sidst opdateret april 2026
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-[1.8] text-[rgba(242,238,230,.65)]">

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">1. Dataansvarlig</h2>
              <p>
                Den dataansvarlige for behandlingen af dine personoplysninger er:
              </p>
              <div className="mt-4 bg-[rgba(242,238,230,.04)] border border-[rgba(242,238,230,.08)] rounded-[2px] p-5 text-[14px]">
                <p className="font-semibold text-cream mb-1">Kryds ApS</p>
                <p>CVR-nr.: 46369947</p>
                <p>Email: <a href="mailto:Kontakt@KrydsByg.com" className="text-yellow hover:underline">Kontakt@KrydsByg.com</a></p>
                <p>Telefon: <a href="tel:+4542778866" className="text-yellow hover:underline">+45 42 77 88 66</a></p>
                <p>København, Danmark</p>
              </div>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">2. Hvilke oplysninger behandler vi?</h2>
              <p className="mb-3">Vi behandler følgende kategorier af personoplysninger om kunder og besøgende:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Kontaktoplysninger: navn, email, telefonnummer",
                  "Virksomhedsoplysninger: firmanavn, CVR-nr. (ved erhvervskunder)",
                  "Forespørgselsoplysninger: opgavetype, startdato, antal, beskrivelse",
                  "Tekniske data: IP-adresse (anonymiseret), browser-type, besøgstid (kun ved samtykke til analytiske cookies)",
                  "Kommunikation: emails og beskeder sendt til os",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-yellow opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">3. Formål og retsgrundlag</h2>
              <div className="space-y-4">
                {[
                  {
                    purpose: "Behandling af forespørgsler og bookinger",
                    basis: "Opfyldelse af kontrakt, GDPR art. 6(1)(b)",
                  },
                  {
                    purpose: "Fakturering og bogføring",
                    basis: "Retlig forpligtelse (bogføringsloven), GDPR art. 6(1)(c)",
                  },
                  {
                    purpose: "Kundeservice og kommunikation",
                    basis: "Berettiget interesse, GDPR art. 6(1)(f)",
                  },
                  {
                    purpose: "Anonyme besøgsstatistikker",
                    basis: "Samtykke, GDPR art. 6(1)(a) — kun ved accept af cookies",
                  },
                ].map((item) => (
                  <div key={item.purpose} className="bg-[rgba(242,238,230,.03)] border border-[rgba(242,238,230,.07)] rounded-[2px] p-4">
                    <p className="font-semibold text-cream text-[14px] mb-1">{item.purpose}</p>
                    <p className="text-[13px] text-muted">{item.basis}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">4. Opbevaringsperiode</h2>
              <p className="mb-3">Vi opbevarer dine oplysninger så længe det er nødvendigt til det angivne formål:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Forespørgsler og kundekommunikation: 3 år",
                  "Fakturaer og regnskabsdata: 5 år (bogføringsloven)",
                  "Analytiske besøgsdata: anonymiserede, ingen fast udløbsdato",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-yellow opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">5. Videregivelse til tredjeparter</h2>
              <p className="mb-3">
                Vi sælger aldrig dine personoplysninger. Vi videregiver kun oplysninger til følgende databehandlere, som behandler data på vores vegne:
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: "Resend Inc.",
                    use: "Udsendelse af emails (forespørgselsbekræftelser, meddelelser)",
                    location: "USA — dækket af EU-US Data Privacy Framework",
                  },
                  {
                    name: "Vercel Inc.",
                    use: "Hosting af hjemmesiden og lagring af data",
                    location: "USA/EU — dækket af EU-US Data Privacy Framework",
                  },
                ].map((t) => (
                  <div key={t.name} className="bg-[rgba(242,238,230,.03)] border border-[rgba(242,238,230,.07)] rounded-[2px] p-4">
                    <p className="font-semibold text-cream text-[14px] mb-1">{t.name}</p>
                    <p className="text-[13px] text-muted mb-1">{t.use}</p>
                    <p className="text-[12px] text-[rgba(242,238,230,.35)]">{t.location}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">6. Cookies</h2>
              <p>
                Vi bruger nødvendige cookies til hjemmesidens funktion samt analytiske cookies til anonyme besøgsstatistikker — men kun efter dit samtykke via cookie-banneret. Læs mere i vores{" "}
                <Link href="/cookie-politik" className="text-yellow hover:underline">cookie-politik</Link>.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">7. Dine rettigheder</h2>
              <p className="mb-3">Du har efter GDPR følgende rettigheder over for os:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Ret til indsigt i de oplysninger, vi behandler om dig",
                  "Ret til berigtigelse af urigtige oplysninger",
                  "Ret til sletning (\"retten til at blive glemt\"), med visse undtagelser",
                  "Ret til begrænsning af behandling",
                  "Ret til dataportabilitet",
                  "Ret til at gøre indsigelse mod behandling baseret på berettiget interesse",
                  "Ret til at trække samtykke tilbage (påvirker ikke forudgående behandling)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-yellow opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                Send en anmodning til <a href="mailto:Kontakt@KrydsByg.com" className="text-yellow hover:underline">Kontakt@KrydsByg.com</a>. Vi svarer inden for 30 dage.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">8. Klage</h2>
              <p>
                Hvis du mener, at vi behandler dine personoplysninger i strid med reglerne, kan du klage til{" "}
                <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="text-yellow hover:underline">
                  Datatilsynet
                </a>
                , Carl Jacobsens Vej 35, 2500 Valby, dt@datatilsynet.dk.
              </p>
            </section>

          </div>

          <div className="mt-12 bg-[#1A1A18] border border-[rgba(245,196,0,.12)] rounded-[2px] p-8">
            <p className="font-condensed font-bold text-[12px] tracking-[.15em] uppercase text-yellow mb-2">Kontakt vedr. persondata</p>
            <p className="text-[14px] text-muted leading-[1.6]">
              Spørgsmål om vores behandling af personoplysninger kan rettes til{" "}
              <a href="mailto:Kontakt@KrydsByg.com" className="text-cream hover:text-yellow transition-colors">
                Kontakt@KrydsByg.com
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
