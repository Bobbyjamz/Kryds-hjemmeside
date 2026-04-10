"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MedarbejderLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/medarbejder/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, birthDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login fejlede");
      setLoading(false);
      return;
    }
    router.push("/medarbejder");
    router.refresh();
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";

  return (
    <main className="bg-black min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <svg width="64" height="64" viewBox="0 0 90 90">
            <rect width="90" height="90" rx="14" fill="#0C0C0A" />
            <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="16" strokeLinecap="square" />
            <line x1="76" y1="14" x2="14" y2="76" stroke="#F2EEE6" strokeWidth="16" strokeLinecap="square" />
          </svg>
          <h1 className="font-condensed font-black text-[28px] uppercase tracking-[.02em] text-cream mt-4">
            Medarbejder login
          </h1>
          <p className="text-[13px] text-muted mt-1">Log ind for at se åbne vagter</p>
        </div>
        <div className="bg-gray p-8 border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                Telefon
              </label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+45 00 00 00 00"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                Fødselsdato
              </label>
              <input
                type="date"
                className={inputClass}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
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
          <p className="text-[12px] text-muted text-center mt-6">
            Ikke oprettet endnu? <Link href="/tilmeld" className="text-yellow hover:underline">Tilmeld dig her</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
