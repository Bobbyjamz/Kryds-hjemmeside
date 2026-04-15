"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { translations, type Lang } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  t: (key: string) => string;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "da",
  t: (k) => k,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("da");

  useEffect(() => {
    const saved = localStorage.getItem("kryds-lang") as Lang | null;
    if (saved === "da" || saved === "en") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("kryds-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  function t(key: string): string {
    return translations[lang][key] ?? translations["da"][key] ?? key;
  }

  return (
    <LanguageContext.Provider
      value={{ lang, t, toggle: () => setLang((l) => (l === "da" ? "en" : "da")) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
