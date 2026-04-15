"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login fejlede");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Kunne ikke forbinde til serveren");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";

  return (
    <main className="bg-black2 min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity text-cream" title="Tilbage til forsiden">
            <svg width="64" height="64" viewBox="0 0 90 90">
              <line x1="10" y1="10" x2="80" y2="80" stroke="#F5C400" strokeWidth="18" strokeLinecap="square" />
              <line x1="80" y1="10" x2="10" y2="80" stroke="currentColor" strokeWidth="18" strokeLinecap="square" />
            </svg>
          </Link>
          <h1 className="font-condensed font-black text-[28px] uppercase tracking-[.02em] text-cream mt-4">
            Kryds admin
          </h1>
          <p className="text-[13px] text-muted mt-1">Log ind for at styre medarbejdere og vagter</p>
          <Link href="/" className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted hover:text-yellow mt-3">← Tilbage til forsiden</Link>
        </div>
        <div className="bg-gray p-8 border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                Brugernavn
              </label>
              <input
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                Kodeord
              </label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow text-black font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase py-[14px] rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-60"
            >
              {loading ? "Logger ind..." : "Log ind"}
            </button>
            {error && <p className="text-red-400 text-[13px] mt-4 text-center">{error}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}
