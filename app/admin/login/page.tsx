"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type View = "login" | "forgot" | "code" | "success";

export default function AdminLoginPage() {
  const router = useRouter();

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot state
  const [forgotMethod, setForgotMethod] = useState<"sms" | "email">("email");
  const [forgotValue, setForgotValue] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Code state
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  const [view, setView] = useState<View>("login");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (view === "code") {
      setSecondsLeft(15 * 60);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { clearInterval(timerRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) { setLoginError(data.error || "Login fejlede"); setLoginLoading(false); return; }
    router.push("/admin");
    router.refresh();
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotValue.trim()) { setForgotError("Udfyld feltet"); return; }
    setForgotLoading(true);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: forgotMethod, value: forgotValue.trim(), type: "admin" }),
    });
    const data = await res.json();
    setForgotLoading(false);
    if (!res.ok) { setForgotError(data.error || "Kunne ikke sende kode"); return; }
    setView("code");
  };

  const handleCode = async (e: FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    if (newPassword !== confirmPassword) { setCodeError("Kodeordene matcher ikke"); return; }
    if (newPassword.length < 6) { setCodeError("Kodeord skal være mindst 6 tegn"); return; }
    setCodeLoading(true);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, newPassword, type: "admin" }),
    });
    const data = await res.json();
    setCodeLoading(false);
    if (!res.ok) { setCodeError(data.error || "Ugyldig kode"); return; }
    setView("success");
    setTimeout(() => { router.push("/admin"); router.refresh(); }, 2000);
  };

  const inp = "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";
  const lbl = "block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]";
  const btn = "w-full bg-yellow text-black font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase py-[14px] rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-60";

  return (
    <main className="bg-black2 min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity text-cream" title="Tilbage til forsiden">
            <svg width="64" height="64" viewBox="0 0 90 90">
              <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
              <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
            </svg>
          </Link>
          <h1 className="font-condensed font-black text-[28px] uppercase tracking-[.02em] text-cream mt-4">
            Kryds admin
          </h1>
          <p className="text-[13px] text-muted mt-1">Log ind for at styre medarbejdere og vagter</p>
          <Link href="/" className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted hover:text-yellow mt-3">
            ← Tilbage til forsiden
          </Link>
        </div>

        <div className="bg-gray p-8 border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          {/* VIEW: Login */}
          {view === "login" && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className={lbl}>Brugernavn</label>
                <input className={inp} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
              </div>
              <div className="mb-6">
                <label className={lbl}>Kodeord</label>
                <input type="password" className={inp} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </div>
              <button type="submit" disabled={loginLoading} className={btn}>
                {loginLoading ? "Logger ind..." : "Log ind"}
              </button>
              {loginError && <p className="text-red-400 text-[13px] mt-4 text-center">{loginError}</p>}
              <button
                type="button"
                onClick={() => { setView("forgot"); setForgotError(null); setForgotValue(""); }}
                className="w-full mt-4 text-[12px] text-muted hover:text-cream font-condensed uppercase tracking-[.12em] transition-colors"
              >
                Glemt kodeord?
              </button>
            </form>
          )}

          {/* VIEW: Forgot */}
          {view === "forgot" && (
            <form onSubmit={handleForgot}>
              <p className="font-condensed font-black text-[18px] uppercase tracking-[-.01em] text-cream mb-5">
                Nulstil kodeord
              </p>
              <div className="flex gap-2 mb-5">
                {(["email", "sms"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForgotMethod(m)}
                    className={`flex-1 py-2.5 rounded-[2px] font-condensed font-bold text-[11px] tracking-[.12em] uppercase border transition-colors ${
                      forgotMethod === m
                        ? "bg-yellow text-black border-yellow"
                        : "bg-transparent text-muted border-[rgba(242,238,230,.1)] hover:text-cream"
                    }`}
                  >
                    {m === "email" ? "✉ Send kode på email" : "📱 Send kode på SMS"}
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <label className={lbl}>{forgotMethod === "email" ? "Email-adresse" : "Telefonnummer"}</label>
                <input
                  type={forgotMethod === "email" ? "email" : "tel"}
                  className={inp}
                  value={forgotValue}
                  onChange={(e) => setForgotValue(e.target.value)}
                  placeholder={forgotMethod === "email" ? "din@email.dk" : "+45 42 77 88 66"}
                  required
                />
              </div>
              <button type="submit" disabled={forgotLoading} className={btn}>
                {forgotLoading ? "Sender..." : "Send kode"}
              </button>
              {forgotError && <p className="text-red-400 text-[13px] mt-4 text-center">{forgotError}</p>}
              <button type="button" onClick={() => setView("login")} className="w-full mt-4 text-[12px] text-muted hover:text-cream font-condensed uppercase tracking-[.12em] transition-colors">
                ← Tilbage til login
              </button>
            </form>
          )}

          {/* VIEW: Code */}
          {view === "code" && (
            <form onSubmit={handleCode}>
              <p className="font-condensed font-black text-[18px] uppercase tracking-[-.01em] text-cream mb-1">
                Indtast din kode
              </p>
              <p className="text-[12px] text-muted mb-5">
                Kode sendt til {forgotValue} · Udløber om{" "}
                <span className={secondsLeft < 60 ? "text-red-400" : "text-yellow"}>{formatTime(secondsLeft)}</span>
              </p>
              <div className="mb-4">
                <label className={lbl}>6-cifret kode</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={inp + " text-center tracking-[.3em] text-[28px] font-bold"}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                />
              </div>
              <div className="mb-4">
                <label className={lbl}>Nyt kodeord</label>
                <input type="password" className={inp} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={6} />
              </div>
              <div className="mb-6">
                <label className={lbl}>Bekræft kodeord</label>
                <input type="password" className={inp} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
              </div>
              <button type="submit" disabled={codeLoading || secondsLeft === 0} className={btn}>
                {codeLoading ? "Gemmer..." : "Gem nyt kodeord"}
              </button>
              {codeError && <p className="text-red-400 text-[13px] mt-4 text-center">{codeError}</p>}
              {secondsLeft === 0 && (
                <p className="text-amber-400 text-[12px] mt-3 text-center">
                  Koden er udløbet —{" "}
                  <button type="button" onClick={() => setView("forgot")} className="underline">send en ny</button>
                </p>
              )}
            </form>
          )}

          {/* VIEW: Success */}
          {view === "success" && (
            <div className="text-center py-4">
              <div className="text-[48px] mb-4">✓</div>
              <p className="font-condensed font-black text-[18px] uppercase text-yellow mb-2">
                Kodeord opdateret
              </p>
              <p className="text-muted text-[13px]">Du er nu logget ind — omdirigerer...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
