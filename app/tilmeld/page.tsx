"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TilmeldWizard from "@/components/tilmeld/TilmeldWizard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TilmeldPage() {
  const { t, lang } = useLanguage();
  return (
    <main className="bg-black text-cream min-h-screen">
      <Nav />
      <section className="pt-[140px] pb-[100px] px-[52px] max-[900px]:pt-[110px] max-[900px]:px-5 max-[900px]:pb-[70px]">
        <div className="max-w-[820px] mx-auto mb-12">
          <div className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">
            {t("tilmeld_eyebrow")}
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,4.8vw,64px)] uppercase leading-[.95] tracking-[-.01em] mb-4">
            {t("tilmeld_h1_1")} <span className="text-yellow">{t("tilmeld_h1_yellow")}</span>
          </h1>
          <p className="text-[16px] leading-[1.6] text-muted max-w-[620px] mb-6">
            {t("tilmeld_subtitle")}
          </p>

          {/* Allerede-medarbejder login-prompt */}
          <div className="flex items-center gap-3 flex-wrap bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] px-5 py-4 max-w-[620px]">
            <span className="text-[14px] text-muted">
              {lang === "da" ? "Allerede medarbejder?" : "Already an employee?"}
            </span>
            <Link
              href="/medarbejder/login"
              className="inline-flex items-center gap-2 font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase border border-yellow text-yellow hover:bg-yellow hover:text-black px-4 py-[8px] rounded-[2px] no-underline transition-colors"
            >
              {lang === "da" ? "Log ind" : "Log in"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
        <TilmeldWizard />
      </section>
      <Footer />
    </main>
  );
}
