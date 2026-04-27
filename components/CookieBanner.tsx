"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("kryds-cookie-consent");
      if (!consent) setVisible(true);
    } catch {
      // localStorage not available
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem("kryds-cookie-consent", "accepted");
    } catch {}
    setVisible(false);
  };

  const decline = () => {
    try {
      localStorage.setItem("kryds-cookie-consent", "declined");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[600] border-t border-[rgba(242,238,230,.1)]"
      style={{ background: "rgba(12,12,10,0.97)", backdropFilter: "blur(14px)" }}
    >
      <div className="max-w-[1100px] mx-auto px-[52px] py-4 flex items-center justify-between gap-6 flex-wrap max-[900px]:px-5 max-[900px]:py-4">
        <div className="flex items-start gap-3 flex-1 min-w-[220px]">
          <span className="flex-shrink-0 mt-[2px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
          <p className="text-[13px] text-muted leading-[1.6]">
            Vi bruger nødvendige cookies til at hjemmesiden fungerer, og analytiske cookies til at måle besøgstal anonymt.
            Ingen data sælges til tredjeparter.{" "}
            <Link href="/cookie-politik" className="text-yellow hover:underline">
              Læs cookie-politik
            </Link>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="font-condensed font-bold text-[11px] tracking-[.08em] uppercase text-muted border border-[var(--border)] px-4 py-[9px] rounded-none hover:text-cream hover:border-[rgba(242,238,230,.35)] transition-colors whitespace-nowrap"
          >
            Afvis
          </button>
          <button
            onClick={accept}
            className="font-condensed font-extrabold text-[11px] tracking-[.08em] uppercase bg-yellow text-black px-5 py-[9px] rounded-none hover:bg-yellow2 transition-colors whitespace-nowrap"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
