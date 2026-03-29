"use client";

import { useEffect, useRef } from "react";

export function useServiceStagger() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>(".service-card");
    if (!cards) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Array.from(cards).indexOf(e.target as HTMLElement);
            setTimeout(() => e.target.classList.add("in"), i * 110);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06 }
    );

    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return gridRef;
}
