"use client";

import { useState } from "react";
import type { DebugReport, TestResult, TestStatus } from "@/lib/admin-debug";

const STATUS_STYLES: Record<TestStatus, { bg: string; text: string; icon: string; label: string }> = {
  ok:      { bg: "bg-green-500/15 border-green-500/40", text: "text-green-400", icon: "✓", label: "OK" },
  warning: { bg: "bg-yellow/15 border-yellow/40",        text: "text-yellow",    icon: "⚠", label: "Advarsel" },
  error:   { bg: "bg-red-500/15 border-red-500/40",      text: "text-red-400",   icon: "✗", label: "Fejl" },
};

function StatusBadge({ status }: { status: TestStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full border font-bold text-[14px] flex-shrink-0 ${s.bg} ${s.text}`}
      aria-label={s.label}
    >
      {s.icon}
    </span>
  );
}

function ResultRow({ result }: { result: TestResult }) {
  const s = STATUS_STYLES[result.status];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-[2px] border ${s.bg}`}>
      <StatusBadge status={result.status} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-cream font-semibold">{result.test}</p>
        <p className="text-[11px] text-muted mt-1 font-mono break-words">{result.detail}</p>
        {result.fix && (
          <p className="text-[11px] text-yellow mt-2 leading-[1.5]">
            <span className="font-bold">→ Fix:</span> {result.fix}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DebugClient({ adminUsername }: { adminUsername: string }) {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<DebugReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendTestEmail, setSendTestEmail] = useState(false);

  async function runTests() {
    setRunning(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendTestEmail }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `Fejl (status ${r.status})`);
        return;
      }
      setReport(data as DebugReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netværksfejl");
    } finally {
      setRunning(false);
    }
  }

  function copyErrorLog() {
    if (!report) return;
    const errors = report.results.filter((r) => r.status === "error" || r.status === "warning");
    const log = [
      `KrydsByg System Debug — ${report.ranAt}`,
      `Logget ind som: ${adminUsername}`,
      `Total: ${report.summary.ok} OK · ${report.summary.warning} advarsler · ${report.summary.error} fejl`,
      "",
      ...errors.map((r) => `[${r.status.toUpperCase()}] ${r.module} — ${r.test}\n  ${r.detail}${r.fix ? `\n  Fix: ${r.fix}` : ""}`),
    ].join("\n");
    navigator.clipboard.writeText(log);
    alert("Fejl-log kopieret til udklipsholder");
  }

  const modules = report ? Object.keys(report.modulesSummary) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">
            System-diagnostik
          </p>
          <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[32px] uppercase tracking-[-.01em] text-cream leading-none">
            Debug
          </h1>
          <p className="text-[13px] text-muted mt-3">
            9 moduler · {report ? <>Sidst kørt <span className="text-cream">{new Date(report.ranAt).toLocaleString("da-DK")}</span></> : "Ikke kørt endnu"}
          </p>
        </div>
      </div>

      {/* Kontrol-panel */}
      <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sendTestEmail}
            onChange={(e) => setSendTestEmail(e.target.checked)}
            className="accent-yellow w-4 h-4"
            disabled={running}
          />
          <span className="text-[12px] text-cream font-condensed font-semibold tracking-[.1em] uppercase">
            Send rigtig test-email (Resend)
          </span>
        </label>
        <button
          onClick={runTests}
          disabled={running}
          className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] hover:bg-yellow/90 transition-colors disabled:opacity-50"
        >
          {running ? "⏳ Kører…" : "▶ Kør alle tests"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-[2px]">
          <p className="text-[13px] text-red-300">{error}</p>
        </div>
      )}

      {running && !report && (
        <div className="p-12 text-center bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          <p className="text-[13px] text-muted font-condensed uppercase tracking-[.15em]">
            Kører diagnostik på 9 moduler…
          </p>
        </div>
      )}

      {!running && !report && !error && (
        <div className="p-8 bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          <p className="text-[14px] text-cream mb-4">
            Tryk på <span className="text-yellow font-bold">▶ Kør alle tests</span> for at starte diagnostikken.
          </p>
          <p className="text-[12px] text-muted leading-[1.7]">
            Testen tjekker: environment variables · auth · medarbejder-data · vagter · fag-dækning ·
            Council AI (live ping) · Sarah · lead-formular · email-konfiguration.
            <br />Rate-limit: max 1 kørsel per 30 sek.
          </p>
        </div>
      )}

      {report && (
        <>
          {/* Samlet status */}
          <div className="grid grid-cols-4 max-[700px]:grid-cols-2 gap-3 mb-8">
            <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
              <p className="text-[10px] font-condensed uppercase tracking-[.18em] text-muted mb-1">Total tests</p>
              <p className="text-[36px] font-condensed font-black text-cream leading-none">{report.summary.total}</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/30 rounded-[2px] p-5">
              <p className="text-[10px] font-condensed uppercase tracking-[.18em] text-green-400 mb-1">OK</p>
              <p className="text-[36px] font-condensed font-black text-green-400 leading-none">{report.summary.ok}</p>
            </div>
            <div className="bg-yellow/5 border border-yellow/30 rounded-[2px] p-5">
              <p className="text-[10px] font-condensed uppercase tracking-[.18em] text-yellow mb-1">Advarsler</p>
              <p className="text-[36px] font-condensed font-black text-yellow leading-none">{report.summary.warning}</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/30 rounded-[2px] p-5">
              <p className="text-[10px] font-condensed uppercase tracking-[.18em] text-red-400 mb-1">Fejl</p>
              <p className="text-[36px] font-condensed font-black text-red-400 leading-none">{report.summary.error}</p>
            </div>
          </div>

          {/* Modul-oversigt */}
          <section className="mb-10">
            <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-4">
              Modul-oversigt
            </h2>
            <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] overflow-hidden overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[rgba(242,238,230,0.07)]">
                    <th className="text-left px-5 py-3 font-condensed uppercase tracking-[.12em] text-[11px] text-muted">Modul</th>
                    <th className="text-right px-3 py-3 font-condensed uppercase tracking-[.12em] text-[11px] text-green-400">✓ OK</th>
                    <th className="text-right px-3 py-3 font-condensed uppercase tracking-[.12em] text-[11px] text-yellow">⚠ Adv.</th>
                    <th className="text-right px-5 py-3 font-condensed uppercase tracking-[.12em] text-[11px] text-red-400">✗ Fejl</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => {
                    const sum = report.modulesSummary[m];
                    const hasError = sum.error > 0;
                    const hasWarn = sum.warning > 0;
                    return (
                      <tr key={m} className="border-b border-[rgba(242,238,230,0.04)] last:border-b-0">
                        <td className="px-5 py-3 text-cream font-semibold">{m}</td>
                        <td className="text-right px-3 py-3 text-green-400 font-mono">{sum.ok}</td>
                        <td className={`text-right px-3 py-3 font-mono ${hasWarn ? "text-yellow font-bold" : "text-muted"}`}>{sum.warning}</td>
                        <td className={`text-right px-5 py-3 font-mono ${hasError ? "text-red-400 font-bold" : "text-muted"}`}>{sum.error}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Fejl & advarsler først */}
          {(report.summary.error > 0 || report.summary.warning > 0) && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream">
                  Problemer der kræver handling
                </h2>
                <button
                  onClick={copyErrorLog}
                  className="text-[10px] font-condensed font-bold tracking-[.12em] uppercase text-muted hover:text-yellow border border-[rgba(242,238,230,.15)] hover:border-yellow/40 px-3 py-1.5 rounded-[2px] transition-colors"
                >
                  📋 Kopiér fejl-log
                </button>
              </div>
              <div className="space-y-2">
                {report.results
                  .filter((r) => r.status === "error")
                  .map((r, i) => <ResultRow key={`err-${i}`} result={r} />)}
                {report.results
                  .filter((r) => r.status === "warning")
                  .map((r, i) => <ResultRow key={`warn-${i}`} result={r} />)}
              </div>
            </section>
          )}

          {/* Alle resultater per modul */}
          <section>
            <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-4">
              Alle test-resultater
            </h2>
            <div className="space-y-6">
              {modules.map((m) => {
                const moduleResults = report.results.filter((r) => r.module === m);
                return (
                  <div key={m}>
                    <h3 className="font-condensed font-bold text-[14px] uppercase tracking-[.1em] text-yellow mb-3">
                      {m} <span className="text-muted text-[12px] ml-2">({moduleResults.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {moduleResults.map((r, i) => <ResultRow key={`${m}-${i}`} result={r} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <p className="mt-12 text-center text-[11px] text-muted font-condensed">
            Rate-limit: max 1 kørsel per 30 sek. · Test-emails sendes kun når checkboxen er aktiv.
          </p>
        </>
      )}
    </div>
  );
}
