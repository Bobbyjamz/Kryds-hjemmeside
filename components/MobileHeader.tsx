"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

/* ── XLogo ── */
function XLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 90 90"
      style={{ marginRight: 10, flexShrink: 0, color: "var(--color-cream)" }}
    >
      <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
      <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
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
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 72) setMenuOpen(false);
    touchStartX.current = null;
  };

  const navLinks = [
    { href: "/",                      label: isDA ? "Forside"          : "Home" },
    { href: "/ydelser",               label: isDA ? "Ydelser"          : "Services" },
    { href: "/priser",                label: isDA ? "Priser"           : "Prices" },
    { href: "/om-os",                 label: isDA ? "Om os"            : "About us" },
    { href: "/medarbejder/registrer", label: isDA ? "Bliv medarbejder" : "Join us" },
  ];

  return (
    <>
      {/* ── Sticky top bar ── */}
      <header className="app-header" style={{ zIndex: 80 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center no-underline" style={{ textDecoration: "none" }}>
          <XLogo />
          <div className="flex flex-col justify-center">
            <span
              className="font-condensed font-black text-[20px] tracking-[.02em] uppercase leading-none"
              style={{ color: "var(--color-cream)" }}
            >
              <span style={{ color: "var(--color-yellow)" }}>K</span>RYDS
            </span>
            <span
              className="font-condensed italic font-normal text-[12px] tracking-[.08em] leading-none mt-[4px]"
              style={{ color: "var(--color-muted)" }}
            >
              {isDA ? "Sæt et kryds i kalenderen." : "Put a cross in the calendar."}
            </span>
          </div>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Lang toggle */}
          <button
            onClick={toggleLang}
            aria-label={isDA ? "Switch to English" : "Skift til dansk"}
            className="font-condensed font-bold text-[10px] tracking-[.15em] uppercase"
            style={{
              color: "var(--color-muted)",
              border: "1px solid rgba(242,238,230,.12)",
              borderRadius: 6,
              padding: "5px 9px",
              background: "transparent",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            {isDA ? "EN" : "DA"}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Lys tilstand" : "Mørk tilstand"}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--color-gray)",
              border: "1px solid rgba(242,238,230,.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-muted)",
              flexShrink: 0,
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Hamburger — app-menu-btn style */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="app-menu-btn"
            aria-label={menuOpen ? "Luk menu" : "Åbn menu"}
            style={{ position: "relative", zIndex: 491 }}
          >
            <span style={menuOpen ? { transform: "translateY(7px) rotate(45deg)" } : {}} />
            <span style={menuOpen ? { opacity: 0 } : {}} />
            <span style={menuOpen ? { transform: "translateY(-7px) rotate(-45deg)", width: 18 } : {}} />
          </button>
        </div>
      </header>

      {/* ── Fullscreen overlay menu ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 flex flex-col px-7 overflow-y-auto"
          style={{
            zIndex: 490,
            paddingTop: 58 + 20,
            paddingBottom: 32,
            background: "color-mix(in srgb, var(--color-black) 97%, transparent)",
            backdropFilter: "blur(8px)",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Nav links */}
          <nav className="flex flex-col gap-5">
            {navLinks.map(({ href, label }) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block py-2 font-condensed font-extrabold text-[26px] uppercase tracking-[-.005em] no-underline leading-none transition-colors ${
                    active ? "text-yellow" : "text-cream hover:text-yellow"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* CTA knap */}
          <a
            href="/#contract"
            onClick={() => setMenuOpen(false)}
            className="mt-7 font-condensed font-extrabold text-[15px] tracking-[.08em] uppercase px-6 py-3 rounded-none no-underline self-start"
            style={{ background: "var(--color-yellow)", color: "#0C0C0A" }}
          >
            {isDA ? "Kontakt os" : "Contact us"}
          </a>

          {/* Theme + Lang toggles */}
          <div className="flex items-center gap-2 mt-7">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Lys tilstand" : "Mørk tilstand"}
              className="flex items-center gap-[6px] font-condensed font-bold text-[11px] tracking-[.1em] uppercase"
              style={{
                color: "var(--color-muted)",
                border: "1px solid rgba(242,238,230,.15)",
                borderRadius: 99,
                padding: "6px 12px",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={toggleLang}
              className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase"
              style={{
                color: "var(--color-muted)",
                border: "1px solid rgba(242,238,230,.15)",
                borderRadius: 4,
                padding: "6px 12px",
                background: "transparent",
                cursor: "pointer",
                minWidth: 36,
                textAlign: "center",
              }}
            >
              {isDA ? "EN" : "DA"}
            </button>
          </div>

          {/* Contact info */}
          <div
            className="mt-auto pt-8 flex flex-col gap-1"
            style={{ borderTop: "1px solid rgba(242,238,230,0.07)" }}
          >
            <a
              href="tel:+4542778866"
              className="no-underline hover:text-cream transition-colors"
              style={{ fontSize: 14, color: "var(--color-muted)" }}
            >
              +45 42 77 88 66
            </a>
            <a
              href="mailto:Kontakt@KrydsByg.com"
              className="no-underline hover:text-cream transition-colors"
              style={{ fontSize: 13, color: "var(--color-muted)" }}
            >
              Kontakt@KrydsByg.com
            </a>
          </div>
        </div>
      )}
    </>
  );
}
