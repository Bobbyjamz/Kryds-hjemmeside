"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function BekraeftContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const token = params.get("token");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setTimeout(() => router.push("/medarbejder/login"), 3000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token, router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex justify-center mb-10 hover:opacity-80 transition-opacity text-cream">
          <svg width="56" height="56" viewBox="0 0 90 90">
            <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
            <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
          </svg>
        </Link>

        {status === "loading" && (
          <div>
            <div className="w-10 h-10 border-2 border-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted font-condensed uppercase tracking-[.12em] text-[13px]">Bekræfter din email...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-yellow text-[56px] mb-4 font-black">✓</div>
            <h1 className="font-condensed font-black text-[28px] uppercase tracking-[.02em] text-cream mb-3">
              Email bekræftet!
            </h1>
            <p className="text-muted text-[15px] leading-[1.6]">
              Din konto er nu aktiv. Du sendes videre til login om et øjeblik...
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-red-400 text-[56px] mb-4 font-black">✕</div>
            <h1 className="font-condensed font-black text-[28px] uppercase tracking-[.02em] text-cream mb-3">
              Ugyldigt link
            </h1>
            <p className="text-muted text-[15px] leading-[1.6] mb-6">
              Linket er udløbet eller allerede brugt.
            </p>
            <Link
              href="/tilmeld"
              className="inline-block font-condensed font-extrabold text-[13px] tracking-[.08em] uppercase bg-yellow text-black px-8 py-3 no-underline hover:bg-yellow2 transition-colors"
            >
              Registrer igen
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function BekraeftPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-yellow border-t-transparent rounded-full animate-spin" /></main>}>
      <BekraeftContent />
    </Suspense>
  );
}
