"use client";

import { useReveal } from "@/hooks/useReveal";

const items = [
  { title: "Klar til at tage fat", desc: "Vores folk er vant til fysisk arbejde og møder forberedte. Ingen indkøringsperiode — de er produktive fra dag ét." },
  { title: "Forsikret & screenet", desc: "Alt personale er ansvarsforsikret, har ren straffeattest og er grundigt onboardet. Du arbejder trygt på pladsen." },
  { title: "Klare kontrakter", desc: "Ingen overraskelser. Tydelige kontrakter med faste timepriser, definerede opgaver og klare vilkår fra start." },
  { title: "Skalér efter behov", desc: "Enkeltpersoner til hele hold — enkeltdage eller hele projekter. Vi tilpasser størrelse og varighed til dit projekt." },
  { title: "Hurtig mobilisering", desc: "Projektet rykkede frem? Vi har netværket og kan mobilisere hurtigt — selv til akutte situationer med kort varsel." },
  { title: "Lokal kendskab", desc: "Vi er baseret i København og kender byggebranchen lokalt. Vores folk kender husregler, adgangsforhold og arbejdsmiljøkrav." },
];

export default function WhyKryds() {
  const ref = useReveal();

  return (
    <section id="why" className="bg-black py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        Hvorfor Kryds
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        Vi er <span className="text-yellow">anderledes</span>
      </h2>
      <div className="reveal grid grid-cols-2 gap-[1px] mt-[60px] bg-[rgba(242,238,230,0.07)] border border-[rgba(242,238,230,0.07)] max-[900px]:grid-cols-1">
        {items.map((item) => (
          <div key={item.title} className="why-item bg-black p-11 flex gap-6 items-start transition-colors hover:bg-gray">
            <div className="why-xicon" />
            <div>
              <h4 className="font-condensed font-bold text-[20px] uppercase tracking-[.04em] mb-2 text-cream">
                {item.title}
              </h4>
              <p className="text-[14px] leading-[1.72] text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
