"use client";

import { useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

/* ============================================================
   Tinder-style page swipe — PERFORMANCE-OPTIMERET v5
   ------------------------------------------------------------
   Vigtige optimeringer ift. tidligere version:
   1. INGEN React state under drag — alle transforms skrives
      direkte på DOM via requestAnimationFrame. State bruges KUN
      ved touch-start (reset) og touch-end (commit/snap).
   2. INGEN iframes — statiske farveplader som peek-baggrund.
      Iframes loader hele sider, kører React, lytter til events
      og dræber GPU under animation.
   3. INGEN filter: blur — én af de dyreste GPU-effekter.
      Opacity + scale er nok til at give dybde-fornemmelsen.
   4. INGEN animeret box-shadow — kun statisk shadow ved drag.
   5. Bail-out hvis touch starter inde i et element med
      [data-no-page-swipe] (fx BranchCarousel).
   ============================================================ */

const PAGE_ORDER = ["/", "/ydelser", "/priser", "/om-os", "/tilmeld", "/medarbejder/login"];

const LABELS_DA: Record<string, string> = {
  "/": "Forside",
  "/ydelser": "Ydelser",
  "/priser": "Priser",
  "/om-os": "Om os",
  "/tilmeld": "Tilmeld",
  "/medarbejder/login": "Medarbejder",
};

const LABELS_EN: Record<string, string> = {
  "/": "Home",
  "/ydelser": "Services",
  "/priser": "Pricing",
  "/om-os": "About",
  "/tilmeld": "Join us",
  "/medarbejder/login": "Employee",
};

const IOS_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/* Tuning */
const HORIZONTAL_LOCK_PX = 8;
const VERTICAL_LEAD_PX = 4;
const COMMIT_THRESHOLD_PCT = 0.22;
const EDGE_RESISTANCE = 0.22;
const NAV_DURATION_MS = 280;

export default function MobileSwipeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useLanguage();
  const labels = lang === "da" ? LABELS_DA : LABELS_EN;

  /* ── DOM refs — vi skriver direkte på disse, ikke via state ── */
  const cardRef = useRef<HTMLDivElement>(null);
  const peekLeftRef = useRef<HTMLDivElement>(null);
  const peekRightRef = useRef<HTMLDivElement>(null);
  const hintLeftRef = useRef<HTMLDivElement>(null);
  const hintRightRef = useRef<HTMLDivElement>(null);

  /* ── Mutable drag state — INGEN React-rerenders ── */
  const startX = useRef(0);
  const startY = useRef(0);
  const dragX = useRef(0);
  const isHorizontal = useRef(false);
  const dragging = useRef(false);
  const navigating = useRef(false);
  const rafId = useRef<number | null>(null);

  const currentIdx = PAGE_ORDER.indexOf(pathname ?? "/");
  const prevPage = currentIdx > 0 ? PAGE_ORDER[currentIdx - 1] : null;
  const nextPage = currentIdx >= 0 && currentIdx < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIdx + 1] : null;
  const enabled = currentIdx !== -1;

  /* ── Direct DOM-skrivning (kører i rAF, max 1× pr. frame) ── */
  const writeFrame = () => {
    rafId.current = null;
    const card = cardRef.current;
    if (!card) return;
    const winW = window.innerWidth;
    const dx = dragX.current;
    const progress = Math.min(Math.abs(dx) / winW, 1);
    const scale = 1 - progress * 0.08;
    const radius = progress * 24;

    card.style.transform = `translate3d(${dx}px, 0, 0) scale(${scale})`;
    card.style.borderRadius = `${radius}px`;

    const peekLeft = peekLeftRef.current;
    const peekRight = peekRightRef.current;
    const hintLeft = hintLeftRef.current;
    const hintRight = hintRightRef.current;

    if (dx < 0 && nextPage) {
      if (peekRight) peekRight.style.opacity = (0.5 + progress * 0.5).toFixed(2);
      if (peekLeft) peekLeft.style.opacity = "0";
      if (hintRight) hintRight.style.opacity = progress.toFixed(2);
      if (hintLeft) hintLeft.style.opacity = "0";
    } else if (dx > 0 && prevPage) {
      if (peekLeft) peekLeft.style.opacity = (0.5 + progress * 0.5).toFixed(2);
      if (peekRight) peekRight.style.opacity = "0";
      if (hintLeft) hintLeft.style.opacity = progress.toFixed(2);
      if (hintRight) hintRight.style.opacity = "0";
    } else {
      if (peekLeft) peekLeft.style.opacity = "0";
      if (peekRight) peekRight.style.opacity = "0";
      if (hintLeft) hintLeft.style.opacity = "0";
      if (hintRight) hintRight.style.opacity = "0";
    }
  };

  const scheduleWrite = () => {
    if (rafId.current !== null) return; // allerede planlagt — drop dette frame
    rafId.current = requestAnimationFrame(writeFrame);
  };

  /* ── Cleanup ved unmount ── */
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  /* ── Touch handlers — passive for max scroll performance ── */
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || navigating.current) return;

    /* BAIL ud hvis touchen starter i et element der ikke vil have page-swipe
       (fx BranchCarousel) — så browser/komponenten håndterer sin egen scroll. */
    const target = e.target as HTMLElement;
    if (target.closest?.("[data-no-page-swipe]")) return;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = false;
    dragging.current = false;
    dragX.current = 0;

    /* Slå transitions fra under aktiv drag — kun direct transform */
    const card = cardRef.current;
    if (card) card.style.transition = "none";
    if (peekLeftRef.current) peekLeftRef.current.style.transition = "none";
    if (peekRightRef.current) peekRightRef.current.style.transition = "none";
    if (hintLeftRef.current) hintLeftRef.current.style.transition = "none";
    if (hintRightRef.current) hintRightRef.current.style.transition = "none";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enabled || navigating.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!isHorizontal.current) {
      if (Math.abs(dy) > Math.abs(dx) + VERTICAL_LEAD_PX) return;
      if (Math.abs(dx) < HORIZONTAL_LOCK_PX) return;
      isHorizontal.current = true;
      dragging.current = true;
    }

    /* Edge resistance */
    if ((dx > 0 && !prevPage) || (dx < 0 && !nextPage)) {
      dragX.current = dx * EDGE_RESISTANCE;
    } else {
      dragX.current = dx;
    }
    scheduleWrite();
  };

  const onTouchEnd = () => {
    if (!enabled || navigating.current) return;
    if (!dragging.current) return;

    const winW = window.innerWidth;
    const threshold = winW * COMMIT_THRESHOLD_PCT;
    const dx = dragX.current;

    /* Slå transition til for snap/commit */
    const ease = `${NAV_DURATION_MS}ms ${IOS_EASE}`;
    const card = cardRef.current;
    if (card) card.style.transition = `transform ${ease}, border-radius ${ease}`;
    if (peekLeftRef.current) peekLeftRef.current.style.transition = `opacity ${ease}`;
    if (peekRightRef.current) peekRightRef.current.style.transition = `opacity ${ease}`;
    if (hintLeftRef.current) hintLeftRef.current.style.transition = `opacity ${ease}`;
    if (hintRightRef.current) hintRightRef.current.style.transition = `opacity ${ease}`;

    if (dx > threshold && prevPage) {
      navigating.current = true;
      dragX.current = winW;
      scheduleWrite();
      setTimeout(() => {
        router.push(prevPage);
        navigating.current = false;
        /* Reset transform efter router.push — uden transition */
        if (card) card.style.transition = "none";
        dragX.current = 0;
        scheduleWrite();
      }, NAV_DURATION_MS);
    } else if (dx < -threshold && nextPage) {
      navigating.current = true;
      dragX.current = -winW;
      scheduleWrite();
      setTimeout(() => {
        router.push(nextPage);
        navigating.current = false;
        if (card) card.style.transition = "none";
        dragX.current = 0;
        scheduleWrite();
      }, NAV_DURATION_MS);
    } else {
      /* Snap tilbage */
      dragX.current = 0;
      scheduleWrite();
    }

    dragging.current = false;
    isHorizontal.current = false;
  };

  if (!enabled) return <>{children}</>;

  /* ── Statiske peek-farveplader (ERSTATTER iframes) ──
     Ingen iframe = ingen render-cost. Brugeren ser en farvet
     "tease" af næste side med titel — det er nok feedback. */
  const peekBaseStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1,
    opacity: 0,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    willChange: "opacity",
  };

  const hintBaseStyle: React.CSSProperties = {
    position: "fixed",
    top: 16,
    zIndex: 5,
    background: "var(--color-yellow)",
    color: "#0C0C0A",
    padding: "5px 10px",
    borderRadius: 4,
    fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: ".22em",
    textTransform: "uppercase",
    opacity: 0,
    pointerEvents: "none",
    willChange: "opacity",
  };

  return (
    <>
      {/* ── Forrige side peek ── */}
      {prevPage && (
        <div
          ref={peekLeftRef}
          aria-hidden="true"
          style={{
            ...peekBaseStyle,
            background: "linear-gradient(135deg, #1E1E1C 0%, #0C0C0A 100%)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 36,
              color: "#F5C400",
              textTransform: "uppercase",
              letterSpacing: ".02em",
            }}
          >
            ← {labels[prevPage]}
          </div>
          <div
            style={{
              color: "#888880",
              fontSize: 12,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            {lang === "da" ? "Slip for at gå" : "Release to go"}
          </div>
        </div>
      )}

      {/* ── Næste side peek ── */}
      {nextPage && (
        <div
          ref={peekRightRef}
          aria-hidden="true"
          style={{
            ...peekBaseStyle,
            background: "linear-gradient(225deg, #1E1E1C 0%, #0C0C0A 100%)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 36,
              color: "#F5C400",
              textTransform: "uppercase",
              letterSpacing: ".02em",
            }}
          >
            {labels[nextPage]} →
          </div>
          <div
            style={{
              color: "#888880",
              fontSize: 12,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            {lang === "da" ? "Slip for at gå" : "Release to go"}
          </div>
        </div>
      )}

      {/* ── Direction hints ── */}
      {prevPage && (
        <div ref={hintLeftRef} style={{ ...hintBaseStyle, left: 16 }}>
          ← {labels[prevPage]}
        </div>
      )}
      {nextPage && (
        <div ref={hintRightRef} style={{ ...hintBaseStyle, right: 16 }}>
          {labels[nextPage]} →
        </div>
      )}

      {/* ── Selve "kortet" — alt indhold ── */}
      <div
        ref={cardRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "relative",
          zIndex: 10,
          background: "var(--color-black)",
          minHeight: "100vh",
          transformOrigin: "center center",
          touchAction: "pan-y",
          willChange: "transform, border-radius",
          /* Statisk shadow — kun aktiv når i drag-tilstand sættes via JS */
          boxShadow: "0 0 0 rgba(0,0,0,0)",
        }}
      >
        {children}
      </div>
    </>
  );
}
