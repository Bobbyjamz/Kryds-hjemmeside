"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TilmeldWizard from "@/components/tilmeld/TilmeldWizard";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TilmeldPage() {
  const { t } = useLanguage();
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
          <p className="text-[16px] leading-[1.6] text-muted max-w-[620px]">
            {t("tilmeld_subtitle")}
          </p>
        </div>
        <TilmeldWizard />
      </section>
      <Footer />
    </main>
  );
}
