"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

function XLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 90 90" className="text-cream" style={{ marginRight: 10, flexShrink: 0 }}>
      <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
      <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}

export default function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { lang, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const touchStartX = useRef<number | null>(null);
  const isDA = lang === "da";

  /* Auto-close on navigation */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  /* Body scroll lock when menu open */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  /* Swipe right to close overlay */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    if (e.changedTouches[0].clientX - touchStartX.current > 72) setMenuOpen(false);
    touchStartX.current = null;
  };

  return (
    <>
      {/* ── Sticky top bar — original design ── */}
      <header className="app-header">
        <Link href="/" className="flex items-center gap-0 no-underline">
          <XLogo />
          <div className="flex flex-col justify-center">
            <span className="font-condensed font-black text-[20px] tracking-[.02em] uppercase leading-none text-cream">
              <span className="text-yellow">K</span>RYDS
            </span>
            <span className="font-condensed italic font-normal text-[12px] tracking-[.08em] text-muted leading-none mt-[4px]">
              {isDA ? "Sæt et kryds i kalenderen." : "Put a cross in the calendar."}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="font-condensed font-bold text-[10px] tracking-[.12em] uppercase text-muted border border-[rgba(242,238,230,.12)] rounded-[3px] px-[7px] py-[4px] hover:text-yellow hover:border-yellow transition-all"
          >
            {isDA ? "EN" : "DA"}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center border border-[rgba(242,238,230,.12)] hover:border-yellow transition-all"
            style={{ background: "var(--color-gray)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C49800" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="app-menu-btn"
            aria-label="Menu"
          >
            <span style={menuOpen ? { transform: "translateY(6px) rotate(45deg)" } : {}} />
            <span style={menuOpen ? { opacity: 0 } : {}} />
            <span style={menuOpen ? { transform: "translateY(-6px) rotate(-45deg)" } : {}} />
          </button>
        </div>
      </header>

      {/* ── Fullscreen overlay menu ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[400] flex flex-col"
          style={{
            background: "color-mix(in srgb, var(--color-black) 97%, transparent)",
            paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Top bar with X close button */}
          <div
            className="flex items-center justify-end px-[18px] flex-shrink-0"
            style={{ height: 58, borderBottom: "1px solid rgba(242,238,230,.07)" }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              className="app-menu-btn"
              aria-label={isDA ? "Luk menu" : "Close menu"}
            >
              <span style={{ transform: "translateY(6px) rotate(45deg)" }} />
              <span style={{ opacity: 0 }} />
              <span style={{ transform: "translateY(-6px) rotate(-45deg)" }} />
            </button>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-5 px-8 mt-8">
            {[
              { href: "/",                      label: isDA ? "Forside"          : "Home" },
              { href: "/ydelser",               label: isDA ? "Ydelser"          : "Services" },
              { href: "/priser",                label: isDA ? "Priser"           : "Pricing" },
              { href: "/om-os",                 label: isDA ? "Om os"            : "About" },
              { href: "/tilmeld",               label: isDA ? "Tilmeld dig"      : "Join us" },
              { href: "/medarbejder/login",     label: isDA ? "Medarbejder login": "Employee login" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-condensed font-extrabold text-[26px] uppercase text-cream no-underline hover:text-yellow leading-none transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Contact info at bottom */}
          <div className="mt-auto px-8 pt-5 border-t border-[rgba(242,238,230,.07)]">
            <a href="tel:+4542778866" className="text-[15px] text-muted no-underline block mb-1 hover:text-cream transition-colors">
              +45 42 77 88 66
            </a>
            <a href="mailto:Kontakt@KrydsByg.com" className="text-[14px] text-muted no-underline hover:text-cream transition-colors">
              Kontakt@KrydsByg.com
            </a>
          </div>
        </div>
      )}
    </>
  );
}
