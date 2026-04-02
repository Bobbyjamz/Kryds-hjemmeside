import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vores historie — Kryds",
  description:
    "Historien bag Kryds — fortalt af dem der startede det. Ingen corporate-speak, bare ægte ord.",
};

export default function GhostPage() {
  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px] max-[900px]:pb-[70px]">
        {/* Back arrow */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-condensed font-semibold text-[13px] tracking-[.1em] uppercase text-muted no-underline transition-colors hover:text-yellow mb-12"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Tilbage til forsiden
        </Link>

        <div className="max-w-[680px] mx-auto">
          {/* Eyebrow */}
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
            Vores historie
          </p>

          {/* Headline */}
          <h1 className="font-condensed font-black text-[clamp(38px,5vw,60px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-10">
            Ærligt talt —<br /><span className="text-yellow">sådan startede det</span>
          </h1>

          {/* Intro */}
          <p className="text-[18px] leading-[1.85] text-[rgba(242,238,230,.75)] mb-8 font-light">
            Vi er ikke et stort firma med et fancy kontor og en HR-afdeling. Vi er to fyre der har prøvet at stå på begge sider af problemet — og besluttede at gøre noget ved det.
          </p>

          <hr className="border-[rgba(242,238,230,0.08)] mb-10" />

          {/* Story blocks */}
          <div className="space-y-10 text-[16px] leading-[1.9] text-[rgba(242,238,230,.65)] font-light">
            <p>
              <span className="text-cream font-medium">Krystian startede i byggebranchen som ung.</span> Han prøvede det meste — renovering, maling, havearbejde, byggepladser. Han var altid den man ringede til, fordi han mødte til tiden og lavede arbejdet ordentligt. Men han oplevede også den anden side: virksomheder der desperat ledte efter folk i sidste øjeblik. Ingen systemer. Ingen overblik. Bare stress og tilfældigheder.
            </p>

            <p>
              Karl kom fra en lidt anden vinkel. Han er vant til at koordinere, planlægge og holde styr på tingene, når der er mange bolde i luften. Da Krystian fortalte ham om ideen, tog det ikke lang tid.
            </p>

            <blockquote className="border-l-2 border-yellow pl-6 py-1 my-8">
              <p className="text-[17px] leading-[1.8] text-cream italic font-light">
                &ldquo;Vi tænkte — det her er jo ikke raketvidenskab. Folk mangler arbejde, virksomheder mangler hænder. Nogen skal bare koble dem ordentligt sammen.&rdquo;
              </p>
              <p className="text-[13px] text-muted mt-3 not-italic">— Krystian Seweryn Balasz, stifter</p>
            </blockquote>

            <p>
              Så det er det vi gør. Vi kender folk der kan arbejde. Vi kender virksomheder der har brug for dem. Og vi sørger for at det foregår på ordentlige vilkår — klar aftale, fair løn, og en kontaktperson der rent faktisk svarer sin telefon.
            </p>

            <p>
              Vi er ikke perfekte. Vi er stadig ved at bygge noget, og vi lærer undervejs. Men vi er seriøse med det vi lover, og vi behandler folk — både kunder og byggefolk — med respekt. Det er måske ikke den vildeste elevator pitch, men det er sandheden.
            </p>
          </div>

          <hr className="border-[rgba(242,238,230,0.08)] my-10" />

          {/* Team mini-section */}
          <h2 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-6">
            Folkene bag
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-12 max-[600px]:grid-cols-1">
            {[
              { name: "Krystian Seweryn Balasz", role: "Stifter", photo: "/krystian.jpg", pos: "center 22%", quote: "Jeg har selv stået med skovlen. Jeg ved hvad det vil sige at møde til et job og bare ønske at det var organiseret bedre." },
              { name: "Karl Kristian Ravn", role: "Partner & Driftsansvarlig", photo: "/karl.jpg", pos: "center 50%", quote: "Jeg elsker det når tingene kører. Og det gør de, når folk føler sig hørt og ved hvad der sker." },
            ].map((p) => (
              <div key={p.name} className="bg-gray p-6 rounded-[2px] border border-[rgba(242,238,230,0.07)] flex gap-5 items-start">
                <div className="w-[64px] h-[64px] rounded-full overflow-hidden border border-[rgba(245,196,0,.25)] flex-shrink-0 relative">
                  <Image
                    src={p.photo}
                    alt={p.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    style={{ objectPosition: p.pos, transform: "scale(1.35)", transformOrigin: p.pos }}
                  />
                </div>
                <div>
                  <p className="font-condensed font-bold text-[13px] text-cream mb-[2px]">{p.name}</p>
                  <p className="font-condensed text-[11px] tracking-[.14em] uppercase text-yellow mb-3">{p.role}</p>
                  <p className="text-[13px] leading-[1.65] text-muted italic">&ldquo;{p.quote}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="bg-[#1A1A18] p-10 rounded-[2px] border border-[rgba(245,196,0,.12)] text-center">
            <p className="text-[15px] leading-[1.7] text-muted mb-2">
              Har du spørgsmål, en opgave eller bare vil snakke?
            </p>
            <p className="text-[17px] text-cream mb-6">
              Ring eller skriv — vi er faktisk tilgængelige.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/#contract"
                className="inline-block font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase bg-yellow text-black px-8 py-[13px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
              >
                Send en besked
              </Link>
              <a
                href="tel:+4542778866"
                className="inline-block font-condensed font-semibold text-[13px] tracking-[.1em] uppercase border border-[rgba(242,238,230,.2)] text-cream px-8 py-[13px] rounded-[2px] no-underline transition-colors hover:border-yellow hover:text-yellow"
              >
                +45 42 77 88 66
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
