import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priser — Kryds | Gennemsigtig bemandingspris",
  description:
    "Se Kryds' priser for byggebemanding i København. Enkelt gebyr oven på medarbejderens timeløn — ingen skjulte omkostninger.",
};

const tiers = [
  {
    name: "Standard",
    rate: "90",
    unit: "kr/t",
    subtitle: "Alm. personale",
    description: "Til de fleste byggeopgaver med dygtige og erfarne folk.",
    features: [
      "Byggehjælpere & alm. håndværkere",
      "Maling, renovering, havearbejde",
      "Montering & nedrivning",
      "Fuldt forsikret personale",
      "Ingen minimumsbooking",
    ],
    cta: "Book personale",
    highlighted: false,
  },
  {
    name: "Koordinator",
    rate: "115",
    unit: "kr/t",
    subtitle: "Specialiseret personale",
    description: "Byggeledere, koordinatorer og specialister med ekstra erfaring.",
    badge: "Anbefalet",
    features: [
      "Byggeledere & koordinatorer",
      "Specialiseret fagpersonale",
      "Projektledelse & overvågning",
      "Erfaring med store projekter",
      "Personlig kontaktperson",
      "Prioriteret mobilisering",
    ],
    cta: "Book specialist",
    highlighted: true,
  },
  {
    name: "Mængde 5+",
    rate: "70",
    unit: "kr/t",
    subtitle: "Volumenpris",
    description: "Ved booking af 5 eller flere personer samtidig.",
    features: [
      "5+ personer pr. booking",
      "Samme kvalitet — lavere gebyr",
      "Ideel til store projekter",
      "Dedikeret kontaktperson",
      "Fleksibel op-/nedskalering",
      "Samlet faktura pr. periode",
    ],
    cta: "Kontakt os",
    highlighted: false,
  },
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PriserPage() {
  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px] max-[900px]:pb-[70px]">
        {/* Hero */}
        <div className="text-center max-w-[700px] mx-auto mb-[80px]">
          <div className="flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
            Priser
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,5vw,64px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-5">
            Enkelt og <span className="text-yellow">gennemsigtigt</span>
          </h1>
          <p className="text-[17px] leading-[1.7] text-muted max-w-[520px] mx-auto">
            Vi tager et fast gebyr oven på medarbejderens timeløn. Ingen skjulte gebyrer, ingen admin-omkostninger, ingen weekend-tillæg på gebyret.
          </p>
        </div>

        {/* Pricing explanation */}
        <div className="text-center mb-[60px] bg-gray p-8 rounded-[2px] border border-[rgba(242,238,230,0.07)] max-w-[600px] mx-auto">
          <p className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-3">
            Sådan virker det
          </p>
          <p className="text-[18px] leading-[1.6] text-cream">
            Medarbejderens løn + <span className="text-yellow font-bold">Kryds-gebyr</span> = din timepris
          </p>
          <p className="text-[14px] text-muted mt-2">
            Eksempel: 170 kr løn + 90 kr gebyr = <strong className="text-cream">260 kr/t total</strong>
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-3 gap-6 max-w-[1100px] mx-auto items-start max-[900px]:grid-cols-1 max-[900px]:max-w-[440px]">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-[2px] p-10 border transition-all duration-300 ${
                tier.highlighted
                  ? "bg-[#1A1A18] border-yellow shadow-[0_0_40px_rgba(245,196,0,0.08)] scale-[1.03] max-[900px]:scale-100"
                  : "bg-gray border-[rgba(242,238,230,0.07)] hover:border-[rgba(245,196,0,.25)]"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow text-black font-condensed font-extrabold text-[10px] tracking-[.14em] uppercase px-4 py-[5px] rounded-[2px]">
                  {tier.badge}
                </span>
              )}
              <p className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">
                {tier.name}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-condensed font-black text-[52px] leading-none text-cream">
                  {tier.rate}
                </span>
                <span className="font-condensed font-semibold text-[16px] text-muted">
                  {tier.unit}
                </span>
              </div>
              <p className="font-condensed font-semibold text-[13px] text-muted tracking-[.06em] mb-2">
                {tier.subtitle}
              </p>
              <p className="text-[14px] leading-[1.6] text-[rgba(242,238,230,.5)] mb-7">
                {tier.description}
              </p>
              <ul className="list-none mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-muted py-[7px] border-b border-[rgba(242,238,230,0.05)]">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/#contract"
                className={`block text-center font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase py-[14px] rounded-[2px] no-underline transition-all duration-300 ${
                  tier.highlighted
                    ? "bg-yellow text-black hover:bg-yellow2 hover:-translate-y-[1px]"
                    : "border border-[rgba(242,238,230,.25)] text-cream hover:border-yellow hover:text-yellow"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise / Custom */}
        <div className="max-w-[700px] mx-auto mt-[80px] text-center bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)]">
          <p className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase text-yellow mb-3">
            Store projekter
          </p>
          <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] text-cream mb-3">
            10+ personer? Kontakt os for skræddersyet pris
          </h3>
          <p className="text-[15px] leading-[1.6] text-muted mb-6 max-w-[460px] mx-auto">
            Ved store og langvarige projekter tilbyder vi individuelle aftaler med endnu lavere gebyrer og en dedikeret projektleder.
          </p>
          <Link
            href="/#contract"
            className="inline-block font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase bg-yellow text-black px-10 py-[14px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
          >
            Kontakt os
          </Link>
        </div>

        {/* FAQ / details */}
        <div className="max-w-[800px] mx-auto mt-[80px] grid grid-cols-3 gap-8 max-[900px]:grid-cols-1">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(245,196,0,.1)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
              </svg>
            </div>
            <h4 className="font-condensed font-bold text-[13px] tracking-[.14em] uppercase text-cream mb-2">
              Gennemsigtig pris
            </h4>
            <p className="text-[13px] leading-[1.6] text-muted">
              Medarbejderens løn + Kryds-gebyr. Du ved altid hvad du betaler.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(245,196,0,.1)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h0M2 9h20" />
              </svg>
            </div>
            <h4 className="font-condensed font-bold text-[13px] tracking-[.14em] uppercase text-cream mb-2">
              Samlet faktura
            </h4>
            <p className="text-[13px] leading-[1.6] text-muted">
              Ugentlig eller månedlig faktura med specificerede timer. Betaling inden for 14 dage.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(245,196,0,.1)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h4 className="font-condensed font-bold text-[13px] tracking-[.14em] uppercase text-cream mb-2">
              Ingen skjulte gebyrer
            </h4>
            <p className="text-[13px] leading-[1.6] text-muted">
              Ingen opstartsgebyr, ingen admin-fee, ingen weekend-tillæg på vores gebyr.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
