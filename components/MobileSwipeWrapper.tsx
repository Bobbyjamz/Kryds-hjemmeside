"use client";

import { useRef, useState, useEffect } from "react";
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
  /* Lazy-load iframes only after page has settled so we don't slow first paint */
  const [previewReady, setPreviewReady] = useState(false);

  const currentIdx = PAGE_ORDER.indexOf(pathname ?? "/");
  const prevPage = currentIdx > 0 ? PAGE_ORDER[currentIdx - 1] : null;
  const nextPage = currentIdx >= 0 && currentIdx < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIdx + 1] : null;
  const enabled = currentIdx !== -1;

  /* Preload destination iframes ~1.2s after navigation so swipe shows real page */
  useEffect(() => {
    if (!enabled) return;
    setPreviewReady(false);
    const t = setTimeout(() => setPreviewReady(true), 1200);
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
      if (Math.abs(dy) > Math.abs(dx) + 4) return;
      if (Math.abs(dx) < 12) return;
      isHorizontal.current = true;
    }
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
      setAnimating(true);
      setDragX(0);
      setTimeout(() => setAnimating(false), 200);
    }
    isHorizontal.current = false;
  };

  const dragging = Math.abs(dragX) > 0;
  const direction = dragX > 0 ? "prev" : dragX < 0 ? "next" : null;

  const winW = typeof window !== "undefined" ? window.innerWidth : 400;
  const progress = Math.min(Math.abs(dragX) / winW, 1);

  /* Opacity for each preview iframe — only fade in the one matching swipe direction */
  const prevVisible = dragging && direction === "prev";
  const nextVisible = dragging && direction === "next";

  return (
    <>
      {/* ── Previous page preview (real iframe) ── */}
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
            opacity: prevVisible ? 0.5 + progress * 0.5 : 0,
            transition: animating || !dragging ? "opacity 0.22s ease-out" : "opacity 0.05s linear",
          }}
        />
      )}

      {/* ── Next page preview (real iframe) ── */}
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
            opacity: nextVisible ? 0.5 + progress * 0.5 : 0,
            transition: animating || !dragging ? "opacity 0.22s ease-out" : "opacity 0.05s linear",
          }}
        />
      )}

      {/* ── Direction hint label (small overlay on top of iframe) ── */}
      {dragging && (direction === "prev" || direction === "next") && (
        <div
          className="fixed top-4 pointer-events-none"
          style={{
            zIndex: 2,
            left: direction === "prev" ? 16 : "auto",
            right: direction === "next" ? 16 : "auto",
            opacity: progress,
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

      {/* ── Sliding content on top — Tinder card ── */}
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
          boxShadow: dragging ? "0 0 40px rgba(0,0,0,.5)" : undefined,
        }}
      >
        {children}
      </div>
    </>
  );
}
