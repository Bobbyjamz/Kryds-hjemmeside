"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

/* Tinder-style horizontal page navigation.
   Swipe right = previous page, swipe left = next page.
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

export default function MobileSwipeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useLanguage();
  const labels = lang === "da" ? LABELS_DA : LABELS_EN;
  const isDA = lang === "da";

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontal = useRef(false);
  const navigating = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);

  const currentIdx = PAGE_ORDER.indexOf(pathname ?? "/");
  const prevPage = currentIdx > 0 ? PAGE_ORDER[currentIdx - 1] : null;
  const nextPage = currentIdx >= 0 && currentIdx < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIdx + 1] : null;
  const enabled = currentIdx !== -1;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || navigating.current) return;
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
      if (Math.abs(dy) > Math.abs(dx) + 4) return;
      if (Math.abs(dx) < 12) return;
      isHorizontal.current = true;
    }

    /* Only allow drag if there is a destination */
    if ((dx > 0 && !prevPage) || (dx < 0 && !nextPage)) {
      setDragX(dx * 0.15);
      return;
    }
    setDragX(dx);
  };

  const onTouchEnd = () => {
    if (!enabled || navigating.current) return;
    const threshold = window.innerWidth * 0.25;

    if (dragX > threshold && prevPage) {
      navigating.current = true;
      setAnimating(true);
      setDragX(window.innerWidth);
      setTimeout(() => {
        router.push(prevPage);
        navigating.current = false;
        setDragX(0);
        setAnimating(false);
      }, 240);
    } else if (dragX < -threshold && nextPage) {
      navigating.current = true;
      setAnimating(true);
      setDragX(-window.innerWidth);
      setTimeout(() => {
        router.push(nextPage);
        navigating.current = false;
        setDragX(0);
        setAnimating(false);
      }, 240);
    } else {
      /* Snap back */
      setAnimating(true);
      setDragX(0);
      setTimeout(() => setAnimating(false), 200);
    }
    isHorizontal.current = false;
  };

  const dragging = Math.abs(dragX) > 0;
  const direction = dragX > 0 ? "prev" : dragX < 0 ? "next" : null;
  const destPage = direction === "prev" ? prevPage : direction === "next" ? nextPage : null;
  const destLabel = destPage ? labels[destPage] : null;

  /* Progress used for fading-in the destination underneath (SSR-safe) */
  const winW = typeof window !== "undefined" ? window.innerWidth : 400;
  const progress = Math.min(Math.abs(dragX) / winW, 1);

  return (
    <>
      {/* ── Destination preview underneath — peeking through like a Tinder card stack ── */}
      {dragging && destLabel && (
        <div
          className="fixed inset-0 pointer-events-none flex items-center justify-center"
          style={{
            background: "var(--color-black)",
            zIndex: 1,
            opacity: 0.4 + progress * 0.6,
          }}
        >
          <div className="text-center px-8" style={{ transform: `scale(${0.9 + progress * 0.1})`, transition: "transform 0.1s" }}>
            <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-3 flex items-center justify-center gap-[10px]">
              {direction === "prev" ? (
                <>
                  <span style={{ fontSize: 18 }}>←</span>
                  {isDA ? "Forrige" : "Previous"}
                </>
              ) : (
                <>
                  {isDA ? "Næste" : "Next"}
                  <span style={{ fontSize: 18 }}>→</span>
                </>
              )}
            </p>
            <h2 className="font-condensed font-black text-[44px] uppercase tracking-[-.01em] text-cream leading-none">
              {destLabel}
            </h2>
          </div>
        </div>
      )}

      {/* ── Sliding content on top ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX * 0.015}deg)`,
          transition: animating ? "transform 0.24s ease-out" : "none",
          willChange: "transform",
          position: "relative",
          zIndex: 10,
          background: "var(--color-black)",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </>
  );
}
