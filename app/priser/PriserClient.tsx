"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

type Tier = {
  nameKey: string;
  subtitleKey: string;
  descKey: string;
  badgeKey?: string;
  workerPayKey: string;
  fee: string;
  totalExampleKey: string;
  featureKeys: string[];
  ctaKey: string;
  highlighted: boolean;
};

const tiers: Tier[] = [
  {
    nameKey: "priser_tier1_name",
    subtitleKey: "priser_tier1_subtitle",
    descKey: "priser_tier1_desc",
    workerPayKey: "priser_tier1_worker_pay",
    fee: "105",
    totalExampleKey: "priser_tier1_total",
    featureKeys: [
      "priser_tier1_feat_1",
      "priser_tier1_feat_2",
      "priser_tier1_feat_3",
      "priser_tier1_feat_4",
      "priser_tier1_feat_5",
    ],
    ctaKey: "priser_tier1_cta",
    highlighted: false,
  },
  {
    nameKey: "priser_tier2_name",
    subtitleKey: "priser_tier2_subtitle",
    descKey: "priser_tier2_desc",
    badgeKey: "priser_tier2_badge",
    workerPayKey: "priser_tier2_worker_pay",
    fee: "135",
    totalExampleKey: "priser_tier2_total",
    featureKeys: [
      "priser_tier2_feat_1",
      "priser_tier2_feat_2",
      "priser_tier2_feat_3",
      "priser_tier2_feat_4",
      "priser_tier2_feat_5",
      "priser_tier2_feat_6",
    ],
    ctaKey: "priser_tier2_cta",
    highlighted: true,
  },
  {
    nameKey: "priser_tier3_name",
    subtitleKey: "priser_tier3_subtitle",
    descKey: "priser_tier3_desc",
    workerPayKey: "priser_tier3_worker_pay",
    fee: "85",
    totalExampleKey: "priser_tier3_total",
    featureKeys: [
      "priser_tier3_feat_1",
      "priser_tier3_feat_2",
      "priser_tier3_feat_3",
      "priser_tier3_feat_4",
      "priser_tier3_feat_5",
      "priser_tier3_feat_6",
    ],
    ctaKey: "priser_tier3_cta",
    highlighted: false,
  },
];

const projTagKeys = [
  "priser_proj_tag_1",
  "priser_proj_tag_2",
  "priser_proj_tag_3",
  "priser_proj_tag_4",
  "priser_proj_tag_5",
  "priser_proj_tag_6",
  "priser_proj_tag_7",
  "priser_proj_tag_8",
];

const projSteps = [
  { num: "01", titleKey: "priser_proj_step_1_title", descKey: "priser_proj_step_1_desc" },
  { num: "02", titleKey: "priser_proj_step_2_title", descKey: "priser_proj_step_2_desc" },
  { num: "03", titleKey: "priser_proj_step_3_title", descKey: "priser_proj_step_3_desc" },
  { num: "04", titleKey: "priser_proj_step_4_title", descKey: "priser_proj_step_4_desc" },
];

const projIncludedKeys = [
  "priser_proj_inc_1",
  "priser_proj_inc_2",
  "priser_proj_inc_3",
  "priser_proj_inc_4",
  "priser_proj_inc_5",
  "priser_proj_inc_6",
  "priser_proj_inc_7",
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PriserClient() {
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
        <div className="text-center max-w-[700px] mx-auto mb-[80px]">
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

        {/* How pricing works */}
        <div className="text-center mb-[60px] bg-gray p-8 rounded-[2px] border border-[rgba(242,238,230,0.07)] max-w-[600px] mx-auto">
          <p className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-3">
            {t("priser_how_eyebrow")}
          </p>
          <p className="text-[18px] leading-[1.6] text-cream">
            {t("priser_how_formula_1")} <span className="text-yellow font-bold">{t("priser_how_formula_2")}</span> {t("priser_how_formula_3")}
          </p>
          <p className="text-[14px] text-muted mt-2">
            {t("priser_how_example")} <strong className="text-cream">{t("priser_how_example_bold")}</strong>
          </p>
        </div>

        {/* ── TIMEPRISER — Tier cards ── */}
        <div className="max-w-[1100px] mx-auto mb-[100px]">
          <div className="text-center mb-10">
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              {t("priser_tiers_h2_1")} <span className="text-yellow">{t("priser_tiers_h2_yellow")}</span>
            </h2>
            <p className="text-[15px] text-muted mt-3 max-w-[500px] mx-auto">
              {t("priser_tiers_subtitle")}
            </p>
          </div>

          <div className="mb-8 max-w-[780px] mx-auto text-center bg-[rgba(245,196,0,.06)] border border-[rgba(245,196,0,.18)] rounded-[2px] p-4">
            <p className="text-[13px] leading-[1.6] text-[rgba(242,238,230,.75)]">
              <strong className="text-yellow">{t("priser_tiers_notice_bold")}</strong>{" "}
              {t("priser_tiers_notice")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 items-start max-[900px]:grid-cols-1 max-[900px]:max-w-[440px] max-[900px]:mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.nameKey}
                className={`relative rounded-[2px] p-10 border transition-all duration-300 ${
                  tier.highlighted
                    ? "bg-black2 border-yellow shadow-[0_12px_50px_rgba(245,196,0,0.18)] scale-[1.03] max-[900px]:scale-100"
                    : "bg-gray border-[var(--border)] shadow-[0_6px_20px_rgba(0,0,0,.08)] hover:border-[rgba(245,196,0,.25)] hover:shadow-[0_10px_35px_rgba(0,0,0,.12)]"
                }`}
              >
                {tier.badgeKey && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow text-black font-condensed font-extrabold text-[10px] tracking-[.14em] uppercase px-4 py-[5px] rounded-[2px]">
                    {t(tier.badgeKey)}
                  </span>
                )}
                <p className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">
                  {t(tier.nameKey)}
                </p>

                {/* Price breakdown */}
                <div className="bg-black border border-[var(--border)] rounded-[2px] p-4 mb-5">
                  <div className="flex justify-between items-center py-[5px]">
                    <span className="text-[13px] text-muted">{t("priser_row_worker_pay")}</span>
                    <span className="font-condensed font-semibold text-[14px] text-cream">{t(tier.workerPayKey)} {t("priser_unit_hour")}</span>
                  </div>
                  <div className="flex justify-between items-center py-[5px] border-b border-[rgba(242,238,230,0.06)]">
                    <span className="text-[13px] text-muted">{t("priser_row_fee")}</span>
                    <span className="font-condensed font-bold text-[14px] text-yellow">{tier.fee} {t("priser_unit_hour")}</span>
                  </div>
                  <div className="flex justify-between items-center pt-[8px]">
                    <span className="text-[13px] font-semibold text-cream">{t("priser_row_total")}</span>
                    <span className="font-condensed font-black text-[18px] text-cream">{t(tier.totalExampleKey)} {t("priser_unit_hour")}</span>
                  </div>
                </div>

                <p className="font-condensed font-semibold text-[13px] text-muted tracking-[.06em] mb-2">
                  {t(tier.subtitleKey)}
                </p>
                <p className="text-[14px] leading-[1.6] text-[rgba(242,238,230,.5)] mb-6">
                  {t(tier.descKey)}
                </p>
                <ul className="list-none mb-8">
                  {tier.featureKeys.map((fk) => (
                    <li key={fk} className="flex items-center gap-3 text-[14px] text-muted py-[7px] border-b border-[rgba(242,238,230,0.05)]">
                      <CheckIcon />
                      {t(fk)}
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
                  {t(tier.ctaKey)}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROJEKTPRIS — Fast tilbud ── */}
        <div className="max-w-[900px] mx-auto mb-[100px]">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
              {t("priser_proj_eyebrow")}
            </div>
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-4">
              {t("priser_proj_h2_1")} <span className="text-yellow">{t("priser_proj_h2_yellow")}</span>
            </h2>
            <p className="text-[16px] leading-[1.7] text-muted max-w-[560px] mx-auto">
              {t("priser_proj_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-[900px]:grid-cols-1">
            {/* How it works */}
            <div className="bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)]">
              <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-6">
                {t("priser_proj_how_title")}
              </h3>
              <div className="space-y-5">
                {projSteps.map((step) => (
                  <div key={step.num} className="flex gap-4">
                    <span className="font-condensed font-black text-[22px] text-yellow leading-none mt-[2px]">{step.num}</span>
                    <div>
                      <h4 className="font-condensed font-bold text-[15px] text-cream mb-1">{t(step.titleKey)}</h4>
                      <p className="text-[13px] leading-[1.6] text-muted">{t(step.descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What's included */}
            <div className="bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)]">
              <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-6">
                {t("priser_proj_inc_title")}
              </h3>
              <ul className="list-none mb-8">
                {projIncludedKeys.map((ik) => (
                  <li key={ik} className="flex items-center gap-3 text-[14px] text-muted py-[8px] border-b border-[rgba(242,238,230,0.05)]">
                    <CheckIcon />
                    {t(ik)}
                  </li>
                ))}
              </ul>

              <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-4">
                {t("priser_proj_typical_title")}
              </h3>
              <div className="flex flex-wrap gap-[6px]">
                {projTagKeys.map((tk) => (
                  <span key={tk} className="bg-[rgba(245,196,0,.08)] border border-[rgba(245,196,0,.18)] text-yellow font-condensed font-bold text-[10px] tracking-[.1em] uppercase px-3 py-[4px] rounded-[1px]">
                    {t(tk)}
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
              {t("priser_proj_cta")}
            </Link>
            <p className="text-[13px] text-muted mt-3">{t("priser_proj_cta_note")}</p>
          </div>
        </div>

        {/* ── Retainer-model ── */}
        <div className="max-w-[900px] mx-auto mb-[100px]">
          <div className="text-center mb-10">
            <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">Faste kunder</p>
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-3">
              Retainer <span className="text-yellow">— spar op til 10%</span>
            </h2>
            <p className="text-[15px] text-muted max-w-[500px] mx-auto">
              Reservér et fast antal medarbejderdage om måneden og få prioriteret respons og rabat.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-1 max-[900px]:max-w-[440px] max-[900px]:mx-auto">
            {[
              { name: "Bronze", days: "5 dage/md", price: "kr. 9.500", discount: "5% rabat", color: "#CD7F32", features: ["Prioriteret booking", "Dedikeret kontaktperson", "5% rabat på løbende vagter"] },
              { name: "Sølv", days: "10 dage/md", price: "kr. 17.500", discount: "8% rabat", color: "#C0C0C0", features: ["Alt i Bronze", "Prioriteret respons", "8% rabat på løbende vagter", "Garanti på erstatning inden 2t"] },
              { name: "Guld", days: "20+ dage/md", price: "Individuel aftale", discount: "10% rabat", color: "#F5C400", features: ["Alt i Sølv", "Dedikeret koordinator", "10% rabat på alle vagter", "Månedlig statusrapport"] },
            ].map((tier) => (
              <div key={tier.name} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-8 hover:border-[rgba(245,196,0,.25)] transition-colors">
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

        {/* ── Enterprise ── */}
        <div className="max-w-[700px] mx-auto text-center bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)] mb-[80px]">
          <p className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase text-yellow mb-3">
            {t("priser_ent_eyebrow")}
          </p>
          <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] text-cream mb-3">
            {t("priser_ent_h3")}
          </h3>
          <p className="text-[15px] leading-[1.6] text-muted mb-6 max-w-[460px] mx-auto">
            {t("priser_ent_desc")}
          </p>
          <Link
            href="/#contract"
            className="inline-block font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase bg-yellow text-black px-10 py-[14px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
          >
            {t("priser_ent_cta")}
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
              {t("priser_faq_1_title")}
            </h4>
            <p className="text-[13px] leading-[1.6] text-muted">
              {t("priser_faq_1_desc")}
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(245,196,0,.1)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h0M2 9h20" />
              </svg>
            </div>
            <h4 className="font-condensed font-bold text-[13px] tracking-[.14em] uppercase text-cream mb-2">
              {t("priser_faq_2_title")}
            </h4>
            <p className="text-[13px] leading-[1.6] text-muted">
              {t("priser_faq_2_desc")}
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(245,196,0,.1)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h4 className="font-condensed font-bold text-[13px] tracking-[.14em] uppercase text-cream mb-2">
              {t("priser_faq_3_title")}
            </h4>
            <p className="text-[13px] leading-[1.6] text-muted">
              {t("priser_faq_3_desc")}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
