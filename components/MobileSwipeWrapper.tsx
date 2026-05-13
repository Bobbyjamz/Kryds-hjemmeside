"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

/* Tinder-style horizontal page navigation — polished v2.
   - Pure horizontal slide (NO rotation)
   - GPU-accelerated translate3d
   - iOS-style cubic-bezier easing
   - Smooth iframe fade so background looks like a real underlying page
   Order: / → /ydelser → /priser → /om-os */
const PAGE_ORDER = ["/", "/ydelser", "/priser", "/om-os"];

const LABELS_DA: Record<string, string> = {
  "/": "Forside",
  "/ydelser": "Ydelser",
  "/priser": "Priser",
  "/om-os": "Om os",
};

const LABELS_EN: Record<string, string> = {
  "/": "Home",
  "/ydelser": "Services",
  "/priser": "Pricing",
  "/om-os": "About",
};

/* iOS-like easing — natural inertia feel */
const IOS_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/* Tuning */
const HORIZONTAL_LOCK_PX = 8;        // px før vi committer til horisontal swipe
const VERTICAL_LEAD_PX   = 4;        // dy skal være > dx + dette før vi giver scroll prioritet
const COMMIT_THRESHOLD_PCT = 0.22;   // 22% af skærmbredde for at navigere
const EDGE_RESISTANCE     = 0.22;    // dampning når der ikke er prev/next
const NAV_DURATION_MS     = 280;     // slide / snap animation

export default function MobileSwipeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useLanguage();
  const labels = lang === "da" ? LABELS_DA : LABELS_EN;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontal = useRef(false);
  const navigating = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  /* Lazy-load iframes only after page has settled so we don't slow first paint */
  const [previewReady, setPreviewReady] = useState(false);

  const currentIdx = PAGE_ORDER.indexOf(pathname ?? "/");
  const prevPage = currentIdx > 0 ? PAGE_ORDER[currentIdx - 1] : null;
  const nextPage = currentIdx >= 0 && currentIdx < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIdx + 1] : null;
  const enabled = currentIdx !== -1;

  /* Preload destination iframes ~1s after navigation so swipe shows real page */
  useEffect(() => {
    if (!enabled) return;
    setPreviewReady(false);
    const t = setTimeout(() => setPreviewReady(true), 1000);
    return () => clearTimeout(t);
  }, [pathname, enabled]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || navigating.current) return;
    /* If user touches before our timer, trigger preload immediately */
    if (!previewReady) setPreviewReady(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = false;
    setAnimating(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enabled || navigating.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isHorizontal.current) {
      /* Vertical scroll has priority */
      if (Math.abs(dy) > Math.abs(dx) + VERTICAL_LEAD_PX) return;
      /* Need a clear horizontal intent */
      if (Math.abs(dx) < HORIZONTAL_LOCK_PX) return;
      isHorizontal.current = true;
    }
    /* Edge resistance when no page to navigate to */
    if ((dx > 0 && !prevPage) || (dx < 0 && !nextPage)) {
      setDragX(dx * EDGE_RESISTANCE);
      return;
    }
    setDragX(dx);
  };

  const onTouchEnd = () => {
    if (!enabled || navigating.current) return;
    const winW = window.innerWidth;
    const threshold = winW * COMMIT_THRESHOLD_PCT;

    if (dragX > threshold && prevPage) {
      navigating.current = true;
      setAnimating(true);
      setDragX(winW);
      setTimeout(() => {
        router.push(prevPage);
        navigating.current = false;
        setDragX(0);
        setAnimating(false);
      }, NAV_DURATION_MS);
    } else if (dragX < -threshold && nextPage) {
      navigating.current = true;
      setAnimating(true);
      setDragX(-winW);
      setTimeout(() => {
        router.push(nextPage);
        navigating.current = false;
        setDragX(0);
        setAnimating(false);
      }, NAV_DURATION_MS);
    } else {
      /* Snap back — samme duration som transition for at undgå hiccup */
      setAnimating(true);
      setDragX(0);
      setTimeout(() => setAnimating(false), NAV_DURATION_MS);
    }
    isHorizontal.current = false;
  };

  const dragging = Math.abs(dragX) > 0;
  const direction = dragX > 0 ? "prev" : dragX < 0 ? "next" : null;

  const winW = typeof window !== "undefined" ? window.innerWidth : 400;
  const progress = Math.min(Math.abs(dragX) / winW, 1);

  /* Iframe opacity: fade in proportional to drag so background page reveals naturally */
  const prevOpacity = direction === "prev" ? 0.4 + progress * 0.6 : 0;
  const nextOpacity = direction === "next" ? 0.4 + progress * 0.6 : 0;

  /* Subtle parallax on the background page — feels more natural than static */
  const prevParallax = direction === "prev" ? -winW * 0.08 * (1 - progress) : 0;
  const nextParallax = direction === "next" ?  winW * 0.08 * (1 - progress) : 0;

  return (
    <>
      {/* ── Previous page preview (real iframe, no rotation, subtle parallax) ── */}
      {previewReady && prevPage && (
        <iframe
          src={prevPage}
          title={`${labels[prevPage]} preview`}
          tabIndex={-1}
          aria-hidden="true"
          className="fixed inset-0 w-full h-full pointer-events-none"
          style={{
            zIndex: 1,
            border: "none",
            opacity: prevOpacity,
            transform: `translate3d(${prevParallax}px, 0, 0)`,
            transition: animating
              ? `opacity 0.28s ${IOS_EASE}, transform 0.28s ${IOS_EASE}`
              : "none",
            willChange: dragging || animating ? "opacity, transform" : "auto",
          }}
        />
      )}

      {/* ── Next page preview (real iframe, no rotation, subtle parallax) ── */}
      {previewReady && nextPage && (
        <iframe
          src={nextPage}
          title={`${labels[nextPage]} preview`}
          tabIndex={-1}
          aria-hidden="true"
          className="fixed inset-0 w-full h-full pointer-events-none"
          style={{
            zIndex: 1,
            border: "none",
            opacity: nextOpacity,
            transform: `translate3d(${nextParallax}px, 0, 0)`,
            transition: animating
              ? `opacity 0.28s ${IOS_EASE}, transform 0.28s ${IOS_EASE}`
              : "none",
            willChange: dragging || animating ? "opacity, transform" : "auto",
          }}
        />
      )}

      {/* ── Direction hint label (subtle, slides with content) ── */}
      {dragging && (direction === "prev" || direction === "next") && (
        <div
          className="fixed top-4 pointer-events-none"
          style={{
            zIndex: 2,
            left: direction === "prev" ? 16 : "auto",
            right: direction === "next" ? 16 : "auto",
            opacity: progress,
            transform: `translate3d(0, ${(1 - progress) * -4}px, 0)`,
          }}
        >
          <div
            className="font-condensed font-bold text-[11px] tracking-[.22em] uppercase"
            style={{
              background: "var(--color-yellow)",
              color: "#0C0C0A",
              padding: "5px 10px",
              borderRadius: 4,
            }}
          >
            {direction === "prev"
              ? `← ${prevPage ? labels[prevPage] : ""}`
              : `${nextPage ? labels[nextPage] : ""} →`}
          </div>
        </div>
      )}

      {/* ── Sliding content (Tinder card) — pure horizontal translate3d, NO rotation ──
          NOTE: only apply transform while dragging/animating so we don't create
          a stacking context that breaks position:fixed children. */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: dragging || animating
            ? `translate3d(${dragX}px, 0, 0)`
            : undefined,
          transition: animating
            ? `transform ${NAV_DURATION_MS}ms ${IOS_EASE}`
            : "none",
          willChange: dragging || animating ? "transform" : "auto",
          touchAction: "pan-y",          // lade browseren håndtere vertikal scroll
          position: "relative",
          zIndex: 10,
          background: "var(--color-black)",
          minHeight: "100vh",
          /* Pre-allocér box-shadow så vi ikke skifter property under drag */
          boxShadow: dragging || animating
            ? `0 0 40px rgba(0,0,0,${0.35 * progress + 0.15})`
            : "0 0 0 rgba(0,0,0,0)",
        }}
      >
        {children}
      </div>
    </>
  );
}
