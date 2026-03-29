"use client";

import { useReveal } from "@/hooks/useReveal";
import { useServiceStagger } from "@/hooks/useServiceStagger";
import { services } from "@/lib/services-data";

export default function Services() {
  const revealRef = useReveal();
  const gridRef = useServiceStagger();

  return (
    <section id="services" className="bg-black2 py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={revealRef}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        Vores ydelser
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        Alt inden for<br /><span className="text-yellow">byggeprojekter</span>
      </h2>
      <div
        ref={gridRef}
        className="grid grid-cols-3 gap-[1px] mt-[60px] bg-[rgba(242,238,230,0.07)] border border-[rgba(242,238,230,0.07)] max-[900px]:grid-cols-1"
      >
        {services.map((s) => (
          <div key={s.num} className="service-card">
            <div className="svc-watermark" />
            <span className="font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow mb-6 block">
              — {s.num}
            </span>
            <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] mb-3 text-cream">
              {s.title}
            </h3>
            <p className="text-[14px] leading-[1.72] text-[rgba(242,238,230,.5)] mb-6">
              {s.desc}
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {s.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[rgba(245,196,0,.08)] border border-[rgba(245,196,0,.18)] text-yellow font-condensed font-bold text-[10px] tracking-[.12em] uppercase px-[10px] py-1 rounded-[1px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
