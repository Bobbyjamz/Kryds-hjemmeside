"use client";

import { useReveal } from "@/hooks/useReveal";

export default function Founder() {
  const ref = useReveal();

  return (
    <section className="bg-gray py-[80px] px-[52px] max-[900px]:py-[60px] max-[900px]:px-5" ref={ref}>
      <div className="max-w-[720px] mx-auto text-center">
        <div className="eyebrow reveal flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
          Om os
        </div>
        <h2 className="reveal font-condensed font-black text-[clamp(32px,4vw,48px)] uppercase leading-[.95] tracking-[-.01em] mb-6">
          Vi som <span className="text-yellow">team</span>
        </h2>
        <p className="reveal text-[16px] leading-[1.85] text-[rgba(242,238,230,.6)]">
          Hos Kryds fokuserer vi på kvalitet og aflastning af de tunge opgaver, der kræver ekstra hænder. Vi stiller med pålidelige, erfarne folk — klar til at tage fat fra dag ét. Uanset om det er renovering, events eller byggepladsarbejde, sørger vi for at dit projekt kører glat og effektivt.
        </p>
      </div>
    </section>
  );
}
