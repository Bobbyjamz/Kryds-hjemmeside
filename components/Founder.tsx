"use client";

import { useReveal } from "@/hooks/useReveal";

export default function Founder() {
  const ref = useReveal();

  return (
    <section className="bg-gray py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        Bag Kryds
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        Mød <span className="text-yellow">stifteren</span>
      </h2>
      <div className="reveal grid grid-cols-[1fr_1.4fr] gap-20 items-center mt-16 max-[900px]:grid-cols-1 max-[900px]:gap-10">
        {/* Photo placeholder */}
        <div className="relative">
          <div className="w-full bg-gray2 grayscale-[15%]" style={{ aspectRatio: "3/4" }}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="gallery-placeholder-x" />
              <p className="font-condensed font-semibold text-[12px] tracking-[.16em] uppercase text-muted opacity-80">
                Foto kommer snart
              </p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 border-2 border-yellow max-[900px]:hidden" />
        </div>

        {/* Bio */}
        <div>
          <span className="font-condensed font-bold text-[11px] tracking-[.2em] uppercase text-yellow mb-3 block">
            Stifter
          </span>
          <h3 className="font-condensed font-black text-[clamp(36px,4vw,52px)] uppercase leading-[.95] tracking-[-.01em] mb-2">
            Krystian Seweryn Balasz
          </h3>
          <p className="font-condensed font-semibold text-[16px] tracking-[.08em] uppercase text-yellow mb-7">
            Stifter & direktør, Kryds ApS · København
          </p>
          <p className="text-[16px] leading-[1.8] text-[rgba(242,238,230,.6)] mb-8">
            Med over 7 års erfaring i byggebranchen startede Krystian Kryds med en simpel idé: at gøre det nemt for virksomheder at finde pålidelige, hårdtarbejdende folk til deres byggeprojekter. Fra en enkeltmandsvirksomhed til et netværk af over 300 byggefolk — drevet af personlig service, gennemsigtighed og en passion for at levere.
          </p>
          <div className="flex gap-10">
            <div>
              <span className="font-condensed font-extrabold text-[36px] text-yellow leading-none">7+</span>
              <p className="text-[12px] tracking-[.06em] uppercase text-muted mt-1">År i branchen</p>
            </div>
            <div>
              <span className="font-condensed font-extrabold text-[36px] text-yellow leading-none">300+</span>
              <p className="text-[12px] tracking-[.06em] uppercase text-muted mt-1">Byggefolk</p>
            </div>
            <div>
              <span className="font-condensed font-extrabold text-[36px] text-yellow leading-none">100%</span>
              <p className="text-[12px] tracking-[.06em] uppercase text-muted mt-1">Personlig service</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
