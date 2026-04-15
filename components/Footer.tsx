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
  ];

  return (
    <footer className="bg-gray px-[52px] pt-16 pb-10 border-t border-[rgba(242,238,230,0.07)] max-[900px]:px-5 max-[900px]:pt-12 max-[900px]:pb-8">
      <div className="flex justify-between items-start pb-12 border-b border-[rgba(242,238,230,0.07)] mb-8 max-[900px]:flex-col max-[900px]:gap-9">
        <div>
          <Logo size={28} />
          <p className="font-condensed font-semibold text-[14px] tracking-[.08em] text-muted italic mt-4">
            {t("footer_tagline")}
          </p>
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
          <a href="mailto:Kontakt@KrydsByg.com" className="text-[rgba(242,238,230,.2)] hover:text-muted transition-colors no-underline">
            Kontakt@KrydsByg.com
          </a>
          {" · "}{t("footer_location")}
        </p>
      </div>
    </footer>
  );
}
