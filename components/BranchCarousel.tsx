"use client";

import { useRef, useEffect } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";

const BRANCHES = [
  {
    num: "01",
    nameKey: "branch_1_name",
    subKey: "branch_1_sub",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80",
  },
  {
    num: "02",
    nameKey: "branch_2_name",
    subKey: "branch_2_sub",
    img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80",
  },
  {
    num: "03",
    nameKey: "branch_3_name",
    subKey: "branch_3_sub",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  },
  {
    num: "04",
    nameKey: "branch_4_name",
    subKey: "branch_4_sub",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80",
  },
  {
    num: "05",
    nameKey: "branch_5_name",
    subKey: "branch_5_sub",
    img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
  },
  {
    num: "06",
    nameKey: "branch_6_name",
    subKey: "branch_6_sub",
    img: "https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=900&q=80",
  },
  {
    num: "07",
    nameKey: "branch_7_name",
    subKey: "branch_7_sub",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
  },
];

// Double for seamless loop
const TILES = [...BRANCHES, ...BRANCHES];

export default function BranchCarousel() {
  const { t } = useLanguage();
  const revealRef = useReveal();
  const viewRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Start at 0 — will loop when reaching half of total scrollWidth
    function tick() {
      if (view && !pausedRef.current) {
        const half = view.scrollWidth / 2;
        // Guard: if layout hasn't settled yet, just wait
        if (half > 0) {
          view.scrollLeft += 0.45; // ~27px/s at 60fps — slow, peaceful scroll

          // Seamless loop: when we pass half the content, jump back
          if (view.scrollLeft >= half) {
            view.scrollLeft -= half;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    // Wait one frame so the DOM has laid out before we start scrolling
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <section
      className="bg-gray py-[100px] overflow-hidden"
      ref={revealRef}
    >
      {/* Header */}
      <div className="px-[52px] mb-[56px]">
        <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
          {t("branches_eyebrow")}
        </div>
        <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
          {t("branches_h2")} <span className="text-yellow">{t("branches_h2_yellow")}</span>
        </h2>
        <p className="reveal mt-4 text-[15px] leading-[1.7] text-muted max-w-[560px]">
          {t("branches_subtitle")}
        </p>
      </div>

      {/* Scrollable viewport with fade edges */}
      <div className="relative">
        {/* Left fade */}
        <div
          className="absolute top-0 bottom-0 left-0 w-[120px] z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--color-gray) 10%, transparent)" }}
        />
        {/* Right fade */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[120px] z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--color-gray) 10%, transparent)" }}
        />

        {/* The scrollable track */}
        <div
          ref={viewRef}
          className="branch-carousel-viewport flex gap-[18px] overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingLeft: "52px",
            paddingRight: "52px",
            cursor: "grab",
          }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onMouseDown={(e) => {
            const el = viewRef.current;
            if (!el) return;
            pausedRef.current = true;
            const startX = e.pageX - el.offsetLeft;
            const scrollStart = el.scrollLeft;

            function onMove(ev: MouseEvent) {
              const x = ev.pageX - el!.offsetLeft;
              el!.scrollLeft = scrollStart - (x - startX);
            }
            function onUp() {
              pausedRef.current = false;
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            }
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        >
          {TILES.map((branch, i) => (
            <div
              key={i}
              className="branch-tile flex-shrink-0 relative overflow-hidden rounded-[3px]"
              style={{
                width: 360,
                height: 240,
                background: "var(--color-black2)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Background image */}
              <div
                className="branch-tile-img absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${branch.img}')`,
                  filter: "grayscale(30%) brightness(0.58) saturate(0.9)",
                  transform: "scale(1.0)",
                  transition: "filter 0.5s, transform 0.6s ease",
                }}
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 z-[1]"
                style={{
                  background:
                    "linear-gradient(to top, rgba(12,12,10,.88) 0%, rgba(12,12,10,.25) 60%, transparent 100%)",
                }}
              />
              {/* Number */}
              <span className="absolute top-[18px] left-[20px] z-[2] font-condensed font-bold text-[11px] tracking-[.18em] text-[rgba(242,238,230,.55)]">
                — {branch.num}
              </span>
              {/* Content */}
              <div className="absolute left-0 right-0 bottom-0 z-[2] flex items-flex-end justify-between gap-3 p-6">
                <div>
                  <h4 className="font-condensed font-extrabold text-[24px] tracking-[.04em] uppercase text-cream leading-[1.05]">
                    {t(branch.nameKey)}
                  </h4>
                  <small className="block font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow uppercase mt-[6px]">
                    {t(branch.subKey)}
                  </small>
                </div>
                <div
                  className="branch-tile-arrow w-[40px] h-[40px] flex-shrink-0 rounded-full flex items-center justify-center border border-[rgba(245,196,0,.35)] transition-all duration-300"
                  style={{ background: "transparent" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F5C400"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
