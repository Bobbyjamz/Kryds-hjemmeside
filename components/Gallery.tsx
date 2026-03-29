"use client";

import { useReveal } from "@/hooks/useReveal";

const galleryItems = [
  "Renovering",
  "Maling & spartling",
  "Montering",
  "Havearbejde",
  "Byggepladsbehjælp",
  "Nedrivning & rydning",
];

export default function Gallery() {
  const ref = useReveal();

  return (
    <section className="bg-black py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        Vores arbejde
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        Se hvad vi <span className="text-yellow">leverer</span>
      </h2>
      <div className="reveal grid grid-cols-3 gap-[2px] mt-[60px] max-[900px]:grid-cols-2">
        {galleryItems.map((item) => (
          <div key={item} className="group relative overflow-hidden bg-gray2 cursor-none" style={{ aspectRatio: "4/3", minHeight: 260 }}>
            {/* Placeholder */}
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray2 absolute inset-0">
              <div className="gallery-placeholder-x" />
              <p className="font-condensed font-semibold text-[12px] tracking-[.16em] uppercase text-muted opacity-80">
                {item}
              </p>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,12,10,.7)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute bottom-4 left-4 font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-yellow opacity-0 transition-opacity group-hover:opacity-100">
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
