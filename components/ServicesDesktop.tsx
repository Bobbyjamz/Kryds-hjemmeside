"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const CARDS = [
  { num: "01", titleKey: "svc_1_title", descKey: "svc_1_desc", tagsKey: "svc_1_tags" },
  { num: "02", titleKey: "svc_2_title", descKey: "svc_2_desc", tagsKey: "svc_2_tags" },
  { num: "03", titleKey: "svc_3_title", descKey: "svc_3_desc", tagsKey: "svc_3_tags" },
  { num: "04", titleKey: "svc_4_title", descKey: "svc_4_desc", tagsKey: "svc_4_tags" },
  { num: "05", titleKey: "svc_5_title", descKey: "svc_5_desc", tagsKey: "svc_5_tags" },
  { num: "06", titleKey: "svc_6_title", descKey: "svc_6_desc", tagsKey: "svc_6_tags" },
  { num: "07", titleKey: "svc_7_title", descKey: "svc_7_desc", tagsKey: "svc_7_tags" },
  { num: "08", titleKey: "svc_9_title", descKey: "svc_9_desc", tagsKey: "svc_9_tags" },
  { num: "09", titleKey: "svc_8_title", descKey: "svc_8_desc", tagsKey: "svc_8_tags" },
];

export default function ServicesDesktop() {
  const { t } = useLanguage();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".service-card");
    if (!cards) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("in");
          }
        });
      },
      { threshold: 0.1 }
    );

    cards.forEach((card, i) => {
      (card as HTMLElement).style.transitionDelay = `${i * 60}ms`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="services"
      className="bg-black2 py-[100px] px-[52px]"
    >
      <div className="eyebrow flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        {t("svc_eyebrow")}
      </div>
      <h2 className="font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        {t("svc_h2")}<br />
        <span className="text-yellow">{t("svc_h2_yellow")}</span>
      </h2>

      <div
        ref={gridRef}
        className="grid grid-cols-3 mt-[60px]"
        style={{ gap: "1px", background: "rgba(242,238,230,0.07)", border: "1px solid rgba(242,238,230,0.07)" }}
      >
        {CARDS.map((card) => (
          <div key={card.num} className="service-card">
            <div className="svc-watermark" />
            <span className="font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow block mb-6">
              — {card.num}
            </span>
            <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] mb-3 text-cream">
              {t(card.titleKey)}
            </h3>
            <p className="text-[14px] leading-[1.72] text-muted mb-6">
              {t(card.descKey)}
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {t(card.tagsKey)
                .split(" · ")
                .map((tag) => (
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
