"use client";

import { useReveal } from "@/hooks/useReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { useLanguage } from "@/contexts/LanguageContext";

function AnimatedStat({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { value, ref } = useCountUp(target, 1400);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="flex flex-col gap-1">
      <span className="font-condensed font-extrabold text-[40px] text-yellow leading-none tracking-[-.01em]">
        {value}{suffix}
      </span>
      <span className="text-[12px] font-normal tracking-[.06em] text-muted uppercase">
        {label}
      </span>
    </div>
  );
}

function StaticStat({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-condensed font-extrabold text-[40px] text-yellow leading-none tracking-[-.01em]">
        {num}
      </span>
      <span className="text-[12px] font-normal tracking-[.06em] text-muted uppercase">
        {label}
      </span>
    </div>
  );
}

export default function StatsBar() {
  const ref = useReveal();
  const { t } = useLanguage();

  return (
    <div ref={ref}>
      <div className="reveal bg-gray px-[52px] py-7 flex gap-0 border-b border-[rgba(242,238,230,0.07)] max-[900px]:px-5 max-[900px]:grid max-[900px]:grid-cols-2">
        {[
          {
            node: <AnimatedStat target={50} suffix="+" label={t("stats_1")} />,
            borderRight: true,
            mobileRight: true,
            mobileBottom: true,
            first: true,
          },
          {
            node: <StaticStat num="2t" label={t("stats_2")} />,
            borderRight: true,
            mobileRight: false,
            mobileBottom: true,
          },
          {
            node: <StaticStat num="100%" label={t("stats_3")} />,
            borderRight: true,
            mobileRight: true,
            mobileBottom: false,
          },
          {
            node: <AnimatedStat target={3} suffix=" år" label={t("stats_4")} />,
            borderRight: false,
            mobileRight: false,
            mobileBottom: false,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={[
              "flex-1 flex flex-col gap-1 px-8",
              "max-[900px]:px-4 max-[900px]:py-[14px]",
              s.borderRight ? "border-r border-[rgba(242,238,230,0.07)] max-[900px]:border-r-0" : "",
              s.first ? "pl-0 max-[900px]:pl-4" : "",
              s.mobileBottom ? "max-[900px]:border-b max-[900px]:border-[rgba(242,238,230,0.07)]" : "",
              s.mobileRight ? "max-[900px]:border-r max-[900px]:border-[rgba(242,238,230,0.07)]" : "",
            ].join(" ")}
          >
            {s.node}
          </div>
        ))}
      </div>
    </div>
  );
}
