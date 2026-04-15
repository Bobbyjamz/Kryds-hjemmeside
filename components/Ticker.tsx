"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function Ticker() {
  const { t } = useLanguage();

  const items = [
    t("ticker_1"), t("ticker_2"), t("ticker_3"), t("ticker_4"),
    t("ticker_5"), t("ticker_6"), t("ticker_7"), t("ticker_8"),
  ];

  return (
    <div aria-hidden="true" className="bg-yellow h-[46px] overflow-hidden flex items-center whitespace-nowrap">
      <div className="inline-flex animate-ticker">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-condensed font-bold text-[15px] tracking-[.12em] uppercase text-black px-8 flex items-center gap-8"
          >
            {item}
            <span className="w-[6px] h-[6px] bg-[rgba(12,12,10,.3)] rounded-full flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}
