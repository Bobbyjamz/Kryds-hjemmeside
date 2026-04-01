"use client";

import { useReveal } from "@/hooks/useReveal";

const stats = [
  { num: "300+", label: "Aktive byggefolk" },
  { num: "2t", label: "Gennemsnitlig responstid" },
  { num: "100%", label: "Forsikret personale" },
  { num: "7 år", label: "I branchen" },
];

export default function StatsBar() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      <div className="reveal bg-gray px-[52px] py-7 flex gap-0 border-b border-[rgba(242,238,230,0.07)] max-[900px]:px-5 max-[900px]:grid max-[900px]:grid-cols-2">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex-1 flex flex-col gap-1 px-8 max-[900px]:px-4 max-[900px]:py-[14px] ${
              i < stats.length - 1
                ? "border-r border-[rgba(242,238,230,0.07)] max-[900px]:border-r-0"
                : ""
            } ${i === 0 ? "pl-0 max-[900px]:pl-4" : ""} ${
              i < 2 ? "max-[900px]:border-b max-[900px]:border-[rgba(242,238,230,0.07)]" : ""
            } ${i % 2 === 0 ? "max-[900px]:border-r max-[900px]:border-[rgba(242,238,230,0.07)]" : ""}`}
          >
            <span className="font-condensed font-extrabold text-[40px] text-yellow leading-none tracking-[-.01em]">
              {s.num}
            </span>
            <span className="text-[12px] font-normal tracking-[.06em] text-muted uppercase">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
