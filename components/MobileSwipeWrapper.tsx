"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

/* ============================================================
   Tinder-style page swipe — PERFORMANCE-OPTIMERET v6
   ------------------------------------------------------------
   Ændringer ift. v5:
   1. Iframe peek genindsat — brugeren ser den rigtige næste
      side mens de swiper (statiske farveplader var for lidt).
   2. KRITISK BUG RETTET: `blocked` ref. Tidligere bailed
      onTouchStart ud ved [data-no-page-swipe], men onTouchMove
      kørte stadig fordi startX/isHorizontal ikke var reset.
      Nu sætter vi blocked.current = true og checke det i alle
      efterfølgende handlers — carouselen er 100% isoleret.
   3. Alle rAF / direct-DOM optimeringer fra v5 bevaret:
      - INGEN React state under drag
      - INGEN filter:blur
      - INGEN animeret box-shadow
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
  const peekLeftRef = useRef<HTMLIFrameElement>(null);
  const peekRightRef = useRef<HTMLIFrameElement>(null);
  const hintLeftRef = useRef<HTMLDivElement>(null);
  const hintRightRef = useRef<HTMLDivElement>(null);

  /* ── Mutable drag state — INGEN React-rerenders ── */
  const startX = useRef(0);
  const startY = useRef(0);
  const dragX = useRef(0);
  const isHorizontal = useRef(false);
  const dragging = useRef(false);
  const navigating = useRef(false);
  const blocked = useRef(false); // ← touch startede i [data-no-page-swipe]
  const rafId = useRef<number | null>(null);

  const currentIdx = PAGE_ORDER.indexOf(pathname ?? "/");
  const prevPage = currentIdx > 0 ? PAGE_ORDER[currentIdx - 1] : null;
  const nextPage = currentIdx >= 0 && currentIdx < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIdx + 1] : null;
  const enabled = currentIdx !== -1;

  /* ── Forhindrer uendelig iframe-rekursion ──
     Når denne side er indlæst INDE I en iframe (som peek-baggrund),
     må vi ikke rendere nye peek-iframes — ellers looper det uendeligt.
     showPeek sættes til false på SSR og false i iframes, true i normal browsing. */
  const [showPeek, setShowPeek] = useState(false);
  useEffect(() => {
    try {
      setShowPeek(window.self === window.top);
    } catch {
      setShowPeek(false); // cross-origin iframe — vær på den sikre side
    }
  }, []);

  /* ── Prefetch nabosider ──
     Uden prefetch venter router.push på at siden bygges efter swipe-animationen
     er færdig — det er det synlige "hak" mellem faner. Når naboerne er forhånds-
     hentet, er navigationen øjeblikkelig og iframe-peeken afløses sømløst af den
     rigtige side. Peek-behind-effekten er uændret. */
  useEffect(() => {
    if (prevPage) router.prefetch(prevPage);
    if (nextPage) router.prefetch(nextPage);
  }, [prevPage, nextPage, router]);

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
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(writeFrame);
  };

  /* ── Cleanup ved unmount ── */
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  /* ── Touch handlers ── */
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || navigating.current) return;

    /* Tjek om touch starter inde i [data-no-page-swipe] (fx BranchCarousel).
       Sæt blocked = true så onTouchMove og onTouchEnd også ignorerer denne touch. */
    const target = e.target as HTMLElement;
    if (target.closest?.("[data-no-page-swipe]")) {
      blocked.current = true;
      return;
    }
    blocked.current = false;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = false;
    dragging.current = false;
    dragX.current = 0;

    /* Slå transitions fra under aktiv drag */
    const card = cardRef.current;
    if (card) card.style.transition = "none";
    if (peekLeftRef.current) peekLeftRef.current.style.transition = "none";
    if (peekRightRef.current) peekRightRef.current.style.transition = "none";
    if (hintLeftRef.current) hintLeftRef.current.style.transition = "none";
    if (hintRightRef.current) hintRightRef.current.style.transition = "none";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enabled || navigating.current || blocked.current) return; // blocked = carousel-touch
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

    /* Ryd blocked flag og stop — denne touch tilhørte carouselen */
    if (blocked.current) {
      blocked.current = false;
      return;
    }

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

  /* ── Iframe-stile ──
     pointerEvents: none → iframes modtager ingen touch-events.
     opacity: 0 som standard, animeres til ~1 via writeFrame under drag. */
  const iframeBaseStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    border: "none",
    zIndex: 1,
    opacity: 0,
    pointerEvents: "none",
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
    textTransform: "uppercase" as const,
    opacity: 0,
    pointerEvents: "none",
    willChange: "opacity",
  };

  return (
    <>
      {/* ── Forrige side peek (iframe) ──
           showPeek er false når DENNE side kører inde i en iframe,
           så vi undgår uendelig rekursiv iframe-indlejring. */}
      {prevPage && showPeek && (
        <iframe
          ref={peekLeftRef}
          src={prevPage}
          aria-hidden="true"
          tabIndex={-1}
          style={iframeBaseStyle}
          title="previous page preview"
        />
      )}

      {/* ── Næste side peek (iframe) ── */}
      {nextPage && showPeek && (
        <iframe
          ref={peekRightRef}
          src={nextPage}
          aria-hidden="true"
          tabIndex={-1}
          style={iframeBaseStyle}
          title="next page preview"
        />
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
          boxShadow: "0 0 0 rgba(0,0,0,0)",
        }}
      >
        {children}
      </div>
    </>
  );
}
