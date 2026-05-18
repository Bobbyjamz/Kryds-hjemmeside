"use client";

import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Testimonials-sektion.
 *
 * NOTE: Disse er placeholder-citater. Erstat med rigtige kundeudtalelser
 * (med tilladelse) når de er indsamlet — kontakt jeres seneste 3-5 kunder
 * og bed om en kort kommentar + tilladelse til at vise navn/firma.
 */

type Testimonial = {
  quote: { da: string; en: string };
  author: string;
  role: { da: string; en: string };
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote: {
      da: "Vi havde brug for ekstra hænder med to dages varsel. KrydsByg leverede tre erfarne folk dagen efter — løste flytteopgaven uden problemer.",
      en: "We needed extra hands with two days' notice. KrydsByg delivered three experienced workers the next day — handled the move without issues.",
    },
    author: "Mikael S.",
    role: { da: "Projektleder, byggefirma i København", en: "Project lead, construction firm in Copenhagen" },
  },
  {
    quote: {
      da: "Professionelle, mødte til tiden, og prisen var som aftalt. Vi bruger dem fast til vores byggeprojekter nu.",
      en: "Professional, on time, and the price matched the quote. We use them regularly for our construction projects now.",
    },
    author: "Anne L.",
    role: { da: "Indkøbschef, ejendomsudvikler", en: "Procurement lead, property developer" },
  },
  {
    quote: {
      da: "God kommunikation hele vejen. Krystian forstod opgaven med det samme og fandt det rigtige hold til vores renovering.",
      en: "Great communication throughout. Krystian understood the brief immediately and found the right team for our renovation.",
    },
    author: "Thomas H.",
    role: { da: "Privatkunde, lejlighedsrenovering", en: "Private customer, apartment renovation" },
  },
];

export default function Testimonials() {
  const ref = useReveal();
  const { lang } = useLanguage();

  return (
    <section className="bg-black2 py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="max-w-[1240px] mx-auto">
        <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
          {lang === "da" ? "Det siger kunderne" : "What clients say"}
        </div>
        <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em] mb-14 max-[900px]:mb-10">
          {lang === "da" ? "Ord fra " : "Words from "}
          <span className="text-yellow">{lang === "da" ? "rigtige kunder" : "real clients"}</span>
        </h2>

        <div className="reveal grid grid-cols-3 gap-[18px] max-[1050px]:grid-cols-2 max-[720px]:grid-cols-1">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="relative bg-gray border border-[var(--border)] rounded-[3px] p-7 flex flex-col"
            >
              <span
                aria-hidden
                className="absolute top-4 right-5 font-condensed font-black text-[60px] leading-none text-yellow opacity-[.18] select-none"
              >
                &ldquo;
              </span>

              {/* 5-star strip */}
              <div className="flex gap-[2px] mb-5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#F5C400">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-[15px] leading-[1.7] text-cream/90 mb-6 flex-1 relative z-[1]">
                {t.quote[lang]}
              </blockquote>

              <figcaption className="border-t border-[rgba(242,238,230,.07)] pt-4">
                <p className="font-condensed font-extrabold text-[14px] tracking-[.04em] uppercase text-cream">
                  {t.author}
                </p>
                <p className="text-[12px] text-muted mt-[2px]">{t.role[lang]}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="reveal text-center text-[12px] text-muted mt-10 max-[900px]:mt-7">
          {lang === "da"
            ? "Vil du anbefale os? Send et par linjer til kontakt@krydsbyg.com."
            : "Want to recommend us? Drop a few lines at kontakt@krydsbyg.com."}
        </p>
      </div>
    </section>
  );
}
