"use client";

import { useReveal } from "@/hooks/useReveal";

const steps = [
  { num: "1", title: "Send en forespørgsel", desc: "Beskriv projektet — opgave, lokation, antal folk og startdato. Vi svarer inden for 2 timer." },
  { num: "2", title: "Vi matcher dit behov", desc: "Vi finder de rette folk fra vores netværk — matchet på faglig baggrund, erfaring og tilgængelighed." },
  { num: "3", title: "Kontrakt & aftale", desc: "Klar aftale med timepriser, vilkår og ansvar — ingen overraskelser på fakturaen bagefter." },
  { num: "4", title: "Vi møder op & leverer", desc: "Personalet er til aftalt tid, udstyret korrekt og klar til at arbejde. Du betaler kun for udført arbejde." },
];

export default function HowItWorks() {
  const ref = useReveal();

  return (
    <section id="how" className="bg-gray py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        Processen
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        Klar på <span className="text-yellow">4 trin</span>
      </h2>
      <div className="steps-grid reveal grid grid-cols-4 gap-0 mt-16 relative max-[900px]:grid-cols-1">
        {steps.map((s) => (
          <div key={s.num} className="group px-6 relative z-[1] max-[900px]:py-4">
            <div className="w-[46px] h-[46px] rounded-full border border-[rgba(245,196,0,.35)] flex items-center justify-center bg-gray mb-7 transition-colors group-hover:bg-yellow group-hover:border-yellow">
              <span className="font-condensed font-extrabold text-[17px] text-yellow transition-colors group-hover:text-black">
                {s.num}
              </span>
            </div>
            <h4 className="font-condensed font-bold text-[17px] uppercase tracking-[.05em] mb-[10px] text-cream">
              {s.title}
            </h4>
            <p className="text-[14px] leading-[1.68] text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
