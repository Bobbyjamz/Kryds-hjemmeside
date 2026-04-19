"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LegalHeader() {
  const { t } = useLanguage();
  return (
    <>
      <Link href="/" className="inline-flex items-center gap-2 font-condensed font-semibold text-[13px] tracking-[.1em] uppercase text-muted no-underline hover:text-yellow mb-8 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {t("common_back_short")}
      </Link>

      <div className="mb-10">
        <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">{t("legal_h_medarb_eyebrow")}</p>
        <h1 className="font-condensed font-black text-[clamp(28px,4.5vw,50px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-4">
          {t("legal_h_medarb")}
        </h1>
        <p className="text-[15px] text-muted leading-[1.7]">
          {t("legal_version_line")}
        </p>
      </div>
    </>
  );
}
