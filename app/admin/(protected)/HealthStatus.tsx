"use client";

import { useEffect, useState } from "react";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

interface HealthData {
  ok: boolean;
  checks: CheckResult[];
  timestamp: string;
}

interface SourceDiag {
  status: "ok" | "failed" | "empty";
  rawCount: number;
  error?: string;
}

interface LeadBotResult {
  ok: boolean;
  found?: number;
  imported?: number;
  cleanedUp?: number;
  qualified?: number;
  discarded?: number;
  byType?: { company: number; private: number; employee: number };
  sourceDiagnostics?: Record<string, SourceDiag>;
  durationMs?: number;
  smsSent?: boolean;
  hasGatewayToken?: boolean;
  hasAdminPhone?: boolean;
  error?: string;
}

interface OutreachResult {
  ok: boolean;
  processed?: number;
  sent?: number;
  analyzed?: number;
  drafted?: number;
  noEmail?: number;
  lowScore?: number;
  errors?: number;
  durationMs?: number;
  message?: string;
  error?: string;
}

interface BackfillResult {
  ok: boolean;
  total?: number;
  alreadyComplete?: number;
  rescued?: number;
  quarantined?: number;
  skippedProtected?: number;
  durationMs?: number;
  error?: string;
}

export default function HealthStatus() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [botRunning, setBotRunning] = useState(false);
  const [botResult, setBotResult] = useState<LeadBotResult | null>(null);
  const [outreachRunning, setOutreachRunning] = useState(false);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);

  const runLeadBot = async () => {
    setBotRunning(true);
    setBotResult(null);
    try {
      const r = await fetch("/api/admin/run-leadbot", { method: "POST" });
      const text = await r.text();
      let d: LeadBotResult;
      try {
        d = JSON.parse(text) as LeadBotResult;
      } catch {
        // Non-JSON svar — typisk Vercel timeout-side eller crash
        const snippet = text.slice(0, 120).replace(/\s+/g, " ");
        d = {
          ok: false,
          error: r.status === 504 || r.status === 502
            ? "Timeout — funktionen blev for langsom (>5 min). Prøv igen senere."
            : `HTTP ${r.status}: ${snippet}...`,
        };
      }
      setBotResult(d);
    } catch (err) {
      setBotResult({ ok: false, error: err instanceof Error ? err.message : "Netværksfejl" });
    } finally {
      setBotRunning(false);
    }
  };

  const runBackfill = async () => {
    setBackfillRunning(true);
    setBackfillResult(null);
    try {
      const r = await fetch("/api/admin/backfill-leads", { method: "POST" });
      const text = await r.text();
      let d: BackfillResult;
      try {
        d = JSON.parse(text) as BackfillResult;
      } catch {
        const snippet = text.slice(0, 120).replace(/\s+/g, " ");
        d = {
          ok: false,
          error: r.status === 504 || r.status === 502
            ? "Timeout — for mange leads i ét hug. Prøv igen senere."
            : `HTTP ${r.status}: ${snippet}...`,
        };
      }
      setBackfillResult(d);
    } catch (err) {
      setBackfillResult({ ok: false, error: err instanceof Error ? err.message : "Netværksfejl" });
    } finally {
      setBackfillRunning(false);
    }
  };

  const runAutoOutreach = async () => {
    setOutreachRunning(true);
    setOutreachResult(null);
    try {
      const r = await fetch("/api/cron/auto-outreach", { method: "POST" });
      const text = await r.text();
      let d: OutreachResult;
      try {
        d = JSON.parse(text) as OutreachResult;
      } catch {
        const snippet = text.slice(0, 120).replace(/\s+/g, " ");
        d = {
          ok: false,
          error: r.status === 504 || r.status === 502
            ? "Timeout — for mange leads i ét hug. Prøv igen, så tager den næste batch."
            : `HTTP ${r.status}: ${snippet}...`,
        };
      }
      setOutreachResult(d);
    } catch (err) {
      setOutreachResult({ ok: false, error: err instanceof Error ? err.message : "Netværksfejl" });
    } finally {
      setOutreachRunning(false);
    }
  };

  const sendTestSMS = async () => {
    setSmsLoading(true);
    setSmsResult(null);
    try {
      const r = await fetch("/api/admin/test-sms", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setSmsResult(`✓ SMS sendt → ${d.sentTo} (id: ${d.smsId || "?"})`);
      } else {
        const hint = d.hint ? ` · ${d.hint.slice(0, 80)}` : "";
        setSmsResult(`✗ ${d.error}${hint}`);
      }
    } catch (err) {
      setSmsResult(`✗ Netværksfejl: ${err instanceof Error ? err.message : "ukendt"}`);
    } finally {
      setSmsLoading(false);
      setTimeout(() => setSmsResult(null), 12000); // 12s — tid nok til at læse fejlbesked
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/health", { cache: "no-store" });
      const d = await r.json();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-3 mb-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
        <p className="text-[12px] text-muted font-condensed">Tjekker system-status...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-[2px] p-3 mb-6">
        <p className="text-[12px] text-red-300 font-condensed">⚠ Kunne ikke hente system-status</p>
      </div>
    );
  }

  const okCount = data.checks.filter((c) => c.ok).length;
  const totalCount = data.checks.length;

  return (
    <>
      {/* ── LeadBot manuel kørsel ─────────────────────────────────── */}
      <div className="mb-2 rounded-[2px] border border-[rgba(242,238,230,0.07)] bg-gray px-4 py-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[18px] leading-none">◆</span>
          <div className="min-w-0">
            <p className="text-[12px] font-condensed font-bold tracking-[.12em] uppercase text-cream">LeadBot</p>
            <p className="text-[11px] text-muted font-condensed">Kører automatisk kl. 08:00 DK · Finder &amp; importerer nye leads</p>
          </div>
        </div>

        {/* Resultat */}
        {botResult && (
          <div className={`text-[11px] font-condensed leading-snug w-full ${botResult.ok ? "text-green-400" : "text-red-400"}`}>
            {botResult.ok ? (
              <>
                ✓ {botResult.imported} nye leads importeret ({botResult.found} fundet, {Math.round((botResult.durationMs || 0) / 1000)}s)
                {botResult.byType && (
                  <span className="text-muted ml-1">
                    · Virk: {botResult.byType.company} · Priv: {botResult.byType.private} · Medarb: {botResult.byType.employee}
                  </span>
                )}
                {botResult.discarded !== undefined && botResult.discarded > 0 && (
                  <span className="block text-muted mt-[2px]">🔁 {botResult.discarded} kasseret af qualifier (score for lav)</span>
                )}
                {botResult.cleanedUp !== undefined && botResult.cleanedUp > 0 && (
                  <span className="block text-muted mt-[2px]">🗑 {botResult.cleanedUp} udløbne &quot;New&quot; leads ryddet op (&gt;7 dage)</span>
                )}
                {!botResult.hasGatewayToken && (
                  <span className="block text-orange-400 mt-[2px]">⚠ GATEWAYAPI_TOKEN mangler — ingen SMS sendt</span>
                )}
                {botResult.hasGatewayToken && !botResult.hasAdminPhone && (
                  <span className="block text-orange-400 mt-[2px]">⚠ ADMIN_PHONE mangler — ingen SMS sendt</span>
                )}
                {botResult.smsSent && (
                  <span className="block text-green-400 mt-[2px]">✓ SMS notifikation sendt</span>
                )}

                {/* Per-kilde breakdown — hjælper med at finde brudte kilder */}
                {botResult.sourceDiagnostics && (
                  <div className="mt-2 pt-2 border-t border-[rgba(242,238,230,.07)] grid grid-cols-2 gap-x-3 gap-y-[2px]">
                    {Object.entries(botResult.sourceDiagnostics).map(([name, d]) => {
                      const icon = d.status === "ok" ? "✅" : d.status === "empty" ? "⚪" : "❌";
                      const color =
                        d.status === "ok" ? "text-green-400"
                        : d.status === "empty" ? "text-muted"
                        : "text-red-400";
                      return (
                        <div key={name} className={`${color} text-[10px]`}>
                          {icon} <span className="text-cream">{name}:</span> {d.rawCount}
                          {d.error && <span className="block ml-4 text-red-400/70 text-[9px]">{d.error.slice(0, 60)}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>✗ Fejl: {botResult.error}</>
            )}
          </div>
        )}

        {/* Backfill resultat */}
        {backfillResult && (
          <div className={`text-[11px] font-condensed leading-snug w-full ${backfillResult.ok ? "text-green-400" : "text-red-400"}`}>
            {backfillResult.ok ? (
              <>
                ✓ Backfill færdig ({Math.round((backfillResult.durationMs || 0) / 1000)}s):
                <span className="text-muted ml-1">
                  {backfillResult.rescued} reddet · {backfillResult.quarantined} i karantæne · {backfillResult.alreadyComplete} ok · {backfillResult.skippedProtected} sprunget over
                </span>
              </>
            ) : (
              <>✗ Fejl: {backfillResult.error}</>
            )}
          </div>
        )}

        <button
          onClick={runBackfill}
          disabled={backfillRunning}
          className="flex-shrink-0 flex items-center gap-2 text-yellow border border-yellow/30 font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-[7px] rounded-[2px] hover:bg-yellow/10 transition-colors disabled:opacity-50"
          title="Rydder op i eksisterende leads: redder manglende emails, sætter resten i karantæne (Incomplete)"
        >
          {backfillRunning ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-yellow border-t-transparent rounded-full animate-spin" />
              Rydder op...
            </>
          ) : (
            <>⟳ Backfill leads</>
          )}
        </button>

        <button
          onClick={runLeadBot}
          disabled={botRunning}
          className="flex-shrink-0 flex items-center gap-2 bg-yellow text-black font-condensed font-black text-[11px] tracking-[.12em] uppercase px-4 py-[7px] rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-50"
        >
          {botRunning ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Kører... (op til 5 min)
            </>
          ) : (
            <>▶ Kør nu</>
          )}
        </button>
      </div>

      {/* ── Auto-Outreach manuel kørsel ───────────────────────────── */}
      <div className="mb-4 rounded-[2px] border border-[rgba(242,238,230,0.07)] bg-gray px-4 py-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[18px] leading-none">✉</span>
          <div className="min-w-0">
            <p className="text-[12px] font-condensed font-bold tracking-[.12em] uppercase text-cream">Auto-Outreach</p>
            <p className="text-[11px] text-muted font-condensed">Kører automatisk kl. 13:00 DK · Council → Sarah → Send (score ≥ 5)</p>
          </div>
        </div>

        {outreachResult && (
          <div className={`text-[11px] font-condensed leading-snug ${outreachResult.ok ? "text-green-400" : "text-red-400"}`}>
            {outreachResult.ok ? (
              <>
                {outreachResult.processed === 0
                  ? "Ingen New leads at behandle"
                  : `✓ ${outreachResult.sent} mails sendt · ${outreachResult.analyzed} analyseret · ${Math.round((outreachResult.durationMs || 0) / 1000)}s`
                }
                {(outreachResult.lowScore ?? 0) > 0 && (
                  <span className="block text-yellow mt-[2px]">⏸ {outreachResult.lowScore} leads venter (score under 5)</span>
                )}
                {(outreachResult.noEmail ?? 0) > 0 && (
                  <span className="block text-muted mt-[2px]">📭 {outreachResult.noEmail} mangler email</span>
                )}
                {(outreachResult.errors ?? 0) > 0 && (
                  <span className="block text-red-400 mt-[2px]">⚠ {outreachResult.errors} fejl</span>
                )}
              </>
            ) : (
              <>✗ Fejl: {outreachResult.error}</>
            )}
          </div>
        )}

        <button
          onClick={runAutoOutreach}
          disabled={outreachRunning}
          className="flex-shrink-0 flex items-center gap-2 bg-yellow text-black font-condensed font-black text-[11px] tracking-[.12em] uppercase px-4 py-[7px] rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-50"
        >
          {outreachRunning ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Sender... (op til 5 min)
            </>
          ) : (
            <>✉ Kør outreach</>
          )}
        </button>
      </div>

    <div className={`mb-6 rounded-[2px] border ${data.ok ? "bg-green-500/[.04] border-green-500/20" : "bg-yellow/[.04] border-yellow/30"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${data.ok ? "bg-green-400" : "bg-yellow"}`} />
          <p className="text-[12px] font-condensed font-bold tracking-[.12em] uppercase text-cream">
            System: {data.ok ? "Alt kører" : `${okCount}/${totalCount} OK`}
          </p>
          {!data.ok && (
            <span className="text-[11px] text-muted font-condensed">
              · Klik for detaljer
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              refresh();
            }}
            className="text-[10px] font-condensed font-bold tracking-[.12em] uppercase text-muted hover:text-yellow transition-colors"
            disabled={loading}
          >
            {loading ? "..." : "↻ Genscan"}
          </button>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-[rgba(242,238,230,.07)] divide-y divide-[rgba(242,238,230,.05)]">
          {data.checks.map((check) => (
            <div key={check.name} className="flex items-start justify-between gap-4 px-4 py-2.5">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 ${
                    check.ok ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[13px] text-cream font-medium">{check.name}</p>
                  <p className="text-[11px] text-muted mt-[1px]">{check.detail}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="px-4 py-3 bg-[rgba(242,238,230,.02)] flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[10px] text-muted font-condensed">
              Tjekket: {new Date(data.timestamp).toLocaleString("da-DK")}
            </p>
            <div className="flex items-center gap-3">
              {smsResult && (
                <span className={`text-[11px] font-condensed ${smsResult.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                  {smsResult}
                </span>
              )}
              <button
                onClick={sendTestSMS}
                disabled={smsLoading}
                className="text-[10px] font-condensed font-bold tracking-[.12em] uppercase text-yellow border border-yellow/30 px-3 py-1 rounded-[2px] hover:bg-yellow/10 transition-colors disabled:opacity-50"
              >
                {smsLoading ? "Sender..." : "Test-SMS →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
