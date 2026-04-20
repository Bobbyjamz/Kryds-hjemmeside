"use client";

import { useEffect, useState } from "react";

const TABS = [
  {
    id: "home",
    label: "Hjem",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    id: "feed",
    label: "Beskeder",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "mine",
    label: "Mine",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
        <path d="M8 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "open",
    label: "Åbne",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 2" />
      </svg>
    ),
  },
];

export default function MedarbejderBottomNav() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 120;
      let current = "home";
      for (const t of TABS) {
        const el = document.getElementById(`emp-${t.id}`);
        if (el && el.offsetTop <= y) current = t.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(`emp-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="min-[700px]:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-black2 border-t border-[rgba(242,238,230,0.08)]"
      style={{
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => go(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] bg-transparent border-none cursor-pointer transition-colors"
            style={{
              minHeight: 64,
              color: isActive ? "var(--color-yellow)" : "rgba(242,238,230,.55)",
            }}
          >
            <span
              aria-hidden
              className="flex items-center justify-center"
              style={{
                width: 42,
                height: 28,
                borderRadius: 14,
                background: isActive ? "rgba(245,196,0,.12)" : "transparent",
                transition: "background .2s",
              }}
            >
              {tab.icon}
            </span>
            <span className="font-condensed font-bold text-[10px] tracking-[.1em] uppercase">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
