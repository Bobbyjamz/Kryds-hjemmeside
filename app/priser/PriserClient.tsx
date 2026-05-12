"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const FAQ_ITEMS = [
  {
    q: "Hvad er minimumsbestilling?",
    a: "4 timer pr. dag pr. medarbejder ved timepris. Fastpris-projekter har et minimum på kr. 15.000 ekskl. moms.",
  },
  {
    q: "Hvornår gælder overtids- og tillægssatser?",
    a: "Overtid (efter 8 timer): +50%. Weekend og helligdage: +75%. Natarbejde (22:00–06:00): +75%. Alle satser beregnes på den aftalte timepris.",
  },
  {
    q: "Hvad er inkluderet i timeprisen?",
    a: "Arbejdskraft og koordinering. Vi medbringer basalt håndværktøj som standard. Bygherren/kunden står selv for arbejdsskadeforsikring, materialer, lift og stilladser — vi leverer kun personalet. Har du behov for specialværktøj ud over normen, er du velkommen til at give besked på forhånd, så afklarer vi om det er muligt.",
  },
  {
    q: "Hvad sker der hvis jeg aflyser?",
    a: "Aflysning mere end 48 timer før: gratis. 24–48 timer: 50% af estimeret dagssats. Under 24 timer eller no-show: 100% af dagssats.",
  },
  {
    q: "Hvad er en retainer-aftale?",
    a: "Du reserverer et fast antal medarbejderdage om måneden og får prioriteret booking og rabat. Bronze 5 dage/md, Sølv 10 dage/md, Guld 20+ dage/md.",
  },
  {
    q: "Hvornår kan I sende folk?",
    a: "På de fleste fagområder kan vi stille folk klar inden for 24 timer — og ofte samme dag. Ring til os på +45 42 77 88 66.",
  },
];

export default function PriserClient() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-4 max-[900px]:pt-[90px] max-[900px]:pb-[60px]">

        {/* Hero */}
        <div className="text-center max-w-[700px] mx-auto mb-[80px] max-[900px]:mb-[44px]">
          <div className="flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
            {t("priser_eyebrow")}
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,5vw,64px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-5">
            {t("priser_h1_1")} <span className="text-yellow">{t("priser_h1_yellow")}</span>
          </h1>
          <p className="text-[17px] leading-[1.7] text-muted max-w-[520px] mx-auto">
            {t("priser_subtitle")}
          </p>
        </div>

        {/* ── Model A / B side om side ── */}
        <div className="max-w-[900px] mx-auto mb-[100px] max-[900px]:mb-[60px]">
          <div className="grid grid-cols-2 gap-8 max-[900px]:grid-cols-1 max-[900px]:gap-4">

            {/* Model A — Timepris */}
            <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-10 max-[900px]:p-6">
              <p className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Model A</p>
              <h2 className="font-condensed font-black text-[26px] uppercase tracking-[.02em] text-cream mb-6">Timepris</h2>

              <table className="w-full mb-6 text-[14px]">
                <tbody>
                  <tr className="border-b border-[rgba(242,238,230,0.07)]">
                    <td className="py-3 text-muted">Handyman</td>
                    <td className="py-3 text-right font-condensed font-bold text-cream">kr. 345/t</td>
                  </tr>
                  <tr className="border-b border-[rgba(242,238,230,0.07)]">
                    <td className="py-3 text-muted">Faglært håndværker</td>
                    <td className="py-3 text-right font-condensed font-bold text-cream">kr. 430/t</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted">Specialist</td>
                    <td className="py-3 text-right font-condensed font-bold text-cream">kr. 550/t</td>
                  </tr>
                </tbody>
              </table>

              <p className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-yellow mb-3">Tillæg</p>
              <ul className="space-y-2 mb-6 text-[13px] text-muted">
                <li className="flex justify-between"><span>Overtid (efter 8 timer)</span><span className="text-cream font-bold">+50%</span></li>
                <li className="flex justify-between"><span>Weekend & helligdage</span><span className="text-cream font-bold">+75%</span></li>
                <li className="flex justify-between"><span>Natarbejde (22:00–06:00)</span><span className="text-cream font-bold">+75%</span></li>
              </ul>

              <p className="text-[12px] text-muted mb-8">Minimum 4 timer pr. dag pr. medarbejder. Alle priser ekskl. moms.</p>

              <Link href="/#contract" className="block text-center font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase border border-[rgba(242,238,230,.25)] text-cream hover:border-yellow hover:text-yellow py-3 rounded-[2px] no-underline transition-colors">
                Send forespørgsel
              </Link>
            </div>

            {/* Model B — Fastpris */}
            <div className="bg-black2 border border-yellow shadow-[0_12px_50px_rgba(245,196,0,0.12)] rounded-[2px] p-10 relative max-[900px]:p-6 max-[900px]:mt-4">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow text-black font-condensed font-extrabold text-[10px] tracking-[.14em] uppercase px-4 py-[5px] rounded-[2px]">
                Prissikkerhed
              </span>
              <p className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Model B</p>
              <h2 className="font-condensed font-black text-[26px] uppercase tracking-[.02em] text-cream mb-6">Fastpris</h2>

              <ul className="space-y-4 mb-8">
                {[
                  "Fuld prissikkerhed — ingen overraskelser",
                  "Skriftlig kontrakt med aftalt scope",
                  "Ingen overtidstillæg eller skjulte gebyrer",
                  "Pris aftales inden opgavestart",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-muted">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              <p className="text-[12px] text-muted mb-8">Minimum kr. 15.000 ekskl. moms. Tillægsydelser udenfor aftalens scope faktureres særskilt.</p>

              <Link href="/#contract" className="block text-center font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase bg-yellow text-black hover:bg-[#e6b800] py-3 rounded-[2px] no-underline transition-colors">
                Få et tilbud
              </Link>
            </div>
          </div>
        </div>

        {/* ── Retainer-model ── */}
        <div className="max-w-[900px] mx-auto mb-[100px] max-[900px]:mb-[60px]">
          <div className="text-center mb-10 max-[900px]:mb-7">
            <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">Faste kunder</p>
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-3">
              Retainer <span className="text-yellow">— spar op til 10%</span>
            </h2>
            <p className="text-[15px] text-muted max-w-[500px] mx-auto">
              Reservér et fast antal medarbejderdage om måneden og få prioriteret respons og rabat.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-1 max-[900px]:gap-3">
            {[
              { name: "Bronze", days: "5 dage/md", price: "kr. 9.500", discount: "5% rabat", color: "#CD7F32", features: ["Prioriteret booking", "Dedikeret kontaktperson", "5% rabat på løbende vagter"] },
              { name: "Sølv", days: "10 dage/md", price: "kr. 17.500", discount: "8% rabat", color: "#C0C0C0", features: ["Alt i Bronze", "Prioriteret respons", "8% rabat på løbende vagter", "Garanti på erstatning inden 2t"] },
              { name: "Guld", days: "20+ dage/md", price: "Individuel aftale", discount: "10% rabat", color: "#F5C400", features: ["Alt i Sølv", "Dedikeret koordinator", "10% rabat på alle vagter", "Månedlig statusrapport"] },
            ].map((tier) => (
              <div key={tier.name} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-8 hover:border-[rgba(245,196,0,.25)] transition-colors max-[900px]:p-5">
                <p className="font-condensed font-black text-[22px] uppercase tracking-[.02em] mb-1" style={{ color: tier.color }}>{tier.name}</p>
                <p className="font-condensed font-semibold text-[11px] tracking-[.18em] uppercase text-muted mb-4">{tier.days}</p>
                <p className="font-condensed font-black text-[26px] text-cream mb-1">{tier.price}</p>
                <p className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-yellow mb-6">{tier.discount}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[13px] text-muted">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/#contract" className="block text-center font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase border border-[rgba(242,238,230,.2)] text-cream hover:border-yellow hover:text-yellow px-4 py-3 rounded-[2px] no-underline transition-colors">
                  Kom i gang
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ Accordion ── */}
        <div className="max-w-[700px] mx-auto mb-[100px] max-[900px]:mb-[60px]">
          <div className="text-center mb-10 max-[900px]:mb-7">
            <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">Spørgsmål & svar</p>
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              Ofte stillede <span className="text-yellow">spørgsmål</span>
            </h2>
          </div>
          <div className="border-t border-[rgba(242,238,230,0.07)]">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-[rgba(242,238,230,0.07)]">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-condensed font-bold text-[15px] text-cream">{item.q}</span>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openFaq === i && (
                  <p className="text-[14px] leading-[1.75] text-muted pb-5">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA strip ── */}
        <div className="max-w-[700px] mx-auto text-center bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-10 max-[900px]:p-7">
          <p className="text-[16px] leading-[1.7] text-muted mb-6 max-w-[460px] mx-auto">
            Usikker på hvilken model der passer dig? Ring til os — vi hjælper dig med at vælge.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <a href="tel:+4542778866" className="font-condensed font-bold text-[15px] text-cream hover:text-yellow transition-colors no-underline">
              +45 42 77 88 66
            </a>
            <Link
              href="/#contract"
              className="inline-block font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase bg-yellow text-black px-8 py-[12px] rounded-[2px] no-underline transition-all hover:bg-[#e6b800] hover:-translate-y-[1px]"
            >
              Send forespørgsel
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
