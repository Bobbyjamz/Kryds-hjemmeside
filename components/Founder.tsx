"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Founder() {
  const ref = useReveal();
  const { t } = useLanguage();

  return (
    <section className="bg-gray py-[80px] px-[52px] max-[900px]:py-[60px] max-[900px]:px-5" ref={ref}>
      <div className="max-w-[720px] mx-auto text-center">
        <div className="eyebrow reveal flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
          {t("team_eyebrow")}
        </div>
        <h2 className="reveal font-condensed font-black text-[clamp(32px,4vw,48px)] uppercase leading-[.95] tracking-[-.01em] mb-6">
          {t("team_h2")} <span className="text-yellow">{t("team_h2_yellow")}</span>
        </h2>
        <p className="reveal text-[16px] leading-[1.85] text-[rgba(242,238,230,.6)] mb-8">
          {t("team_bio")}
        </p>
        <Link
          href="/om-os"
          className="reveal inline-flex items-center gap-2 font-condensed font-bold text-[12px] tracking-[.18em] uppercase text-yellow border border-[rgba(245,196,0,.35)] px-6 py-3 rounded-[2px] hover:bg-[rgba(245,196,0,.08)] hover:border-yellow transition-colors"
        >
          {t("team_link")}
        </Link>
      </div>
    </section>
  );
}
