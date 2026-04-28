"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MedView = "login" | "forgot" | "success";

export default function MedarbejderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin panel state
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  // Forgot code state
  const [medView, setMedView] = useState<MedView>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email mangler");
      return;
    }
    if (!code.trim()) {
      setError("Adgangskode mangler");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/medarbejder/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
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

  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!adminUser.trim() || !adminPass.trim()) {
      setAdminError("Udfyld brugernavn og kodeord");
      return;
    }
    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUser.trim(), password: adminPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.error || "Forkert brugernavn eller kodeord");
        setAdminLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setAdminError("Kunne ikke forbinde til serveren");
      setAdminLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) { setForgotError("Indtast din email"); return; }
    setForgotLoading(true);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "email", value: forgotEmail.trim(), type: "employee" }),
    });
    const data = await res.json();
    setForgotLoading(false);
    if (!res.ok) { setForgotError(data.error || "Kunne ikke sende kode"); return; }
    setMedView("success");
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.15)] text-cream font-sans text-[18px] font-medium px-[18px] py-4 rounded-[2px] outline-none transition-colors focus:border-yellow placeholder:text-[rgba(242,238,230,.25)]";

  const adminInputClass =
    "w-full bg-[rgba(12,12,10,.6)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[15px] px-[14px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";

  return (
    <main className="bg-black2 min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity text-cream" title="Tilbage til forsiden">
            <svg width="72" height="72" viewBox="0 0 90 90">
              <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
              <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
            </svg>
          </Link>
          <h1 className="font-condensed font-black text-[32px] uppercase tracking-[.02em] text-cream mt-4 text-center">
            Log ind
          </h1>
          <p className="text-[14px] text-muted mt-1 text-center">Email + adgangskode</p>
        </div>

        {/* Medarbejder login card */}
        <div className="bg-gray p-8 border border-[rgba(242,238,230,0.08)] rounded-[2px]">
          {/* Forgot view */}
          {medView === "forgot" && (
            <form onSubmit={handleForgot} noValidate>
              <p className="font-condensed font-black text-[18px] uppercase tracking-[-.01em] text-cream mb-1">
                Ny adgangskode
              </p>
              <p className="text-[13px] text-muted mb-5">Vi sender en ny kode til din email.</p>
              <div className="mb-5">
                <label className="block font-condensed font-semibold text-[11px] tracking-[.2em] uppercase text-muted mb-2">
                  Din email
                </label>
                <input
                  type="email"
                  className={inputClass}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="din@email.dk"
                  required
                />
              </div>
              <button type="submit" disabled={forgotLoading} className="w-full bg-yellow text-black font-condensed font-extrabold text-[16px] tracking-[.12em] uppercase py-[18px] rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-60">
                {forgotLoading ? "Sender..." : "Send ny kode"}
              </button>
              {forgotError && <p className="text-red-400 text-[13px] mt-4 text-center">{forgotError}</p>}
              <button type="button" onClick={() => setMedView("login")} className="w-full mt-4 text-[12px] text-muted hover:text-cream font-condensed uppercase tracking-[.12em] transition-colors">
                ← Tilbage til login
              </button>
            </form>
          )}

          {/* Success view */}
          {medView === "success" && (
            <div className="text-center py-4">
              <div className="text-[40px] mb-3">✓</div>
              <p className="font-condensed font-black text-[16px] uppercase text-yellow mb-2">Kode sendt!</p>
              <p className="text-muted text-[13px] mb-5">Tjek din email og log ind med den nye kode.</p>
              <button type="button" onClick={() => setMedView("login")} className="w-full bg-yellow text-black font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase py-4 rounded-[2px]">
                Tilbage til login
              </button>
            </div>
          )}

          {/* Normal login view */}
          {medView === "login" && <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label className="block font-condensed font-semibold text-[11px] tracking-[.2em] uppercase text-muted mb-2">
                Email
              </label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.dk"
                autoComplete="email"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block font-condensed font-semibold text-[11px] tracking-[.2em] uppercase text-muted mb-2">
                Adgangskode
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={inputClass + " text-center tracking-[.3em] text-[24px]"}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoComplete="one-time-code"
                required
              />
              <p className="text-[11px] text-muted mt-2 text-center">
                6-cifret kode modtaget via email efter godkendelse
              </p>
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
          </form>}
          {medView === "login" && (
            <p className="text-[13px] text-muted text-center mt-6 pt-5 border-t border-[rgba(242,238,230,0.07)]">
              Glemt kode?{" "}
              <button type="button" onClick={() => { setMedView("forgot"); setForgotError(null); }} className="text-yellow hover:underline font-semibold">
                Få ny kode
              </button>
              {" · "}
              Ikke oprettet?{" "}
              <Link href="/tilmeld" className="text-yellow hover:underline font-semibold">
                Tilmeld dig her
              </Link>
            </p>
          )}
        </div>

        {/* Navigation + admin toggle */}
        <div className="mt-4 flex items-center justify-between px-1">
          <Link href="/" className="text-[12px] font-condensed uppercase tracking-[.15em] text-muted hover:text-yellow">
            ← Forsiden
          </Link>
          <button
            onClick={() => {
              setShowAdmin((v) => !v);
              setAdminError(null);
              setTimeout(() => adminRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
            }}
            className="text-[11px] font-condensed uppercase tracking-[.15em] text-[rgba(242,238,230,.2)] hover:text-[rgba(242,238,230,.5)] transition-colors"
          >
            {showAdmin ? "Skjul ↑" : "Admin →"}
          </button>
        </div>

        {/* Admin login panel */}
        {showAdmin && (
          <div
            ref={adminRef}
            className="mt-3 bg-black2 border border-[rgba(242,238,230,0.07)] rounded-[2px] p-6"
          >
            <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-4">
              Admin adgang
            </p>
            <form onSubmit={handleAdminSubmit} noValidate>
              <div className="mb-3">
                <label className="block font-condensed font-semibold text-[10px] tracking-[.18em] uppercase text-muted mb-1">
                  Brugernavn
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  className={adminInputClass}
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="bobbyjamz"
                />
              </div>
              <div className="mb-4">
                <label className="block font-condensed font-semibold text-[10px] tracking-[.18em] uppercase text-muted mb-1">
                  Kodeord
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  className={adminInputClass}
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-[rgba(245,196,0,.12)] text-yellow border border-[rgba(245,196,0,.25)] font-condensed font-bold text-[12px] tracking-[.12em] uppercase py-3 rounded-[2px] hover:bg-[rgba(245,196,0,.2)] hover:border-yellow transition-colors disabled:opacity-50"
              >
                {adminLoading ? "Logger ind..." : "Log ind som admin →"}
              </button>
              {adminError && (
                <div className="mt-3 p-2 border border-red-400/30 bg-red-400/5 rounded-[2px]">
                  <p className="text-red-400 text-[12px] text-center">{adminError}</p>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
