"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/* Tinder-style horizontal page navigation.
   Swipe right = previous page, swipe left = next page.
   Order: / → /ydelser → /priser → /om-os */
const PAGE_ORDER = ["/", "/ydelser", "/priser", "/om-os"];

export default function MobileSwipeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontal = useRef(false);
  const navigating = useRef(false);
  const dragX = useRef(0);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const currentIdx = PAGE_ORDER.indexOf(pathname ?? "/");
  const prevPage = currentIdx > 0 ? PAGE_ORDER[currentIdx - 1] : null;
  const nextPage = currentIdx >= 0 && currentIdx < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIdx + 1] : null;

  // If we are not on a known page in the order, disable swipe entirely.
  const enabled = currentIdx !== -1;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || navigating.current) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = false;
    dragX.current = 0;
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

    // Only allow drag toward an existing target page
    if ((dx > 0 && !prevPage) || (dx < 0 && !nextPage)) {
      const damp = dx * 0.15;
      setStyle({
        transform: `translateX(${damp}px)`,
        transition: "none",
      });
      dragX.current = 0;
      return;
    }

    const dampened = dx * 0.6;
    dragX.current = dampened;
    const progress = Math.min(Math.abs(dampened) / 180, 1);
    setStyle({
      transform: `translateX(${dampened}px)`,
      opacity: 1 - progress * 0.2,
      transition: "none",
    });
  };

  const onTouchEnd = () => {
    if (!enabled || navigating.current) return;
    const dx = dragX.current;
    const threshold = 70;

    if (dx > threshold && prevPage) {
      navigating.current = true;
      setStyle({
        transform: "translateX(110%)",
        opacity: 0,
        transition: "transform 0.25s ease-in, opacity 0.2s ease-in",
      });
      setTimeout(() => {
        router.push(prevPage);
        // Reset for the next mount (in case re-used)
        setTimeout(() => {
          setStyle({});
          navigating.current = false;
        }, 50);
      }, 250);
    } else if (dx < -threshold && nextPage) {
      navigating.current = true;
      setStyle({
        transform: "translateX(-110%)",
        opacity: 0,
        transition: "transform 0.25s ease-in, opacity 0.2s ease-in",
      });
      setTimeout(() => {
        router.push(nextPage);
        setTimeout(() => {
          setStyle({});
          navigating.current = false;
        }, 50);
      }, 250);
    } else {
      // Snap back
      setStyle({
        transform: "translateX(0)",
        opacity: 1,
        transition: "transform 0.22s ease-out, opacity 0.22s ease-out",
      });
    }

    dragX.current = 0;
    isHorizontal.current = false;
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ ...style, willChange: "transform, opacity" }}
    >
      {children}
    </div>
  );
}
