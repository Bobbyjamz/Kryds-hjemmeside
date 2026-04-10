"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MedarbejderLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!phone.trim()) {
      setError("Telefonnummer mangler");
      return;
    }
    if (!day || !month || !year) {
      setError("Udfyld hele fødselsdatoen");
      return;
    }
    const dayN = parseInt(day, 10);
    const monthN = parseInt(month, 10);
    const yearN = parseInt(year, 10);
    if (dayN < 1 || dayN > 31 || monthN < 1 || monthN > 12 || yearN < 1920 || yearN > 2020) {
      setError("Ugyldig fødselsdato");
      return;
    }

    const birthDate = `${yearN}-${String(monthN).padStart(2, "0")}-${String(dayN).padStart(2, "0")}`;

    setLoading(true);
    try {
      const res = await fetch("/api/medarbejder/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), birthDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login fejlede");
        setLoading(false);
        return;
      }
      router.push(data.redirect || "/medarbejder");
      router.refresh();
    } catch {
      setError("Kunne ikke forbinde til serveren");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.15)] text-cream font-sans text-[18px] font-medium px-[18px] py-4 rounded-[2px] outline-none transition-colors focus:border-yellow placeholder:text-[rgba(242,238,230,.25)]";

  const dateInputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.15)] text-cream font-sans text-[18px] font-medium text-center px-2 py-4 rounded-[2px] outline-none transition-colors focus:border-yellow placeholder:text-[rgba(242,238,230,.25)]";

  return (
    <main className="bg-black min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity" title="Tilbage til forsiden">
            <svg width="72" height="72" viewBox="0 0 90 90">
              <rect width="90" height="90" rx="14" fill="#0C0C0A" />
              <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="16" strokeLinecap="square" />
              <line x1="76" y1="14" x2="14" y2="76" stroke="#F2EEE6" strokeWidth="16" strokeLinecap="square" />
            </svg>
          </Link>
          <h1 className="font-condensed font-black text-[32px] uppercase tracking-[.02em] text-cream mt-4 text-center">
            Log ind
          </h1>
          <p className="text-[14px] text-muted mt-1 text-center">Telefon + fødselsdato</p>
        </div>
        <div className="bg-gray p-8 border border-[rgba(242,238,230,0.08)] rounded-[2px]">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label className="block font-condensed font-semibold text-[11px] tracking-[.2em] uppercase text-muted mb-2">
                Telefon
              </label>
              <input
                type="tel"
                inputMode="tel"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="42 77 98 66"
                autoComplete="tel"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block font-condensed font-semibold text-[11px] tracking-[.2em] uppercase text-muted mb-2">
                Fødselsdato
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    className={dateInputClass}
                    value={day}
                    onChange={(e) => setDay(e.target.value.replace(/\D/g, ""))}
                    placeholder="DD"
                  />
                  <p className="text-[10px] tracking-[.15em] uppercase text-muted text-center mt-1">Dag</p>
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    className={dateInputClass}
                    value={month}
                    onChange={(e) => setMonth(e.target.value.replace(/\D/g, ""))}
                    placeholder="MM"
                  />
                  <p className="text-[10px] tracking-[.15em] uppercase text-muted text-center mt-1">Måned</p>
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    className={dateInputClass}
                    value={year}
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                    placeholder="ÅÅÅÅ"
                  />
                  <p className="text-[10px] tracking-[.15em] uppercase text-muted text-center mt-1">År</p>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow text-black font-condensed font-extrabold text-[16px] tracking-[.12em] uppercase py-[18px] rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-60"
            >
              {loading ? "Logger ind..." : "Log ind →"}
            </button>
            {error && (
              <div className="mt-4 p-3 border border-red-400/30 bg-red-400/5 rounded-[2px]">
                <p className="text-red-400 text-[13px] text-center">{error}</p>
              </div>
            )}
          </form>
          <p className="text-[13px] text-muted text-center mt-6 pt-5 border-t border-[rgba(242,238,230,0.07)]">
            Ikke oprettet? <Link href="/tilmeld" className="text-yellow hover:underline font-semibold">Tilmeld dig her</Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-[12px] font-condensed uppercase tracking-[.15em] text-muted hover:text-yellow">
            ← Tilbage til forsiden
          </Link>
        </div>
      </div>
    </main>
  );
}
