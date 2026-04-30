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

export default function HealthStatus() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);

  const sendTestSMS = async () => {
    setSmsLoading(true);
    setSmsResult(null);
    try {
      const r = await fetch("/api/admin/test-sms", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setSmsResult(`✓ Test-SMS sendt til ${d.sentTo}`);
      } else {
        setSmsResult(`✗ ${d.error}`);
      }
    } catch (err) {
      setSmsResult(`✗ Netværksfejl: ${err instanceof Error ? err.message : "ukendt"}`);
    } finally {
      setSmsLoading(false);
      setTimeout(() => setSmsResult(null), 6000);
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
  );
}
