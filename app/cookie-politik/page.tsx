import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie-politik — Kryds",
  description: "Læs om Kryds' brug af cookies og hvordan du administrerer dit samtykke.",
};

export default function CookiePolitikPage() {
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
              Cookie-politik
            </h1>
            <p className="text-[15px] text-muted leading-[1.7]">
              Version v1-2026-04 · Gældende fra april 2026 · Kryds ApS, CVR 46369947
            </p>
          </div>

          <div className="space-y-10 text-[15px] leading-[1.8] text-[rgba(242,238,230,.65)]">

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">Hvad er cookies?</h2>
              <p>
                En cookie er en lille tekstfil, som gemmes på din enhed, når du besøger en hjemmeside. Cookies bruges til at huske dine præferencer, sikre funktionalitet og — efter samtykke — til at analysere, hvordan besøgende bruger hjemmesiden.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">Vores cookies</h2>
              <div className="space-y-4">
                {[
                  {
                    category: "Nødvendige cookies",
                    color: "text-cream",
                    badge: "Altid aktive",
                    badgeColor: "bg-[rgba(242,238,230,.1)] text-muted",
                    items: [
                      {
                        name: "kryds-admin-session",
                        purpose: "HTTP-only session-cookie til admin-login. Nødvendig for at holde dig logget ind på /admin.",
                        duration: "7 dage",
                        thirdParty: "Nej",
                      },
                      {
                        name: "kryds-employee-session",
                        purpose: "HTTP-only session-cookie til medarbejder-login. Nødvendig for at holde dig logget ind på /medarbejder.",
                        duration: "7 dage",
                        thirdParty: "Nej",
                      },
                      {
                        name: "kryds-cookie-consent",
                        purpose: "Gemmer dit cookievalg (accepteret/afvist). Lagres i localStorage, ikke en egentlig cookie.",
                        duration: "Ingen udløbsdato (localStorage)",
                        thirdParty: "Nej",
                      },
                    ],
                  },
                  {
                    category: "Analytiske cookies",
                    color: "text-cream",
                    badge: "Kræver samtykke",
                    badgeColor: "bg-[rgba(245,196,0,.1)] text-yellow",
                    items: [
                      {
                        name: "Vercel Analytics",
                        purpose: "Anonyme besøgsstatistikker: antal sidevisninger, besøgsvarighed og trafikkilder. Indsamler ikke personidentificerbare oplysninger. Ingen cookiefil — bruger fingerprinting på server-siden.",
                        duration: "Anonymiseret, ingen persondata",
                        thirdParty: "Vercel Inc. (USA) — EU-US DPF",
                      },
                    ],
                  },
                ].map((cat) => (
                  <div key={cat.category} className="border border-[rgba(242,238,230,.07)] rounded-[2px] overflow-hidden">
                    <div className="bg-[rgba(242,238,230,.04)] px-5 py-3 flex items-center justify-between">
                      <h3 className="font-condensed font-bold text-[13px] tracking-[.1em] uppercase text-cream">{cat.category}</h3>
                      <span className={`font-condensed font-semibold text-[10px] tracking-[.15em] uppercase px-3 py-1 rounded-[2px] ${cat.badgeColor}`}>
                        {cat.badge}
                      </span>
                    </div>
                    <div className="divide-y divide-[rgba(242,238,230,.05)]">
                      {cat.items.map((item) => (
                        <div key={item.name} className="px-5 py-4">
                          <p className="font-condensed font-bold text-[13px] tracking-[.06em] text-cream mb-2">{item.name}</p>
                          <p className="text-[13px] text-muted leading-[1.6] mb-2">{item.purpose}</p>
                          <div className="flex gap-6 text-[12px] text-[rgba(242,238,230,.35)]">
                            <span>Varighed: {item.duration}</span>
                            <span>Tredjepart: {item.thirdParty}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">Tredjeparts-cookies</h2>
              <p>
                Kryds bruger ikke tredjeparts markedsføringscookies, tracking-pixels fra sociale medier eller annoncenetværk. De eneste tredjepartsdatabehandlere er Resend (email) og Vercel (hosting/analytics), begge dækket af EU-US Data Privacy Framework.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">Administrer dit samtykke</h2>
              <p className="mb-4">
                Første gang du besøger krydsbyg.com, vises et cookiebanner. Du kan til enhver tid ændre eller trække dit samtykke tilbage:
              </p>
              <ol className="space-y-2 ml-4">
                {[
                  "Ryd kryds-cookie-consent fra din browsers lokale lager (localStorage)",
                  "Genindlæs siden — banneret vises igen",
                  "Vælg \"Kun nødvendige\" for at afvise analytiske cookies",
                ].map((item, i) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 font-condensed font-black text-[12px] text-yellow mt-[1px]">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
              <p className="mt-4">
                Nødvendige session-cookies kan slettes ved at logge ud eller rydde cookies i din browser. Dette påvirker ikke hjemmesidens funktion for besøgende.
              </p>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">Sletning i browseren</h2>
              <p className="mb-3">Du kan til enhver tid slette cookies og rydde localStorage i din browser:</p>
              <ul className="space-y-2 ml-4">
                {[
                  "Chrome: Indstillinger → Sikkerhed og privatliv → Slet browserdata",
                  "Firefox: Indstillinger → Privatliv og sikkerhed → Cookies og webstedsdata",
                  "Safari: Indstillinger → Avanceret → Webstedsdata",
                  "Edge: Indstillinger → Privatliv, søgning og tjenester → Ryd browserdata",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-yellow opacity-70" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.06em] text-cream mb-3">Lovgrundlag</h2>
              <p>
                Vores cookiepolitik er udformet i overensstemmelse med databeskyttelsesforordningen (GDPR), cookiebekendtgørelsen (lov nr. 1148 af 9. oktober 2013 med ændringer) og ePrivacy-direktivet. Nødvendige cookies kræver ikke samtykke; analytiske cookies kræver forudgående, frivilligt og informeret samtykke.
              </p>
            </section>

          </div>

          <div className="mt-12 bg-[#1A1A18] border border-[rgba(245,196,0,.12)] rounded-[2px] p-8">
            <p className="font-condensed font-bold text-[12px] tracking-[.15em] uppercase text-yellow mb-2">Spørgsmål om cookies?</p>
            <p className="text-[14px] text-muted leading-[1.6]">
              Kontakt os på{" "}
              <a href="mailto:Kontakt@KrydsByg.com" className="text-cream hover:text-yellow transition-colors">
                Kontakt@KrydsByg.com
              </a>
              . Se også vores{" "}
              <Link href="/privatpolitik" className="text-yellow hover:underline">privatlivspolitik</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
