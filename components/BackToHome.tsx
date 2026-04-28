"use client";

import { usePathname, useRouter } from "next/navigation";

/** Flydende cirkel-tilbage-knap — vises på alle sider undtagen forsiden og admin/medarbejder */
export default function BackToHome() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/medarbejder")
  ) {
    return null;
  }

  return (
    <button
      onClick={() => router.push("/")}
      aria-label="Tilbage til forsiden"
      className="fixed bottom-8 left-8 z-[400] w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-[0_0_0_2px_#F5C400] max-[900px]:bottom-6 max-[900px]:left-4"
      style={{ background: "#111", border: "1px solid rgba(242,238,230,0.15)" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F5C400"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </button>
  );
}
