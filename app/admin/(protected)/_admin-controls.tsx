"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminControls({ compact = false }: { compact?: boolean }) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();

  const btnBase = `flex items-center justify-center gap-[6px] border font-condensed font-bold text-[11px] tracking-[.12em] uppercase rounded-[2px] transition-colors
    border-[rgba(242,238,230,.1)] text-muted hover:text-cream hover:border-[rgba(242,238,230,.35)]`;

  if (compact) {
    // Kompakt version til mobil drawer footer — to knapper side om side
    return (
      <div className="flex gap-2">
        <button
          onClick={toggleTheme}
          className={`${btnBase} flex-1 py-[7px]`}
          title={theme === "dark" ? "Skift til lys tilstand" : "Skift til mørk tilstand"}
        >
          {theme === "dark" ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
          {theme === "dark" ? "Lys" : "Mørk"}
        </button>
        <button
          onClick={toggleLang}
          className={`${btnBase} px-4 py-[7px]`}
          title={lang === "da" ? "Switch to English" : "Skift til dansk"}
        >
          {lang === "da" ? "EN" : "DA"}
        </button>
      </div>
    );
  }

  // Fuld version til desktop sidebar — stacked
  return (
    <div className="flex gap-2">
      <button
        onClick={toggleTheme}
        className={`${btnBase} flex-1 py-2`}
        title={theme === "dark" ? "Skift til lys tilstand" : "Skift til mørk tilstand"}
      >
        {theme === "dark" ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
        {theme === "dark" ? "Lys" : "Mørk"}
      </button>
      <button
        onClick={toggleLang}
        className={`${btnBase} px-3 py-2`}
        title={lang === "da" ? "Switch to English" : "Skift til dansk"}
      >
        {lang === "da" ? "EN" : "DA"}
      </button>
    </div>
  );
}
