"use client";

import Logo from "./Logo";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const services = [
    { labelKey: "footer_svc_1", href: "/#services" },
    { labelKey: "footer_svc_2", href: "/#services" },
    { labelKey: "footer_svc_3", href: "/#services" },
    { labelKey: "footer_svc_4", href: "/priser" },
    { labelKey: "footer_svc_5", href: "/tilmeld" },
  ];

  const company = [
    { labelKey: "footer_comp_1", href: "/om-os" },
    { labelKey: "footer_comp_2", href: "/priser" },
    { labelKey: "footer_comp_3", href: "/#contract" },
    { labelKey: "footer_comp_4", href: "/medarbejder/login" },
  ];

  const legal = [
    { labelKey: "footer_leg_1", href: "/handelsbetingelser" },
    { labelKey: "footer_leg_2", href: "/privatpolitik" },
    { labelKey: "footer_leg_3", href: "/medarbejder-privatpolitik" },
    { labelKey: "footer_leg_4", href: "/cookie-politik" },
    { labelKey: "footer_leg_5", href: "/medarbejder-vilkaar" },
  ];

  const socials = [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/krydsbyg",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/krydsbyg",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/krydsbyg",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-black px-[52px] pt-16 pb-10 border-t border-[var(--border)] max-[900px]:px-5 max-[900px]:pt-12 max-[900px]:pb-8">
      <div className="flex justify-between items-start pb-12 border-b border-[var(--border)] mb-8 max-[900px]:flex-col max-[900px]:gap-9">
        <div>
          <Logo size={28} />
          <p className="font-condensed font-semibold text-[14px] tracking-[.08em] text-muted italic mt-4">
            {t("footer_tagline")}
          </p>
          <div className="mt-5 space-y-1">
            <a href="tel:+4542778866" className="block text-[14px] text-cream no-underline hover:text-yellow transition-colors">
              +45 42 77 88 66
            </a>
            <a href="mailto:kontakt@krydsbyg.com" className="block text-[14px] text-cream no-underline hover:text-yellow transition-colors">
              kontakt@krydsbyg.com
            </a>
            <p className="text-[12px] text-muted mt-2">CVR: 46369947</p>
          </div>
          <div className="flex gap-3 mt-5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 flex items-center justify-center border border-[var(--border)] text-muted hover:text-yellow hover:border-yellow transition-colors rounded-[2px]"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
        <div className="flex gap-[72px] max-[900px]:flex-col max-[900px]:gap-9">
          <div>
            <h5 className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-yellow mb-4">
              {t("footer_services")}
            </h5>
            {services.map((s) => (
              <a key={s.href + s.labelKey} href={s.href} className="block text-[14px] text-muted no-underline mb-[10px] transition-colors hover:text-cream">
                {t(s.labelKey)}
              </a>
            ))}
          </div>
          <div>
            <h5 className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-yellow mb-4">
              {t("footer_company")}
            </h5>
            {company.map((s) => (
              <a key={s.href + s.labelKey} href={s.href} className="block text-[14px] text-muted no-underline mb-[10px] transition-colors hover:text-cream">
                {t(s.labelKey)}
              </a>
            ))}
          </div>
          <div>
            <h5 className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-yellow mb-4">
              {t("footer_legal")}
            </h5>
            {legal.map((s) => (
              <Link key={s.href} href={s.href} className="block text-[14px] text-muted no-underline mb-[10px] transition-colors hover:text-cream">
                {t(s.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center flex-wrap gap-3">
        <p className="text-[12px] text-[rgba(242,238,230,.2)]">{t("footer_copyright")}</p>
        <p className="text-[12px] text-[rgba(242,238,230,.2)]">
          CVR: 46369947 · {t("footer_location")}
        </p>
      </div>
    </footer>
  );
}
