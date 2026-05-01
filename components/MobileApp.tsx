"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

// Images explicitly paired with each tile below so the swipe order never drifts

/* ── SVG icons ── */
function XLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 90 90" className="text-cream" style={{ marginRight: 10, flexShrink: 0 }}>
      <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
      <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}

type ServiceTile = {
  cat: string;
  num: string;
  labelKey: string;
  subKey: string;
  img: string;
  crossImages?: string[];
};

const SERVICE_TILES: ServiceTile[] = [
  { cat: "Rengøring & Oprydning",   num: "01", labelKey: "mob_tile_1_label", subKey: "mob_tile_1_sub", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80" },
  { cat: "Flytning & Transport",    num: "02", labelKey: "mob_tile_2_label", subKey: "mob_tile_2_sub", img: "/gallery/flyttearbejde.webp" },
  { cat: "Maling & Spartling",      num: "03", labelKey: "mob_tile_3_label", subKey: "mob_tile_3_sub", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80" },
  { cat: "Montering & Samling",     num: "04", labelKey: "mob_tile_4_label", subKey: "mob_tile_4_sub", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80" },
  { cat: "Have & Anlæg",            num: "05", labelKey: "mob_tile_5_label", subKey: "mob_tile_5_sub", img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80" },
  { cat: "Mindre Håndværk",         num: "06", labelKey: "mob_tile_6_label", subKey: "mob_tile_6_sub", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80" },
  { cat: "Byggepladsbehjælp",       num: "07", labelKey: "mob_tile_7_label", subKey: "mob_tile_7_sub", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80" },
  { cat: "Events & Scener",         num: "08", labelKey: "mob_tile_8_label", subKey: "mob_tile_8_sub", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80" },
  {
    cat: "Kombineret / Andet",      num: "09", labelKey: "mob_tile_9_label", subKey: "mob_tile_9_sub",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80",
    crossImages: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=450&q=80",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=450&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=450&q=80",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=450&q=80",
    ],
  },
];

type FormState = "idle" | "submitting" | "success" | "error";

export default function MobileApp() {
  const { lang, t, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState("home");
  const [selectedCat, setSelectedCat] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [phone, setPhone] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const bookRef = useRef<HTMLElement>(null);
  const branchScrollRef = useRef<HTMLDivElement>(null);
  const branchPausedRef = useRef(false);
  const branchRafRef = useRef<number>(0);

  // Infinite auto-scroll for branch tiles (mirrors desktop BranchCarousel)
  useEffect(() => {
    const view = branchScrollRef.current;
    if (!view) return;
    function tick() {
      if (view && !branchPausedRef.current) {
        const half = view.scrollWidth / 2;
        if (half > 0) {
          view.scrollLeft += 0.6;
          if (view.scrollLeft >= half) {
            view.scrollLeft -= half;
          }
        }
      }
      branchRafRef.current = requestAnimationFrame(tick);
    }
    branchRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(branchRafRef.current);
  }, []);

  // Compute duration
  const duration = (() => {
    if (!dateStart || !dateEnd) return null;
    const a = new Date(dateStart), b = new Date(dateEnd);
    const days = Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
    return days > 0 ? days : null;
  })();

  function centerBranchTile(tileEl: HTMLElement) {
    const view = branchScrollRef.current;
    if (!view) return;
    const viewRect = view.getBoundingClientRect();
    const tileRect = tileEl.getBoundingClientRect();
    const currentScroll = view.scrollLeft;
    const tileCenter = tileRect.left - viewRect.left + currentScroll + tileRect.width / 2;
    const target = tileCenter - viewRect.width / 2;
    view.scrollTo({ left: target, behavior: "smooth" });
  }

  function prefillAndScroll(cat: string) {
    setSelectedCat(cat);
    setActiveNav("book");
    bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // flash highlight
    const card = bookRef.current?.querySelector(".app-book-card") as HTMLElement | null;
    if (card) {
      card.style.boxShadow = "0 0 0 2px var(--color-yellow)";
      card.style.transition = "box-shadow .4s";
      setTimeout(() => { card.style.boxShadow = ""; }, 650);
    }
  }

  async function handleBookSubmit() {
    if (!phone) return;
    setFormState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          virksomhed: "",
          kontaktperson: "",
          email: "",
          telefon: phone,
          opgavetype: selectedCat || "Ikke angivet",
          antal: "1",
          startdato: dateStart,
          beskrivelse: `Fra: ${dateStart} Til: ${dateEnd}${duration ? ` (${duration} dage)` : ""}`,
          acceptedTerms: true,
          contractVersion: "mobile-v1",
        }),
      });
      setFormState(res.ok ? "success" : "error");
    } catch {
      setFormState("error");
    }
  }

  const isDA = lang === "da";

  return (
    <div className="app-mobile-wrapper">
      {/* ── TOP HEADER ── */}
      <header className="app-header">
        <a href="#" className="flex items-center gap-0 no-underline">
          <XLogo />
          <div className="flex flex-col justify-center">
            <span className="font-condensed font-black text-[20px] tracking-[.02em] uppercase leading-none text-cream">
              <span className="text-yellow">K</span>RYDS
            </span>
            <span className="font-condensed italic font-normal text-[12px] tracking-[.08em] text-muted leading-none mt-[4px]">
              Sæt et kryds i kalenderen.
            </span>
          </div>
        </a>
        <div className="flex items-center gap-2">
          {/* Language + theme mini-toggles */}
          <button
            onClick={toggleLang}
            className="font-condensed font-bold text-[10px] tracking-[.12em] uppercase text-muted border border-[rgba(242,238,230,.12)] rounded-[3px] px-[7px] py-[4px] hover:text-yellow hover:border-yellow transition-all"
          >
            {isDA ? "EN" : "DA"}
          </button>
          <button
            onClick={toggleTheme}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center border border-[rgba(242,238,230,.12)] hover:border-yellow transition-all"
            style={{ background: "var(--color-gray)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C49800" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="app-menu-btn"
            aria-label="Menu"
          >
            <span style={menuOpen ? { transform: "translateY(6px) rotate(45deg)" } : {}} />
            <span style={menuOpen ? { opacity: 0 } : {}} />
            <span style={menuOpen ? { transform: "translateY(-6px) rotate(-45deg)" } : {}} />
          </button>
        </div>
      </header>

      {/* Menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[400] flex flex-col"
          style={{
            background: "color-mix(in srgb, var(--color-black) 97%, transparent)",
            paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {/* Top bar: mirrors header height + positions close-X at same spot as hamburger */}
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

          {/* Navigation links — compact, no centering gap */}
          <div className="flex flex-col gap-5 px-8 mt-8">
            {[
              { href: "/", label: isDA ? "Forside" : "Home" },
              { href: "/ydelser", label: isDA ? "Ydelser" : "Services" },
              { href: "/priser", label: isDA ? "Priser" : "Pricing" },
              { href: "/om-os", label: isDA ? "Om os" : "About" },
              { href: "/tilmeld", label: isDA ? "Tilmeld dig" : "Join us" },
              { href: "/medarbejder/login", label: isDA ? "Medarbejder login" : "Employee login" },
            ].map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="font-condensed font-extrabold text-[26px] uppercase text-cream no-underline hover:text-yellow leading-none transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* Contact info pushed to bottom */}
          <div className="mt-auto px-8 pt-5 border-t border-[rgba(242,238,230,.07)]">
            <a href="tel:+4542778866" className="text-[15px] text-muted no-underline block mb-1 hover:text-cream transition-colors">+45 42 77 88 66</a>
            <a href="mailto:Kontakt@KrydsByg.com" className="text-[14px] text-muted no-underline hover:text-cream transition-colors">Kontakt@KrydsByg.com</a>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="px-5 pt-7 pb-4 relative">
        <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-[10px] flex items-center gap-[8px]">
          <span className="inline-block w-[18px] h-[1px] bg-yellow" />
          {isDA ? "Velkommen" : "Welcome"}
        </p>
        <h1 className="font-condensed font-black text-[44px] leading-[.92] uppercase tracking-[-.01em] text-cream">
          {isDA ? <>Sæt et kryds<br /><span className="text-yellow">i kalenderen</span></> : <>Put a cross<br /><span className="text-yellow">in the calendar</span></>}
        </h1>
        <p className="text-[14px] leading-[1.6] text-muted mt-[10px]">
          {isDA ? "Erfarne byggefolk i København — klar til at tage fat." : "Experienced construction workers in Copenhagen — ready to work."}
        </p>

      </section>

      {/* ── TWO ACTION CARDS ── */}
      <div className="flex flex-col gap-3 px-5 pt-[22px] pb-2">
        <button
          onClick={() => prefillAndScroll("")}
          className="app-cta-primary flex items-center gap-[14px] p-4 rounded-[14px] no-underline text-black transition-transform active:scale-[.98]"
          style={{ background: "var(--color-yellow)" }}
        >
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(12,12,10,.12)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/><path d="M8 14l2 2 4-4"/></svg>
          </div>
          <div className="flex flex-col gap-[2px] text-left">
            <strong className="font-condensed font-extrabold text-[17px] tracking-[.02em] uppercase">{isDA ? "Bestil personale" : "Order staff"}</strong>
            <span className="text-[12px] opacity-70">{isDA ? "Få folk på pladsen hurtigt" : "Get people on site fast"}</span>
          </div>
        </button>
        <a
          href="/tilmeld"
          className="flex items-center gap-[14px] p-4 rounded-[14px] no-underline transition-transform active:scale-[.98]"
          style={{ background: "var(--color-gray)", border: "1px solid rgba(242,238,230,.07)", color: "var(--color-cream)" }}
        >
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,196,0,.1)", border: "1px solid rgba(245,196,0,.25)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
          </div>
          <div className="flex flex-col gap-[2px]">
            <strong className="font-condensed font-extrabold text-[17px] tracking-[.02em] uppercase">{isDA ? "Bliv en del af KrydsByg" : "Join KrydsByg"}</strong>
            <span className="text-[12px] opacity-70">{isDA ? "Tilmeld dig som byggefolk" : "Sign up as construction worker"}</span>
          </div>
        </a>
        {/* Employee login chip */}
        <a
          href="/medarbejder/login"
          className="flex items-center justify-center gap-[8px] no-underline transition-colors active:scale-[.98]"
          style={{
            background: "transparent",
            border: "1px solid rgba(245,196,0,.4)",
            color: "var(--color-yellow)",
            minHeight: 44,
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          <span className="font-condensed font-bold text-[12px] tracking-[.18em] uppercase">
            {isDA ? "Log ind som medarbejder" : "Employee login"}
          </span>
        </a>
      </div>


      {/* ── SERVICE TILES CAROUSEL ── */}
      <section className="pt-6 pb-2" id="appServices">
        <div className="flex items-center justify-between px-5 mb-[14px]">
          <span className="font-condensed font-extrabold text-[13px] tracking-[.2em] uppercase text-muted flex items-center gap-[10px]">
            <span className="inline-block w-[18px] h-[1px] bg-yellow align-middle" />
            {isDA ? "Alle brancher" : "All branches"}
          </span>
          <span className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.25)] flex items-center gap-[6px]">
            <span className="inline-block w-[14px] h-[1px] bg-[rgba(245,196,0,.4)]" />
            Swipe →
          </span>
        </div>
        <div
          ref={branchScrollRef}
          className="flex gap-3 overflow-x-auto px-5 pb-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          onTouchStart={() => { branchPausedRef.current = true; }}
          onTouchEnd={() => { setTimeout(() => { branchPausedRef.current = false; }, 1400); }}
          onTouchCancel={() => { setTimeout(() => { branchPausedRef.current = false; }, 1400); }}
        >
          {[...SERVICE_TILES, ...SERVICE_TILES].map((tile, i) => {
            return (
              <button
                key={`${tile.cat}-${i}`}
                onClick={(e) => {
                  centerBranchTile(e.currentTarget);
                  // small delay so user sees the center animation before scrolling to booking
                  setTimeout(() => prefillAndScroll(tile.cat), 320);
                }}
                className="app-service-tile flex-shrink-0 relative overflow-hidden rounded-[16px] text-left transition-all active:scale-[.96]"
                style={{
                  width: "78vw",
                  maxWidth: 300,
                  height: 200,
                  border: "1px solid rgba(242,238,230,.07)",
                  background: "#111110",
                }}
              >
                {tile.crossImages ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "3px",
                      background: "#F5C400",
                    }}
                  >
                    {tile.crossImages.map((src, idx) => (
                      <div
                        key={idx}
                        className="bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${src}')`,
                          filter: "grayscale(25%) brightness(0.6) saturate(0.9)",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${tile.img}')`,
                      filter: "grayscale(25%) brightness(0.6) saturate(0.9)",
                    }}
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(12,12,10,0.92) 0%, rgba(12,12,10,0.4) 60%, transparent 100%)",
                  }}
                />
                <span className="absolute top-3 right-3 font-condensed font-bold text-[10px] tracking-[.16em] uppercase bg-yellow px-[10px] py-[4px] rounded-full" style={{ color: "#0C0C0A" }}>
                  {isDA ? "Book →" : "Book →"}
                </span>
                <span className="absolute top-4 left-4 text-yellow text-[11px] font-bold uppercase tracking-[.15em]">
                  — {tile.num}
                </span>
                <div className="relative h-full flex flex-col justify-end p-4">
                  <h5 className="font-condensed text-white font-black text-[20px] tracking-[.02em] uppercase leading-[1.05]" style={{ textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
                    {t(tile.labelKey)}
                  </h5>
                  <p className="text-[12px] mt-[4px]" style={{ color: "rgba(242,238,230,.7)", textShadow: "0 1px 3px rgba(0,0,0,.5)" }}>{t(tile.subKey)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── HURTIG BOOKING ── */}
      <section className="px-5 pt-6 pb-4" id="appBook" ref={bookRef}>
        <div className="flex items-center mb-[14px]">
          <span className="font-condensed font-extrabold text-[13px] tracking-[.2em] uppercase text-muted flex items-center gap-[10px]">
            <span className="inline-block w-[18px] h-[1px] bg-yellow align-middle" />
            {isDA ? "Hurtig booking" : "Quick booking"}
          </span>
        </div>

        <div className="app-book-card rounded-[16px] p-[18px] relative overflow-hidden" style={{ background: "var(--color-gray)", border: "1px solid rgba(242,238,230,.07)" }}>
          {/* Yellow top bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "var(--color-yellow)" }} />

          {formState === "success" ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-yellow mx-auto mb-4 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0C0C0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-2">
                {isDA ? "Tak!" : "Thank you!"}
              </h3>
              <p className="text-[14px] text-muted">{isDA ? "Vi ringer dig op inden for 2 timer." : "We'll call you back within 2 hours."}</p>
              <button onClick={() => setFormState("idle")} className="mt-5 font-condensed font-bold text-[11px] tracking-[.15em] uppercase text-yellow border border-[rgba(245,196,0,.3)] px-5 py-2 rounded-[8px]">
                {isDA ? "Ny booking" : "New booking"}
              </button>
            </div>
          ) : (
            <>
              {/* Date range */}
              <div className="flex items-stretch rounded-[12px] overflow-hidden mb-3" style={{ background: "var(--color-black)", border: "1px solid var(--border)" }}>
                <label className="flex-1 flex flex-col gap-1 p-[10px] px-3 cursor-pointer relative">
                  <span className="font-condensed font-bold text-[9px] tracking-[.2em] uppercase text-yellow pointer-events-none">{isDA ? "Fra" : "From"}</span>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={e => setDateStart(e.target.value)}
                    className="bg-transparent border-none text-cream font-sans text-[14px] outline-none w-full cursor-pointer"
                    style={{
                      colorScheme: theme === "dark" ? "dark" : "light",
                      WebkitAppearance: "none",
                      minHeight: 28,
                      padding: 0,
                    }}
                  />
                </label>
                <div className="flex items-center justify-center px-[6px] text-yellow text-[16px] pointer-events-none" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>→</div>
                <label className="flex-1 flex flex-col gap-1 p-[10px] px-3 cursor-pointer relative">
                  <span className="font-condensed font-bold text-[9px] tracking-[.2em] uppercase text-yellow pointer-events-none">{isDA ? "Til" : "To"}</span>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={e => setDateEnd(e.target.value)}
                    min={dateStart || undefined}
                    className="bg-transparent border-none text-cream font-sans text-[14px] outline-none w-full cursor-pointer"
                    style={{
                      colorScheme: theme === "dark" ? "dark" : "light",
                      WebkitAppearance: "none",
                      minHeight: 28,
                      padding: 0,
                    }}
                  />
                </label>
              </div>

              {duration && (
                <p className="text-[11px] text-muted text-center mb-3 tracking-[.08em]">
                  {isDA ? "Varighed:" : "Duration:"} <strong className="text-yellow font-bold">{duration} {isDA ? (duration === 1 ? "dag" : "dage") : (duration === 1 ? "day" : "days")}</strong>
                </p>
              )}

              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
                className="w-full rounded-[10px] px-[14px] py-3 mb-[10px] font-sans text-[14px] outline-none appearance-none"
                style={{ background: "var(--color-black)", border: "1px solid var(--border)", color: "var(--color-cream)" }}
              >
                <option value="">{isDA ? "Vælg opgavetype…" : "Select task type…"}</option>
                {SERVICE_TILES.map(t => <option key={t.cat} value={t.cat}>{t.cat}</option>)}
              </select>

              <input
                type="tel"
                placeholder={isDA ? "Dit telefonnummer" : "Your phone number"}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-[10px] px-[14px] py-3 mb-[10px] font-sans text-[14px] outline-none"
                style={{ background: "var(--color-black)", border: "1px solid var(--border)", color: "var(--color-cream)" }}
              />

              <button
                onClick={handleBookSubmit}
                disabled={!phone || formState === "submitting"}
                className="w-full rounded-[12px] py-[15px] font-condensed font-extrabold text-[15px] tracking-[.1em] uppercase border-none disabled:opacity-40 transition-colors"
                style={{ background: "var(--color-yellow)", color: "var(--color-black)" }}
              >
                {formState === "submitting"
                  ? (isDA ? "Sender..." : "Sending...")
                  : (isDA ? "Send forespørgsel →" : "Send request →")}
              </button>

              {formState === "error" && (
                <p className="text-red-400 text-[12px] mt-2 text-center">
                  {isDA ? "Noget gik galt. Ring på +45 42 77 88 66" : "Something went wrong. Call +45 42 77 88 66"}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── CONTACT STRIP ── */}
      <section className="px-5 pt-6 pb-2">
        <div className="flex items-center mb-[14px]">
          <span className="font-condensed font-extrabold text-[13px] tracking-[.2em] uppercase text-muted flex items-center gap-[10px]">
            <span className="inline-block w-[18px] h-[1px] bg-yellow align-middle" />
            {isDA ? "Kontakt" : "Contact"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:+4542778866"
            className="flex flex-col items-start gap-[6px] p-4 rounded-[14px] no-underline transition-transform active:scale-[.97]"
            style={{ background: "var(--color-gray)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(245,196,0,.1)", border: "1px solid rgba(245,196,0,.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z"/></svg>
            </div>
            <span className="font-condensed font-bold text-[10px] tracking-[.15em] uppercase text-muted">{isDA ? "Ring til os" : "Call us"}</span>
            <span className="font-condensed font-extrabold text-[14px] text-cream">+45 42 77 88 66</span>
          </a>
          <a href="mailto:Kontakt@KrydsByg.com"
            className="flex flex-col items-start gap-[6px] p-4 rounded-[14px] no-underline transition-transform active:scale-[.97]"
            style={{ background: "var(--color-gray)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(245,196,0,.1)", border: "1px solid rgba(245,196,0,.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
            </div>
            <span className="font-condensed font-bold text-[10px] tracking-[.15em] uppercase text-muted">{isDA ? "Skriv til os" : "Email us"}</span>
            <span className="font-condensed font-extrabold text-[13px] text-cream break-all">Kontakt@KrydsByg.com</span>
          </a>
        </div>

      </section>

      {/* Spacer for bottom nav */}
      <div style={{ height: "calc(78px + env(safe-area-inset-bottom, 0px))" }} />

      {/* ── BOTTOM NAV ── */}
      <nav className="app-bottom-nav">
        {[
          { id: "home", href: "#", label: isDA ? "Hjem" : "Home", icon: <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg> },
          { id: "book", href: "#appBook", label: isDA ? "Book" : "Book", icon: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg> },
          { id: "ring", href: "tel:+4542778866", label: isDA ? "Ring" : "Call", icon: <svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z"/></svg> },
        ].map(item => (
          <a
            key={item.id}
            href={item.href}
            onClick={e => {
              if (item.href.startsWith("#")) {
                e.preventDefault();
                const el = document.querySelector(item.href);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
              setActiveNav(item.id);
            }}
            className={`flex-1 flex flex-col items-center gap-[3px] py-2 no-underline rounded-[12px] transition-all ${activeNav === item.id ? "app-nav-active" : ""}`}
          >
            <svg className="app-nav-icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.icon.props.children}
            </svg>
            <span className="font-condensed font-bold text-[10px] tracking-[.1em] uppercase">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
