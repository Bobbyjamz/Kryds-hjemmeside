"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

function handleBookNow(e: React.MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById("contract");
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("contract-pulse");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("contract-pulse");
  el.addEventListener("animationend", () => el.classList.remove("contract-pulse"), { once: true });
}

/* ── Sun icon ── */
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

/* ── Moon icon ── */
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ── Toggle switches ── */
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? t("nav_theme_to_light") : t("nav_theme_to_dark")}
      title={theme === "dark" ? t("nav_theme_light") : t("nav_theme_dark")}
      className="flex items-center gap-[6px] font-condensed font-bold text-[11px] tracking-[.1em] uppercase text-muted hover:text-yellow border border-[rgba(242,238,230,.12)] hover:border-[rgba(245,196,0,.4)] rounded-full px-[10px] py-[5px] transition-all duration-200 select-none"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function LangToggle() {
  const { lang, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      aria-label={lang === "da" ? "Switch to English" : "Skift til dansk"}
      title={lang === "da" ? "English" : "Dansk"}
      className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-muted hover:text-yellow border border-[rgba(242,238,230,.12)] hover:border-[rgba(245,196,0,.4)] rounded-[2px] px-[9px] py-[5px] transition-all duration-200 select-none min-w-[34px] text-center"
    >
      {lang === "da" ? "EN" : "DA"}
    </button>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-[52px] bg-[rgba(var(--nav-bg-rgb,12,12,10),.92)] backdrop-blur-[14px] border-b border-[rgba(242,238,230,0.07)] transition-[height] duration-300 max-[900px]:px-5"
        style={{
          height: scrolled ? 54 : 66,
          background: "color-mix(in srgb, var(--color-black) 92%, transparent)",
        }}
      >
        <Logo />

        <ul className="flex gap-[28px] list-none items-center">
          {/* Desktop links */}
          <li className="max-[900px]:hidden">
            <Link href="/" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
              {t("nav_forside")}
            </Link>
          </li>
          <li className="max-[900px]:hidden">
            <Link href="/ydelser" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
              {t("nav_ydelser")}
            </Link>
          </li>
          <li className="max-[900px]:hidden">
            <Link href="/priser" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
              {t("nav_priser")}
            </Link>
          </li>
          <li className="max-[900px]:hidden">
            <Link href="/om-os" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
              {t("nav_om_os")}
            </Link>
          </li>

          <li className="max-[900px]:hidden">
            <Link href="/medarbejder/registrer" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
              {lang === "da" ? "Bliv medarbejder" : "Join us"}
            </Link>
          </li>

          {/* Toggle switches — desktop */}
          <li className="max-[900px]:hidden flex items-center gap-[8px]">
            <ThemeToggle />
            <LangToggle />
          </li>

          <li className="max-[900px]:hidden">
            <a
              href={isHome ? "#contract" : "/#contract"}
              onClick={isHome ? handleBookNow : undefined}
              className="font-condensed font-extrabold text-[13px] tracking-[.08em] uppercase bg-yellow text-black px-6 py-[10px] rounded-none no-underline transition-colors hover:bg-yellow2"
            >
              {t("nav_kontakt")}
            </a>
          </li>

          {/* Mobile: Book + hamburger */}
          <li className="hidden max-[900px]:flex items-center gap-4">
            <a
              href={isHome ? "#contract" : "/#contract"}
              onClick={isHome ? handleBookNow : undefined}
              className="font-condensed font-extrabold text-[13px] tracking-[.08em] uppercase bg-yellow text-black px-5 py-[9px] rounded-none no-underline transition-colors hover:bg-yellow2"
            >
              {t("nav_kontakt")}
            </a>
            <button
              aria-label={menuOpen ? t("nav_menu_close") : t("nav_menu_open")}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex flex-col justify-center gap-[5px] w-[28px] h-[28px] bg-transparent border-none cursor-pointer p-0"
            >
              <span className="block h-[2px] bg-cream rounded-full transition-all duration-300" style={menuOpen ? { transform: "translateY(7px) rotate(45deg)" } : {}} />
              <span className="block h-[2px] bg-cream rounded-full transition-all duration-300" style={menuOpen ? { opacity: 0 } : {}} />
              <span className="block h-[2px] bg-cream rounded-full transition-all duration-300" style={menuOpen ? { transform: "translateY(-7px) rotate(-45deg)" } : {}} />
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile menu overlay — kun synlig på mobil (≤900px). Desktop er urørt. */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[490] flex-col justify-start items-stretch px-7 hidden max-[900px]:flex overflow-y-auto"
          style={{
            paddingTop: (scrolled ? 54 : 66) + 32,
            paddingBottom: 32,
            background: "color-mix(in srgb, var(--color-black) 97%, transparent)",
          }}
        >
          {/* Samme links som desktop — i samme rækkefølge */}
          <nav className="flex flex-col gap-5">
            {[
              { href: "/",                       label: t("nav_forside") },
              { href: "/ydelser",                label: t("nav_ydelser") },
              { href: "/priser",                 label: t("nav_priser") },
              { href: "/om-os",                  label: t("nav_om_os") },
              { href: "/medarbejder/registrer",  label: lang === "da" ? "Bliv medarbejder" : "Join us" },
            ].map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className={`font-condensed font-extrabold text-[26px] uppercase tracking-[-.005em] no-underline leading-none transition-colors ${
                    active ? "text-yellow" : "text-cream hover:text-yellow"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Kontakt CTA — samme gule knap-stil som desktop */}
          <a
            href={isHome ? "#contract" : "/#contract"}
            onClick={(e) => { closeMenu(); if (isHome) handleBookNow(e); }}
            className="mt-7 font-condensed font-extrabold text-[15px] tracking-[.08em] uppercase bg-yellow text-black px-6 py-3 rounded-none no-underline transition-colors hover:bg-yellow2 self-start"
          >
            {t("nav_kontakt")}
          </a>

          {/* Theme + Language — kompakt, ligesom desktop-toggles */}
          <div className="flex items-center gap-2 mt-7">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("nav_theme_to_light") : t("nav_theme_to_dark")}
              className="flex items-center gap-[6px] font-condensed font-bold text-[11px] tracking-[.1em] uppercase text-muted hover:text-yellow border border-[rgba(242,238,230,.15)] hover:border-yellow/40 rounded-full px-3 py-[6px] transition-all"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={toggleLang}
              aria-label={lang === "da" ? "Switch to English" : "Skift til dansk"}
              className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-muted hover:text-yellow border border-[rgba(242,238,230,.15)] hover:border-yellow/40 rounded-[2px] px-3 py-[6px] transition-all min-w-[36px] text-center"
            >
              {lang === "da" ? "EN" : "DA"}
            </button>
          </div>

          {/* Direkte-kontakt nederst — diskret, ikke i fokus */}
          <div className="mt-auto pt-8 border-t border-[rgba(242,238,230,0.07)] flex flex-col gap-1">
            <a href="tel:+4542778866" className="text-[14px] text-muted no-underline hover:text-cream transition-colors">
              +45 42 77 88 66
            </a>
            <a href="mailto:Kontakt@KrydsByg.com" className="text-[13px] text-muted no-underline hover:text-cream transition-colors">
              Kontakt@KrydsByg.com
            </a>
          </div>
        </div>
      )}
    </>
  );
}
