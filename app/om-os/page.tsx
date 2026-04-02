import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om os — Kryds | Stærke hænder, stærkt sammenhold",
  description:
    "Mød folkene bag Kryds. Stiftet af Krystian Seweryn Balasz og drevet sammen med Karl Kristian Ravn — fordi vi tror på at hjælpe hinanden.",
};

const team = [
  {
    name: "Krystian Seweryn Balasz",
    role: "Stifter",
    photo: "/krystian.jpg",
    facePosition: "center 18%",
    bio: "Krystian har været i byggebranchen i over 7 år og kender udfordringerne indefra. Han startede Kryds ud fra en simpel overbevisning: at de rigtige folk skal møde de rigtige projekter — hurtigt, pålideligt og uden unødvendigt bureaukrati. Med erfaring fra renovering til store byggepladser har han bygget et netværk af dygtige og hårdtarbejdende folk, der er klar til at rykke ud med kort varsel.",
  },
  {
    name: "Karl Kristian Ravn",
    role: "Partner & Driftsansvarlig",
    photo: "/karl.jpg",
    facePosition: "center 42%",
    bio: "Karl sikrer at maskinrummet kører. Som driftsansvarlig har han ansvaret for den daglige koordinering, kvalitetssikring og kundekontakt. Han sørger for at hvert projekt får de rette folk, at tidsplaner holdes, og at kommunikationen mellem kunde og personale altid er i top. Karl tror på at struktur og omsorg for mennesker ikke behøver at udelukke hinanden.",
  },
];

export default function OmOsPage() {
  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px] max-[900px]:pb-[70px]">
        {/* Back arrow */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-condensed font-semibold text-[13px] tracking-[.1em] uppercase text-muted no-underline transition-colors hover:text-yellow mb-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Tilbage til forsiden
        </Link>

        {/* Hero */}
        <div className="max-w-[750px] mx-auto text-center mb-[80px]">
          <div className="flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
            Om Kryds
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,5vw,64px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-6">
            Vi tror på at <span className="text-yellow">hjælpe hinanden</span>
          </h1>
          <p className="text-[17px] leading-[1.8] text-muted max-w-[560px] mx-auto">
            Kryds blev skabt fordi vi så et behov: dygtige folk der manglede arbejde, og virksomheder der manglede hænder. Vores mission er at forbinde dem — enkelt, hurtigt og med respekt for begge sider.
          </p>
        </div>

        {/* Why we started */}
        <div className="max-w-[800px] mx-auto mb-[80px]">
          <div className="bg-gray p-12 rounded-[2px] border border-[rgba(242,238,230,0.07)] max-[900px]:p-8">
            <h2 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-6">
              Hvorfor vi startede Kryds
            </h2>
            <div className="space-y-5 text-[16px] leading-[1.8] text-[rgba(242,238,230,.65)]">
              <p>
                Byggebranchen er fuld af dygtige mennesker — men systemet gør det ofte svært for dem at finde de rigtige opgaver, og for virksomheder at finde de rigtige folk, hurtigt nok.
              </p>
              <p>
                Vi startede Kryds fordi vi selv har stået på begge sider. Vi har været dem der ventede på et opkald om arbejde, og vi har været dem der desperat ledte efter ekstra hænder til en deadline.
              </p>
              <p>
                <span className="text-cream font-medium">Vores mål er simpelt:</span> at gøre det nemmere at finde hinanden. Ingen unødvendige mellemled, ingen uigennemsigtige priser, og ingen løfter vi ikke kan holde. Bare reelle folk til reelle opgaver — med en kontaktperson der kender dem ved navn.
              </p>
              <p>
                Vi tror på at når folk hjælper hinanden, bliver resultatet bedre for alle. Det er det Kryds handler om.
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="max-w-[900px] mx-auto mb-[80px]">
          <div className="text-center mb-12">
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              Folkene bag <span className="text-yellow">Kryds</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-8 max-[900px]:grid-cols-1">
            {team.map((person) => (
              <div
                key={person.name}
                className="bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)] text-center transition-all duration-300 hover:border-[rgba(245,196,0,.2)]"
              >
                <div className="w-[140px] h-[140px] rounded-full overflow-hidden border-2 border-[rgba(245,196,0,.3)] mx-auto mb-5 relative">
                  <Image
                    src={person.photo}
                    alt={person.name}
                    fill
                    sizes="140px"
                    className="object-cover"
                    style={{ objectPosition: person.facePosition }}
                  />
                </div>
                <h3 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.02em] text-cream mb-1">
                  {person.name}
                </h3>
                <p className="font-condensed font-bold text-[12px] tracking-[.18em] uppercase text-yellow mb-5">
                  {person.role}
                </p>
                <p className="text-[15px] leading-[1.75] text-muted text-left">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="max-w-[900px] mx-auto mb-[80px]">
          <div className="text-center mb-12">
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              Hvad vi <span className="text-yellow">står for</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-1">
            {[
              {
                title: "Gennemsigtighed",
                desc: "Ingen skjulte gebyrer. Ingen overraskelser. Du ved hvad du betaler og hvad medarbejderen får.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h0" />
                  </svg>
                ),
              },
              {
                title: "Respekt for mennesker",
                desc: "Vi behandler vores folk ordentligt — fair løn, gode vilkår og anerkendelse for det arbejde de laver.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                ),
              },
              {
                title: "Pålidelighed",
                desc: "Når vi siger vi er klar, er vi klar. Vi har bygget vores ry på at holde hvad vi lover — hver gang.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ),
              },
            ].map((v) => (
              <div key={v.title} className="bg-gray p-8 rounded-[2px] border border-[rgba(242,238,230,0.07)] text-center">
                <div className="w-12 h-12 rounded-full bg-[rgba(245,196,0,.1)] flex items-center justify-center mx-auto mb-4">
                  {v.icon}
                </div>
                <h4 className="font-condensed font-bold text-[14px] tracking-[.12em] uppercase text-cream mb-3">
                  {v.title}
                </h4>
                <p className="text-[14px] leading-[1.65] text-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-[600px] mx-auto text-center bg-[#1A1A18] p-12 rounded-[2px] border border-[rgba(245,196,0,.15)]">
          <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] text-cream mb-3">
            Klar til at sætte et kryds?
          </h3>
          <p className="text-[15px] leading-[1.6] text-muted mb-6">
            Uanset om du har brug for én ekstra hånd eller et helt hold — vi er klar.
          </p>
          <Link
            href="/#contract"
            className="inline-block font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase bg-yellow text-black px-10 py-[14px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
          >
            Send en forespørgsel
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
