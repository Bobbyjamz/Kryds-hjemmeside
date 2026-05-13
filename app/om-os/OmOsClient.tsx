"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/MobileHeader";
import MobileSwipeWrapper from "@/components/MobileSwipeWrapper";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const team = [
  {
    nameKey: "omos_team_1_name",
    roleKey: "omos_team_1_role",
    bioKey: "omos_team_1_bio",
    photo: "/krystian.jpg",
    facePosition: "center 22%",
  },
  {
    nameKey: "omos_team_2_name",
    roleKey: "omos_team_2_role",
    bioKey: "omos_team_2_bio",
    photo: "/karl.jpg",
    facePosition: "center 50%",
  },
];

export default function OmOsClient() {
  const { t } = useLanguage();

  const values = [
    {
      titleKey: "omos_val_1_title",
      descKey: "omos_val_1_desc",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h0" />
        </svg>
      ),
    },
    {
      titleKey: "omos_val_2_title",
      descKey: "omos_val_2_desc",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      titleKey: "omos_val_3_title",
      descKey: "omos_val_3_desc",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="max-[900px]:hidden"><Nav /></div>
      <div className="hidden max-[900px]:block"><MobileHeader /></div>
      <MobileSwipeWrapper>
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-4 max-[900px]:pt-4 max-[900px]:pb-[60px]">
        {/* Hero */}
        <div className="max-w-[750px] mx-auto text-center mb-[80px] max-[900px]:mb-[44px]">
          <div className="flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
            {t("omos_eyebrow")}
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,5vw,64px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-6">
            {t("omos_h1_1")} <span className="text-yellow">{t("omos_h1_yellow")}</span>
          </h1>
          <p className="text-[17px] leading-[1.8] text-muted max-w-[560px] mx-auto">
            {t("omos_subtitle")}
          </p>
        </div>

        {/* Why we started */}
        <div className="max-w-[800px] mx-auto mb-[80px] max-[900px]:mb-[48px]">
          <div className="bg-gray p-12 rounded-[2px] border border-[rgba(242,238,230,0.07)] max-[900px]:p-8">
            <h2 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-6">
              {t("omos_why_title")}
            </h2>
            <div className="space-y-5 text-[16px] leading-[1.8] text-[rgba(242,238,230,.65)]">
              <p>{t("omos_why_p1")}</p>
              <p>{t("omos_why_p2")}</p>
              <p>
                <span className="text-cream font-medium">{t("omos_why_p3_bold")}</span> {t("omos_why_p3")}
              </p>
              <p>{t("omos_why_p4")}</p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="max-w-[900px] mx-auto mb-[80px] max-[900px]:mb-[48px]">
          <div className="text-center mb-12 max-[900px]:mb-8">
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              {t("omos_team_h2_1")} <span className="text-yellow">{t("omos_team_h2_yellow")}</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-8 max-[900px]:grid-cols-1 max-[900px]:gap-4">
            {team.map((person) => (
              <div
                key={person.nameKey}
                className="bg-gray p-10 rounded-[2px] border border-[rgba(242,238,230,0.07)] text-center transition-all duration-300 hover:border-[rgba(245,196,0,.2)] max-[900px]:p-6"
              >
                <div className="w-[140px] h-[140px] rounded-full overflow-hidden border-2 border-[rgba(245,196,0,.3)] mx-auto mb-5 relative">
                  <Image
                    src={person.photo}
                    alt={t(person.nameKey)}
                    fill
                    sizes="140px"
                    className="object-cover"
                    style={{ objectPosition: person.facePosition, transform: "scale(1.35)", transformOrigin: person.facePosition }}
                  />
                </div>
                <h3 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.02em] text-cream mb-1">
                  {t(person.nameKey)}
                </h3>
                <p className="font-condensed font-bold text-[12px] tracking-[.18em] uppercase text-yellow mb-5">
                  {t(person.roleKey)}
                </p>
                <p className="text-[15px] leading-[1.75] text-muted text-left">
                  {t(person.bioKey)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="max-w-[900px] mx-auto mb-[80px] max-[900px]:mb-[48px]">
          <div className="text-center mb-12 max-[900px]:mb-8">
            <h2 className="font-condensed font-black text-[clamp(28px,3.5vw,44px)] uppercase leading-[.95] tracking-[-.01em] text-cream">
              {t("omos_values_h2_1")} <span className="text-yellow">{t("omos_values_h2_yellow")}</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-1 max-[900px]:gap-3">
            {values.map((v) => (
              <div key={v.titleKey} className="bg-gray p-8 rounded-[2px] border border-[rgba(242,238,230,0.07)] text-center max-[900px]:p-5">
                <div className="w-12 h-12 rounded-full bg-[rgba(245,196,0,.1)] flex items-center justify-center mx-auto mb-4">
                  {v.icon}
                </div>
                <h4 className="font-condensed font-bold text-[14px] tracking-[.12em] uppercase text-cream mb-3">
                  {t(v.titleKey)}
                </h4>
                <p className="text-[14px] leading-[1.65] text-muted">{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-[600px] mx-auto text-center bg-gray p-12 rounded-[2px] border border-[rgba(245,196,0,.15)] shadow-[0_10px_40px_rgba(0,0,0,.15)] max-[900px]:p-7">
          <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] text-cream mb-3">
            {t("omos_cta_h3")}
          </h3>
          <p className="text-[15px] leading-[1.6] text-muted mb-6">
            {t("omos_cta_desc")}
          </p>
          <Link
            href="/#contract"
            className="inline-block font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase bg-yellow text-black px-10 py-[14px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
          >
            {t("omos_cta_btn")}
          </Link>
        </div>
      </main>
      <div className="max-[900px]:hidden"><Footer /></div>
      </MobileSwipeWrapper>
    </>
  );
}
