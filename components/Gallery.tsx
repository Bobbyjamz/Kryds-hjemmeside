"use client";

import { useReveal } from "@/hooks/useReveal";
import Image from "next/image";

const galleryItems = [
  { label: "Renovering", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80", alt: "Håndværker renoverer lejlighed indendørs" },
  { label: "Maling & spartling", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80", alt: "Maler arbejder på væg med rulle" },
  { label: "Havearbejde", img: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=800&q=80", alt: "Gartner der arbejder og hjælper i haven" },
  { label: "Montering", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80", alt: "Håndværker monterer med værktøj" },
  { label: "Byggepladsbehjælp", img: "https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=800&q=80", alt: "Bygningsarbejdere bærer materialer på byggeplads" },
  { label: "Nedrivning & rydning", img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80", alt: "Arbejder river mur ned med værktøj" },
  { label: "Flise & anlægsarbejde", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", alt: "Flisemontør lægger gulvfliser" },
  { label: "Events & sceneopbygning", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80", alt: "Musikscene og koncertopsætning" },
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
      <div className="reveal grid grid-cols-3 gap-[2px] mt-[60px] max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
        {galleryItems.map((item) => (
          <div
            key={item.label}
            className="group relative overflow-hidden bg-gray2"
            style={{ aspectRatio: "4/3", minHeight: 220 }}
          >
            <Image
              src={item.img}
              alt={item.alt}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,12,10,.75)] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="absolute bottom-4 left-4 font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-yellow opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {item.label}
            </span>
          </div>
        ))}

        {/* Kombinerede opgaver — X med brancher */}
        <div
          className="group relative overflow-hidden flex flex-col items-center justify-center text-center bg-[#1A1A18] border border-[rgba(245,196,0,.12)] transition-all duration-500 hover:bg-[#222220] hover:border-[rgba(245,196,0,.3)]"
          style={{ aspectRatio: "4/3", minHeight: 220 }}
        >
          {/* Large X background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] group-hover:opacity-[0.14] transition-opacity duration-500">
            <svg width="240" height="240" viewBox="0 0 90 90" className="transition-transform duration-700 group-hover:rotate-45">
              <line x1="8" y1="8" x2="82" y2="82" stroke="#F5C400" strokeWidth="14" strokeLinecap="square" />
              <line x1="82" y1="8" x2="8" y2="82" stroke="#F2EEE6" strokeWidth="14" strokeLinecap="square" />
            </svg>
          </div>
          <div className="relative z-10 px-6">
            <span className="font-condensed font-bold text-[10px] tracking-[.22em] uppercase text-yellow block mb-3">
              Kombinerede opgaver
            </span>
            <h3 className="font-condensed font-black text-[clamp(22px,2.8vw,30px)] uppercase leading-[1.05] tracking-[-.01em] text-cream mb-3">
              Alle brancher<br /><span className="text-yellow">samlet i ét</span>
            </h3>
            <div className="flex flex-wrap justify-center gap-[5px] max-w-[280px]">
              {["Renovering", "Maling", "Montering", "Events", "Nedrivning", "Fliser"].map((t) => (
                <span key={t} className="bg-[rgba(245,196,0,.08)] border border-[rgba(245,196,0,.18)] text-yellow font-condensed font-bold text-[9px] tracking-[.1em] uppercase px-2 py-[3px] rounded-[1px]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
