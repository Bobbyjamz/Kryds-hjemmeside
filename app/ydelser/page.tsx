"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const CARDS = [
  { num: "01", titleKey: "svc_1_title", descKey: "svc_1_desc", tagsKey: "svc_1_tags" },
  { num: "02", titleKey: "svc_2_title", descKey: "svc_2_desc", tagsKey: "svc_2_tags" },
  { num: "03", titleKey: "svc_3_title", descKey: "svc_3_desc", tagsKey: "svc_3_tags" },
  { num: "04", titleKey: "svc_4_title", descKey: "svc_4_desc", tagsKey: "svc_4_tags" },
  { num: "05", titleKey: "svc_5_title", descKey: "svc_5_desc", tagsKey: "svc_5_tags" },
  { num: "06", titleKey: "svc_6_title", descKey: "svc_6_desc", tagsKey: "svc_6_tags" },
  { num: "07", titleKey: "svc_7_title", descKey: "svc_7_desc", tagsKey: "svc_7_tags" },
];

export default function YdelserPage() {
  const { t } = useLanguage();

  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px] max-[900px]:pb-[70px]">
        {/* Back arrow */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-condensed font-semibold text-[13px] tracking-[.1em] uppercase text-muted no-underline transition-colors hover:text-yellow mb-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t("common_back_home")}
        </Link>

        {/* Hero */}
        <div className="text-center max-w-[760px] mx-auto mb-[70px]">
          <div className="eyebrow flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
            {t("svc_eyebrow")}
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,5vw,64px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-5">
            {t("svc_h2")} <span className="text-yellow">{t("svc_h2_yellow")}</span>
          </h1>
          <p className="text-[17px] leading-[1.75] text-muted max-w-[560px] mx-auto">
            {t("svc_page_subtitle")}
          </p>
        </div>

        {/* Services grid */}
        <div
          className="max-w-[1200px] mx-auto grid grid-cols-3 max-[1050px]:grid-cols-2 max-[720px]:grid-cols-1 gap-[1px] bg-[rgba(128,128,128,0.12)] border border-[rgba(128,128,128,0.12)]"
        >
          {CARDS.map((card) => (
            <div
              key={card.num}
              className="service-card bg-black2 p-[44px] relative overflow-hidden transition-colors duration-300 hover:bg-gray"
            >
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
              <div className="flex flex-wrap gap-[6px] mb-6">
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
              <Link
                href="/#contract"
                className="inline-flex items-center gap-2 font-condensed font-bold text-[12px] tracking-[.14em] uppercase text-yellow no-underline transition-all hover:gap-3"
              >
                {t("svc_cta")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="max-w-[640px] mx-auto text-center bg-gray p-12 rounded-[2px] border border-[rgba(128,128,128,0.12)] mt-[80px] shadow-[0_10px_40px_rgba(0,0,0,.12)]">
          <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] text-cream mb-3">
            {t("svc_cta_h3")}
          </h3>
          <p className="text-[15px] leading-[1.6] text-muted mb-6">
            {t("svc_cta_desc")}
          </p>
          <Link
            href="/#contract"
            className="inline-block font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase bg-yellow text-black px-10 py-[14px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
          >
            {t("svc_cta_btn")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
