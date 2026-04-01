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
  { label: "Kombinerede opgaver", img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80", alt: "Byggehold arbejder sammen på projekt" },
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
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {/* Fallback placeholder (visible when image is missing) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray2 -z-10">
              <div className="gallery-placeholder-x" />
              <p className="font-condensed font-semibold text-[12px] tracking-[.16em] uppercase text-muted opacity-80">
                {item.label}
              </p>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,12,10,.75)] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="absolute bottom-4 left-4 font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-yellow opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
