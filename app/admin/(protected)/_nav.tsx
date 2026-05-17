"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/admin",
    label: "Dashboard",
    match: (p: string) => p === "/admin",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    href: "/admin/medarbejdere",
    label: "Medarb.",
    match: (p: string) => p.startsWith("/admin/medarbejdere"),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/vagter",
    label: "Vagter",
    match: (p: string) => p.startsWith("/admin/vagter"),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: "/admin/feed",
    label: "Feed",
    match: (p: string) => p.startsWith("/admin/feed"),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/kunder",
    label: "Kunder",
    match: (p: string) => p.startsWith("/admin/kunder"),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/sarah",
    label: "Sarah",
    match: (p: string) => p.startsWith("/admin/sarah"),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-7 9-4-3-7-5-7-9a7 7 0 0 1 7-7z" />
        <circle cx="12" cy="9" r="2" />
      </svg>
    ),
  },
  {
    href: "/admin/helbred",
    label: "Helbred",
    match: (p: string) => p.startsWith("/admin/helbred"),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/admin/tilbud",
    label: "Tilbud",
    match: (p: string) => p.startsWith("/admin/tilbud"),
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h4M8 17h8" />
      </svg>
    ),
  },
];

export default function AdminBottomNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      className="min-[700px]:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-black2 border-t border-[rgba(242,238,230,0.08)]"
      style={{
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors"
            style={{
              minHeight: 64,
              color: active ? "var(--color-yellow)" : "rgba(242,238,230,.55)",
            }}
          >
            <span
              aria-hidden
              className="flex items-center justify-center"
              style={{
                width: 42,
                height: 28,
                borderRadius: 14,
                background: active ? "rgba(245,196,0,.12)" : "transparent",
                transition: "background .2s",
              }}
            >
              {tab.icon}
            </span>
            <span className="font-condensed font-bold text-[10px] tracking-[.1em] uppercase">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
