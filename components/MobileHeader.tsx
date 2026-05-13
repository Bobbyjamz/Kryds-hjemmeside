"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

/* Pænere "X" — samme stil som logoet (gul + cream på kryds) */
function PrettyX({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" style={{ display: "block" }}>
      <line x1="18" y1="18" x2="72" y2="72" stroke="#F5C400" strokeWidth="14" strokeLinecap="round" />
      <line x1="72" y1="18" x2="18" y2="72" stroke="var(--color-cream)" strokeWidth="14" strokeLinecap="round" />
    </svg>
  );
}

export default function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { lang, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const isDA = lang === "da";

  /* Tinder-style drag on overlay */
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);

  /* Portal mount flag (SSR-safe) */
  useEffect(() => { setMounted(true); }, []);

  /* Auto-close on navigation */
  useEffect(() => { setMenuOpen(false); setDragX(0); setAnimating(false); }, [pathname]);

  /* Body scroll lock when menu open */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  /* Reset drag when menu reopens */
  useEffect(() => {
    if (menuOpen) { setDragX(0); setAnimating(false); }
  }, [menuOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = false;
    setAnimating(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isHorizontal.current) {
      if (Math.abs(dy) > Math.abs(dx) + 4) return;
      if (Math.abs(dx) < 10) return;
      isHorizontal.current = true;
    }
    /* Only allow swipe-right (positive dx) to close */
    setDragX(dx > 0 ? dx : 0);
  };

  const onTouchEnd = () => {
    const threshold = window.innerWidth * 0.25;
    if (dragX > threshold) {
      /* Slide overlay off to the right and close */
      setAnimating(true);
      setDragX(window.innerWidth);
      setTimeout(() => {
        setMenuOpen(false);
        setDragX(0);
        setAnimating(false);
      }, 240);
    } else {
      /* Snap back */
      setAnimating(true);
      setDragX(0);
      setTimeout(() => setAnimating(false), 200);
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontal.current = false;
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

      {/* ── Fullscreen overlay menu — rendered via portal to escape transform-parents ── */}
      {menuOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{
            background: "color-mix(in srgb, var(--color-black) 97%, transparent)",
            paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
            transform: `translateX(${dragX}px)`,
            transition: animating ? "transform 0.24s ease-out" : "none",
            willChange: "transform",
            boxShadow: dragX > 0 ? "0 0 40px rgba(0,0,0,.5)" : undefined,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Top bar — pretty X close button (same XLogo style) */}
          <div
            className="flex items-center justify-end px-[18px] flex-shrink-0"
            style={{ height: 58, borderBottom: "1px solid rgba(242,238,230,.07)" }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              aria-label={isDA ? "Luk menu" : "Close menu"}
              className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{
                background: "var(--color-gray)",
                border: "1px solid rgba(242,238,230,.07)",
              }}
            >
              <PrettyX size={22} />
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
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-condensed font-extrabold text-[26px] uppercase text-cream no-underline hover:text-yellow leading-none transition-colors"
              >
                {l.label}
              </Link>
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
        </div>,
        document.body
      )}
    </>
  );
}
