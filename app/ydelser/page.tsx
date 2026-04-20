"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const BRANCH_IMGS = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80",
  "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
  "https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=900&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
];

const CARDS = [
  { num: "01", nameKey: "branch_1_name", subKey: "branch_1_sub", descKey: "svc_1_desc", tagsKey: "svc_1_tags" },
  { num: "02", nameKey: "branch_2_name", subKey: "branch_2_sub", descKey: "svc_2_desc", tagsKey: "svc_2_tags" },
  { num: "03", nameKey: "branch_3_name", subKey: "branch_3_sub", descKey: "svc_3_desc", tagsKey: "svc_3_tags" },
  { num: "04", nameKey: "branch_4_name", subKey: "branch_4_sub", descKey: "svc_4_desc", tagsKey: "svc_4_tags" },
  { num: "05", nameKey: "branch_5_name", subKey: "branch_5_sub", descKey: "svc_5_desc", tagsKey: "svc_5_tags" },
  { num: "06", nameKey: "branch_6_name", subKey: "branch_6_sub", descKey: "svc_6_desc", tagsKey: "svc_6_tags" },
  { num: "07", nameKey: "branch_7_name", subKey: "branch_7_sub", descKey: "svc_7_desc", tagsKey: "svc_7_tags" },
];

export default function YdelserPage() {
  const { t } = useLanguage();

  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px] max-[900px]:pb-[70px]">
        {/* Back */}
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

        {/* Services grid — image cards */}
        <div className="max-w-[1240px] mx-auto grid grid-cols-3 gap-[18px] max-[1050px]:grid-cols-2 max-[720px]:grid-cols-1">
          {CARDS.map((card, i) => (
            <article
              key={card.num}
              className="group relative overflow-hidden rounded-[3px] border border-[var(--border)] bg-gray flex flex-col"
            >
              {/* Image header */}
              <div className="relative h-[200px] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[600ms] group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${BRANCH_IMGS[i]}')`,
                    filter: "grayscale(25%) brightness(0.7) saturate(0.9)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(12,12,10,.9) 0%, rgba(12,12,10,.35) 55%, rgba(12,12,10,.15) 100%)",
                  }}
                />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <span className="font-condensed font-bold text-[11px] tracking-[.2em] uppercase text-cream opacity-70 mb-1">
                    — {card.num}
                  </span>
                  <h3 className="font-condensed font-extrabold text-[24px] uppercase tracking-[.02em] text-cream leading-[1.05] drop-shadow-sm">
                    {t(card.nameKey)}
                  </h3>
                  <p className="font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow uppercase mt-[6px]">
                    {t(card.subKey)}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-[14px] leading-[1.72] text-muted mb-5">{t(card.descKey)}</p>
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
                  className="mt-auto inline-flex items-center gap-2 font-condensed font-bold text-[12px] tracking-[.14em] uppercase text-yellow no-underline transition-all hover:gap-3"
                >
                  {t("svc_cta")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Why Kryds */}
        <section className="max-w-[1100px] mx-auto mt-[90px]">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">
              {t("ydelser_why_eyebrow")}
            </div>
            <h2 className="font-condensed font-black text-[clamp(30px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              {t("ydelser_why_h2")} <span className="text-yellow">{t("ydelser_why_h2_yellow")}</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-1">
            {[
              {
                title: t("ydelser_why_1_title"),
                desc: t("ydelser_why_1_desc"),
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z" />
                  </svg>
                ),
              },
              {
                title: t("ydelser_why_2_title"),
                desc: t("ydelser_why_2_desc"),
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                    <path d="M19 8v6M22 11h-6" />
                  </svg>
                ),
              },
              {
                title: t("ydelser_why_3_title"),
                desc: t("ydelser_why_3_desc"),
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray border border-[var(--border)] p-7 rounded-[2px]"
              >
                <div
                  className="w-12 h-12 rounded-[12px] flex items-center justify-center text-yellow mb-5"
                  style={{ background: "rgba(245,196,0,.1)", border: "1px solid rgba(245,196,0,.25)" }}
                >
                  {item.icon}
                </div>
                <h3 className="font-condensed font-extrabold text-[20px] uppercase tracking-[.02em] text-cream mb-2">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="max-w-[640px] mx-auto text-center bg-gray p-12 rounded-[2px] border border-[var(--border)] mt-[90px] shadow-[0_10px_40px_rgba(0,0,0,.12)]">
          <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] text-cream mb-3">
            {t("svc_cta_h3")}
          </h3>
          <p className="text-[15px] leading-[1.6] text-muted mb-6">{t("svc_cta_desc")}</p>
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
