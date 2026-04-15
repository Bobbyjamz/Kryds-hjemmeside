"use client";

import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WhyKryds() {
  const ref = useReveal();
  const { t } = useLanguage();

  const items = [
    { titleKey: "why_1_title", descKey: "why_1_desc" },
    { titleKey: "why_2_title", descKey: "why_2_desc" },
    { titleKey: "why_3_title", descKey: "why_3_desc" },
    { titleKey: "why_4_title", descKey: "why_4_desc" },
    { titleKey: "why_5_title", descKey: "why_5_desc" },
    { titleKey: "why_6_title", descKey: "why_6_desc" },
  ];

  return (
    <section id="why" className="bg-black py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        {t("why_eyebrow")}
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        {t("why_h2")} <span className="text-yellow">{t("why_h2_yellow")}</span>
      </h2>
      <div
        className="reveal grid grid-cols-2 gap-[1px] mt-[60px] max-[900px]:grid-cols-1"
        style={{ background: "rgba(242,238,230,0.07)", border: "1px solid rgba(242,238,230,0.07)" }}
      >
        {items.map((item) => (
          <div key={item.titleKey} className="why-item bg-black p-11 flex gap-6 items-start transition-colors hover:bg-gray">
            <div className="why-xicon" />
            <div>
              <h4 className="font-condensed font-bold text-[20px] uppercase tracking-[.04em] mb-2 text-cream">
                {t(item.titleKey)}
              </h4>
              <p className="text-[14px] leading-[1.72] text-muted">{t(item.descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
