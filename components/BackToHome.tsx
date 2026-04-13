"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BackToHome() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      title="Tilbage til forsiden"
      className="fixed left-0 top-1/2 -translate-y-1/2 z-[400] group"
      aria-label="Tilbage til forsiden"
    >
      <div className="flex flex-col items-center gap-[6px] bg-[rgba(12,12,10,.88)] backdrop-blur-sm border border-l-0 border-[rgba(242,238,230,.1)] rounded-r-[3px] px-[10px] py-4 transition-all duration-300 group-hover:border-[rgba(245,196,0,.35)] group-hover:bg-[rgba(12,12,10,.98)] group-hover:px-[13px]">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888880"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:stroke-[#F5C400] transition-colors flex-shrink-0"
        >
          <path d="M19 12H5" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span
          className="font-condensed font-semibold text-[9px] tracking-[.22em] uppercase text-muted group-hover:text-yellow transition-colors whitespace-nowrap"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Forsiden
        </span>
      </div>
    </Link>
  );
}
