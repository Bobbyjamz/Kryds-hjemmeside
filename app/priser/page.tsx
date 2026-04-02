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
    subtitle: "Alm. personale",
    description: "Til de fleste byggeopgaver med dygtige og erfarne folk.",
    workerPay: "ca. 160–180",
    fee: "90",
    totalExample: "ca. 250–270",
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
    name: "Koordinator / Byggeleder",
    subtitle: "Specialiseret personale",
    description: "Byggeledere, koordinatorer og specialister med ekstra erfaring og ansvar.",
    badge: "Anbefalet",
    workerPay: "ca. 200–230",
    fee: "115",
    totalExample: "ca. 315–345",
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
    subtitle: "Volumenpris",
    description: "Ved booking af 5 eller flere personer samtidig — samme kvalitet, lavere gebyr.",
    workerPay: "ca. 160–180",
    fee: "70",
    totalExample: "ca. 230–250",
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

function BackArrow() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 font-condensed font-semibold text-[13px] tracking-[.1em] uppercase text-muted no-underline transition-colors hover:text-yellow mb-8"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Tilbage til forsiden
    </Link>
  );
}

export default function PriserPage() {
  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px] max-[900px]:pb-[70px]">
        {/* Back arrow */}
        <BackArrow />

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

        {/* How pricing works */}
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

        {/* ── TIMEPRISER — Tier cards ── */}
        <div className="max-w-[1100px] mx-auto mb-[100px]">
          <div className="text-center mb-10">
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              Timepriser <span className="text-yellow">pr. medarbejder</span>
            </h2>
            <p className="text-[15px] text-muted mt-3 max-w-[500px] mx-auto">
              Her ser du hvad medarbejderen ca. får i løn, vores gebyr, og hvad du som kunde betaler i alt pr. time.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 items-start max-[900px]:grid-cols-1 max-[900px]:max-w-[440px] max-[900px]:mx-auto">
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
                <p className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">
                  {tier.name}
                </p>

                {/* Price breakdown */}
                <div className="bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,0.06)] rounded-[2px] p-4 mb-5">
                  <div className="flex justify-between items-center py-[5px]">
                    <span className="text-[13px] text-muted">Medarbejderens løn</span>
                    <span className="font-condensed font-semibold text-[14px] text-cream">{tier.workerPay} kr/t</span>
                  </div>
                  <div className="flex justify-between items-center py-[5px] border-b border-[rgba(242,238,230,0.06)]">
                    <span className="text-[13px] text-muted">Kryds-gebyr</span>
                    <span className="font-condensed font-bold text-[14px] text-yellow">{tier.fee} kr/t</span>
                  </div>
                  <div className="flex justify-between items-center pt-[8px]">
                    <span className="text-[13px] font-semibold text-cream">Du betaler i alt</span>
                    <span className="font-condensed font-black text-[18px] text-cream">{tier.totalExample} kr/t</span>
                  </div>
                </div>

                <p className="font-condensed font-semibold text-[13px] text-muted tracking-[.06em] mb-2">
                  {tier.subtitle}
                </p>
                <p className="text-[14px] leading-[1.6] text-[rgba(242,238,230,.5)] mb-6">
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
        </div>

        {/* ── PROJEKTPRIS — Fast tilbud ── */}
        <div className="max-w-[900px] mx-auto mb-[100px]">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
              Projektpris
            </div>
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-4">
              Fast pris på <span className="text-yellow">hele resultatet</span>
            </h2>
            <p className="text-[16px] leading-[1.7] text-muted max-w-[560px] mx-auto">
              Har du brug for et færdigt resultat i stedet for timebemanding? Vi sender et skræddersyet tilbud baseret på hele opgaven — inkl. materialer, montering og arbejdskraft.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-[900px]:grid-cols-1">
            {/* How it works */}
            <div className="bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)]">
              <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-6">
                Sådan fungerer det
              </h3>
              <div className="space-y-5">
                {[
                  { num: "01", title: "Send en forespørgsel", desc: "Beskriv opgaven — hvad skal laves, hvor, og hvornår." },
                  { num: "02", title: "Vi vurderer opgaven", desc: "Vi besøger evt. lokationen og vurderer omfang, materialer og tidsestimat." },
                  { num: "03", title: "Modtag tilbud", desc: "Du får et samlet tilbud med fast pris — inkl. materialer, arbejdsløn og evt. montering." },
                  { num: "04", title: "Vi udfører arbejdet", desc: "Godkend tilbuddet, og vi tager os af resten. Færdigt resultat, ingen overraskelser." },
                ].map((step) => (
                  <div key={step.num} className="flex gap-4">
                    <span className="font-condensed font-black text-[22px] text-yellow leading-none mt-[2px]">{step.num}</span>
                    <div>
                      <h4 className="font-condensed font-bold text-[15px] text-cream mb-1">{step.title}</h4>
                      <p className="text-[13px] leading-[1.6] text-muted">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What's included */}
            <div className="bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)]">
              <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-6">
                Hvad er inkluderet i tilbuddet
              </h3>
              <ul className="list-none mb-8">
                {[
                  "Arbejdskraft — erfarne folk til opgaven",
                  "Materialer — vi rådgiver og indkøber",
                  "Montering & installation",
                  "Oprydning efter endt arbejde",
                  "Ansvarsforsikring på hele projektet",
                  "Ingen ekstra gebyrer udover tilbuddet",
                  "Gratis besigtigelse ved større opgaver",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] text-muted py-[8px] border-b border-[rgba(242,238,230,0.05)]">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>

              <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-4">
                Typiske projektopgaver
              </h3>
              <div className="flex flex-wrap gap-[6px]">
                {["Renovering", "Maling", "Montering", "Fliser", "Nedrivning", "Haveanlæg", "Sceneopbygning", "Indretning"].map((tag) => (
                  <span key={tag} className="bg-[rgba(245,196,0,.08)] border border-[rgba(245,196,0,.18)] text-yellow font-condensed font-bold text-[10px] tracking-[.1em] uppercase px-3 py-[4px] rounded-[1px]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Link
              href="/#contract"
              className="inline-block font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase bg-yellow text-black px-10 py-[14px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
            >
              Send forespørgsel for tilbud
            </Link>
            <p className="text-[13px] text-muted mt-3">Vi vender tilbage inden for 2 timer med et uforpligtende tilbud.</p>
          </div>
        </div>

        {/* ── Enterprise ── */}
        <div className="max-w-[700px] mx-auto text-center bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)] mb-[80px]">
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

        {/* ── FAQ icons ── */}
        <div className="max-w-[800px] mx-auto grid grid-cols-3 gap-8 max-[900px]:grid-cols-1">
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
