"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminControls from "./_admin-controls";

const NAV_ITEMS = [
  { href: "/admin",              label: "Dashboard",    icon: "⊞" },
  { href: "/admin/leads",        label: "Leads",        icon: "◆" },
  { href: "/admin/sarah",        label: "Sarah",        icon: "✦" },
  { href: "/admin/helbred",      label: "Helbred",      icon: "♥" },
  { href: "/admin/council",      label: "Council",      icon: "▲" },
  { href: "/admin/medarbejdere", label: "Medarbejdere", icon: "👤" },
  { href: "/admin/vagter",       label: "Vagter",       icon: "📅" },
  { href: "/admin/kunder",       label: "Kunder",       icon: "🏢" },
  { href: "/admin/tilbud",       label: "Tilbud",       icon: "📄" },
  { href: "/admin/feed",         label: "Feed",         icon: "📡" },
  { href: "/admin/debug",        label: "Debug",        icon: "🔧" },
];

export default function MobileAdminNav({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "";

  const currentPage = NAV_ITEMS.find((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
  );

  return (
    <>
      {/* ── Top header bar ── */}
      <header className="min-[700px]:hidden sticky top-0 z-30 flex items-center justify-between px-4 bg-black2 border-b border-[rgba(242,238,230,0.07)]" style={{ height: 52 }}>
        <Link href="/" className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 90 90" className="text-cream">
            <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
            <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
          </svg>
          <span className="font-condensed font-black text-[13px] uppercase tracking-[.06em] text-cream">
            {currentPage?.label ?? "Admin"}
          </span>
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col justify-center items-center gap-[5px] w-10 h-10"
          aria-label="Åbn menu"
        >
          <span className="block w-[22px] h-[2px] bg-cream rounded-full" />
          <span className="block w-[22px] h-[2px] bg-cream rounded-full" />
          <span className="block w-[16px] h-[2px] bg-cream rounded-full self-end" />
        </button>
      </header>

      {/* ── Drawer overlay ── */}
      {open && (
        <div
          className="min-[700px]:hidden fixed inset-0 z-50"
          style={{ background: "rgba(12,12,10,.7)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[280px] bg-black2 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 border-b border-[rgba(242,238,230,0.07)]" style={{ height: 52 }}>
              <span className="font-condensed font-black text-[12px] tracking-[.2em] uppercase text-muted">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-cream"
                aria-label="Luk menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3">
              {NAV_ITEMS.map((item) => {
                const active = item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-4 px-5 py-[14px] font-condensed font-bold text-[13px] tracking-[.08em] uppercase transition-colors ${
                      active
                        ? "text-yellow bg-[rgba(245,196,0,.08)] border-r-2 border-yellow"
                        : "text-muted hover:text-cream hover:bg-[rgba(242,238,230,.03)]"
                    }`}
                  >
                    <span className="text-[16px] leading-none w-6 text-center">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Controls + Log ud */}
            <div className="px-5 py-4 border-t border-[rgba(242,238,230,0.07)]">
              <AdminControls compact />
              <p className="text-[11px] text-muted mt-3 mb-2">Logget ind som <span className="text-cream">{username}</span></p>
              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="w-full border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[11px] tracking-[.15em] uppercase py-2 hover:text-cream hover:border-cream transition-colors rounded-[2px]"
                >
                  Log ud
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
