"use client";

import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorks() {
  const ref = useReveal();
  const { t } = useLanguage();

  const steps = [
    { num: "1", titleKey: "how_1_title", descKey: "how_1_desc" },
    { num: "2", titleKey: "how_2_title", descKey: "how_2_desc" },
    { num: "3", titleKey: "how_3_title", descKey: "how_3_desc" },
    { num: "4", titleKey: "how_4_title", descKey: "how_4_desc" },
  ];

  return (
    <section id="how" className="bg-gray py-[100px] px-[52px]" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        {t("how_eyebrow")}
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        {t("how_h2")} <span className="text-yellow">{t("how_h2_yellow")}</span>
      </h2>
      <div className="steps-grid reveal grid grid-cols-4 gap-0 mt-16 relative">
        {steps.map((s) => (
          <div key={s.num} className="group px-6 relative z-[1]">
            <div className="w-[46px] h-[46px] rounded-full border border-[rgba(245,196,0,.35)] flex items-center justify-center bg-gray mb-7 transition-colors group-hover:bg-yellow group-hover:border-yellow">
              <span className="font-condensed font-extrabold text-[17px] text-yellow transition-colors group-hover:text-black">
                {s.num}
              </span>
            </div>
            <h4 className="font-condensed font-bold text-[17px] uppercase tracking-[.05em] mb-[10px] text-cream">
              {t(s.titleKey)}
            </h4>
            <p className="text-[14px] leading-[1.68] text-muted">{t(s.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
