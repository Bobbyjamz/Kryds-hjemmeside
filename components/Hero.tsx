"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

function scrollToContract() {
  const el = document.getElementById("contract");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("contract-pulse");
  void el.offsetWidth;
  el.classList.add("contract-pulse");
  el.addEventListener("animationend", () => el.classList.remove("contract-pulse"), { once: true });
}

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="min-h-screen flex flex-col justify-end px-[52px] pt-[80px] pb-[88px] relative overflow-hidden max-[900px]:px-5 max-[900px]:pt-[70px] max-[900px]:pb-16">
      <div className="hero-lines" />
      <div
        className="hero-bigx animate-spin-slow max-[900px]:opacity-40"
        style={{ width: "min(52vw,660px)", height: "min(52vw,660px)" }}
      />
      <div className="hero-ring" style={{ width: 680, height: 680, right: "calc(6% - 340px + 5vw)" }} />
      <div className="hero-ring" style={{ width: 420, height: 420, right: "calc(6% - 210px + 5vw)", borderColor: "rgba(245,196,0,.1)" }} />
      <div className="hero-ring" style={{ width: 200, height: 200, right: "calc(6% - 100px + 5vw)", borderColor: "rgba(245,196,0,.15)" }} />

      {/* Fade overlays — use CSS variables so they adapt to theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-black from-[28%] to-transparent to-[62%] z-[1]" />
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(to top, var(--color-black) 0%, transparent 60%)" }}
      />

      {/* Content */}
      <div className="relative z-[2]">
        <div className="hero-eyebrow flex items-center gap-[14px] font-condensed font-semibold text-[12px] tracking-[.22em] uppercase text-yellow mb-[22px] opacity-0 animate-fadeup" style={{ animationDelay: ".2s" }}>
          {t("hero_eyebrow")}
        </div>
        <h1 className="font-condensed font-black text-[clamp(52px,11vw,148px)] leading-[.9] tracking-[-.01em] uppercase max-w-[820px] opacity-0 animate-fadeup" style={{ animationDelay: ".35s" }}>
          {t("hero_h1_1")}<br />
          <span className="text-outline">{t("hero_h1_2")}</span><br />
          <span className="text-yellow">{t("hero_h1_3")}</span>
        </h1>
        <p className="font-condensed font-semibold text-[20px] tracking-[.08em] text-muted mt-6 mb-11 opacity-0 animate-fadeup" style={{ animationDelay: ".5s" }}>
          — <em className="text-yellow not-italic">{t("hero_catch").replace("— ", "")}</em>
        </p>
        <div className="flex items-end justify-between opacity-0 animate-fadeup max-[900px]:flex-col max-[900px]:gap-7 max-[900px]:items-start" style={{ animationDelay: ".65s" }}>
          <p className="max-w-[400px] text-[16px] leading-[1.75] text-muted">
            {t("hero_desc")}
          </p>
          <div className="flex gap-[14px] items-center">
            <button
              onClick={scrollToContract}
              className="bg-yellow text-black font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase px-10 py-4 rounded-[2px] no-underline inline-block transition-all hover:bg-yellow2 hover:-translate-y-[1px] cursor-pointer border-none"
            >
              {t("hero_btn_book")}
            </button>
            <Link href="/ydelser" className="border border-[var(--border)] text-cream font-condensed font-semibold text-[14px] tracking-[.1em] uppercase px-[30px] py-[15px] rounded-[2px] no-underline inline-block transition-colors hover:border-yellow hover:text-yellow">
              {t("hero_btn_services")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
