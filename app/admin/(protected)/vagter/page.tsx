"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { TRADES } from "@/lib/constants";
import type { Shift, Employee } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Åben",
  FILLED: "Besat",
  CANCELLED: "Aflyst",
  COMPLETED: "Afsluttet",
};

export default function VagterListPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const [sRes, eRes] = await Promise.all([
      fetch("/api/admin/shifts"),
      fetch("/api/admin/employees"),
    ]);
    if (sRes.ok) setShifts((await sRes.json()).shifts);
    if (eRes.ok) setEmployees((await eRes.json()).employees);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name || id;

  const createShift = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const res = await fetch("/api/admin/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, trade, location, startAt, endAt,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        description,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Fejlede");
      setCreating(false);
      return;
    }
    setTitle(""); setTrade(""); setLocation(""); setStartAt(""); setEndAt(""); setHourlyRate(""); setDescription("");
    setShowForm(false);
    setCreating(false);
    load();
  };

  const deleteShift = async (id: string) => {
    if (!confirm("Slet vagten?")) return;
    const res = await fetch(`/api/admin/shifts/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  // ── Match-preview: Council scorer ledige medarbejdere ─────────────────
  interface ScoredMatch {
    employee: { id: string; name: string; trade: string; phone: string; email?: string; rating?: number; completedShifts?: number };
    score: number;
    reasons: string[];
  }
  const [matchPreview, setMatchPreview] = useState<Record<string, { matches: ScoredMatch[]; totalAvailable: number } | null>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, Set<string>>>({});
  const [sendingMatch, setSendingMatch] = useState<string | null>(null);

  async function previewMatch(shiftId: string) {
    setPreviewLoading(shiftId);
    try {
      const r = await fetch("/api/admin/shifts/preview-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId }),
      });
      const d = await r.json();
      if (d.ok) {
        setMatchPreview((p) => ({ ...p, [shiftId]: { matches: d.matches, totalAvailable: d.totalAvailable } }));
        // Auto-vælg top 3
        setSelectedMatches((p) => ({
          ...p,
          [shiftId]: new Set(d.matches.slice(0, 3).map((m: ScoredMatch) => m.employee.id)),
        }));
      } else {
        alert(d.error || "Kunne ikke finde matches");
      }
    } catch {
      alert("Netværksfejl");
    }
    setPreviewLoading(null);
  }

  function toggleMatch(shiftId: string, empId: string) {
    setSelectedMatches((p) => {
      const current = p[shiftId] || new Set();
      const next = new Set(current);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return { ...p, [shiftId]: next };
    });
  }

  async function sendToMatches(shiftId: string) {
    const ids = Array.from(selectedMatches[shiftId] || []);
    if (ids.length === 0) { alert("Vælg mindst én medarbejder"); return; }
    if (!confirm(`Send vagt-tilbud til ${ids.length} medarbejder${ids.length === 1 ? "" : "e"} via SMS + email?`)) return;
    setSendingMatch(shiftId);
    try {
      const r = await fetch("/api/admin/shifts/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId, employeeIds: ids }),
      });
      const d = await r.json();
      if (d.ok) {
        alert(`✓ Sendt til ${d.matched}: ${d.smsSent} SMS + ${d.emailSent} email`);
        setMatchPreview((p) => ({ ...p, [shiftId]: null }));
        load();
      } else {
        alert(d.error || "Fejl");
      }
    } catch {
      alert("Netværksfejl");
    }
    setSendingMatch(null);
  }

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[14px] px-[14px] py-[10px] rounded-[2px] outline-none focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";
  const labelClass = "block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[6px]";

  return (
    <div>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Vagtsystem</p>
          <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[32px] uppercase tracking-[-.01em] text-cream leading-none">Vagter</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] hover:bg-yellow2 transition-colors"
          style={{ minHeight: 44 }}
        >
          {showForm ? "Annuller" : "+ Opret vagt"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createShift} className="bg-gray p-6 border border-[rgba(242,238,230,0.07)] rounded-[2px] mb-8 max-w-[820px]">
          <h2 className="font-condensed font-extrabold text-[20px] uppercase tracking-[.04em] text-cream mb-4">Ny vagt</h2>
          <div className="grid grid-cols-2 gap-4 mb-4 max-[700px]:grid-cols-1">
            <div>
              <label className={labelClass}>Titel</label>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Fag</label>
              <select className={inputClass + " cursor-pointer"} value={trade} onChange={(e) => setTrade(e.target.value)} required>
                <option value="">Vælg fag...</option>
                {Object.entries(TRADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sted</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Adresse eller bydel" />
            </div>
            <div>
              <label className={labelClass}>Timeløn (kr/t)</label>
              <input type="number" className={inputClass} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="f.eks. 180" />
            </div>
            <div>
              <label className={labelClass}>Start</label>
              <input type="datetime-local" className={inputClass} value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Slut</label>
              <input type="datetime-local" className={inputClass} value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
            </div>
          </div>
          <div className="mb-4">
            <label className={labelClass}>Beskrivelse</label>
            <textarea className={inputClass + " min-h-[80px] resize-y"} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-red-400 text-[13px] mb-3">{error}</p>}
          <button type="submit" disabled={creating} className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-6 py-3 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-50 max-[700px]:w-full" style={{ minHeight: 44 }}>
            {creating ? "Opretter..." : "Opret vagt"}
          </button>
        </form>
      )}

      <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
        {loading ? (
          <p className="p-6 text-muted text-center">Indlæser...</p>
        ) : shifts.length === 0 ? (
          <p className="p-6 text-muted text-center">Ingen vagter oprettet</p>
        ) : (
          <ul>
            {shifts
              .sort((a, b) => a.startAt.localeCompare(b.startAt))
              .map((s) => (
                <li key={s.id} className="p-5 border-b border-[rgba(242,238,230,0.04)] last:border-b-0">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href={`/admin/vagter/${s.id}`} className="font-condensed font-extrabold text-[16px] uppercase tracking-[.02em] text-cream hover:text-yellow">{s.title}</Link>
                        <span className={`text-[10px] font-condensed uppercase tracking-[.12em] px-2 py-[2px] rounded-[2px] ${
                          s.status === "OPEN" ? "bg-yellow/20 text-yellow" :
                          s.status === "FILLED" ? "bg-green-400/15 text-green-300" :
                          s.status === "COMPLETED" ? "bg-cream/10 text-cream" :
                          "bg-red-400/15 text-red-300"
                        }`}>{STATUS_LABEL[s.status]}</span>
                        {s.autoMatchSent && (
                          <span className="text-[10px] font-condensed uppercase tracking-[.1em] px-2 py-[2px] rounded-[2px] bg-orange-400/15 text-orange-300">
                            📤 Tilbudt {s.matchedEmployeeIds?.length || 0}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted font-condensed uppercase tracking-[.1em]">
                        {TRADES[s.trade as keyof typeof TRADES] || s.trade} · {s.location || "—"}
                      </p>
                      <p className="text-[13px] text-cream mt-1">
                        {new Date(s.startAt).toLocaleString("da-DK", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} → {new Date(s.endAt).toLocaleString("da-DK", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {s.signups.length > 0 && (
                        <p className="text-[12px] text-muted mt-2">
                          {s.signups.length} tilmeldt{s.signups.length > 1 ? "e" : ""}:{" "}
                          <span className="text-green-400 font-semibold">{s.signups.map(employeeName).join(", ")}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      {s.status === "OPEN" && !matchPreview[s.id] && (
                        <button
                          onClick={() => previewMatch(s.id)}
                          disabled={previewLoading === s.id}
                          className="text-[11px] font-condensed font-bold uppercase tracking-[.12em] text-yellow border border-yellow/40 px-3 py-2 rounded-[2px] hover:bg-yellow/10 disabled:opacity-50"
                        >
                          {previewLoading === s.id ? "Søger..." : "🔍 Find matches"}
                        </button>
                      )}
                      <button
                        onClick={() => deleteShift(s.id)}
                        className="text-[11px] font-condensed uppercase tracking-[.12em] text-muted hover:text-red-400 px-2 py-2"
                      >
                        Slet
                      </button>
                    </div>
                  </div>

                  {/* ── Match preview: viser top 8 medarbejdere med scores ── */}
                  {matchPreview[s.id] && (
                    <div className="mt-4 p-4 bg-black/30 border border-yellow/20 rounded-[2px]">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <p className="font-condensed font-bold text-[11px] tracking-[.15em] uppercase text-yellow">
                          🎯 {matchPreview[s.id]!.matches.length} match{matchPreview[s.id]!.matches.length === 1 ? "" : "es"} (af {matchPreview[s.id]!.totalAvailable} ledige)
                        </p>
                        <button onClick={() => setMatchPreview((p) => ({ ...p, [s.id]: null }))} className="text-muted hover:text-cream text-[14px]">✕</button>
                      </div>

                      {matchPreview[s.id]!.matches.length === 0 ? (
                        <p className="text-[12px] text-muted">Ingen ledige medarbejdere matcher denne vagt. Tilføj nogle eller aktivér Afventer-bekræftelse.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-2 mb-3">
                            {matchPreview[s.id]!.matches.map((m) => {
                              const selected = (selectedMatches[s.id] || new Set()).has(m.employee.id);
                              return (
                                <button
                                  key={m.employee.id}
                                  onClick={() => toggleMatch(s.id, m.employee.id)}
                                  className={`text-left p-3 rounded-[2px] border transition-colors ${
                                    selected ? "border-yellow bg-yellow/10" : "border-[rgba(242,238,230,.08)] bg-black/40 hover:border-[rgba(242,238,230,.2)]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className={`w-5 h-5 rounded-[2px] border flex items-center justify-center text-[11px] flex-shrink-0 ${selected ? "bg-yellow border-yellow text-black" : "border-[rgba(242,238,230,.3)]"}`}>
                                        {selected ? "✓" : ""}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-cream font-semibold text-[13px] truncate">{m.employee.name}</p>
                                        <p className="text-muted text-[11px] truncate">
                                          {TRADES[m.employee.trade as keyof typeof TRADES] || m.employee.trade}
                                          {m.employee.rating && ` · ${m.employee.rating}★`}
                                          {m.employee.completedShifts && ` · ${m.employee.completedShifts} vagter`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-condensed font-black text-[20px] text-yellow leading-none">{m.score}</p>
                                      <p className="text-[9px] text-muted font-condensed uppercase tracking-[.1em]">score</p>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {m.reasons.slice(0, 3).map((r, i) => (
                                      <span key={i} className="text-[10px] text-yellow/80 bg-yellow/5 border border-yellow/15 px-2 py-[1px] rounded-[2px]">{r}</span>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[rgba(242,238,230,.06)]">
                            <p className="text-[11px] text-muted font-condensed">
                              <span className="text-yellow font-bold">{(selectedMatches[s.id] || new Set()).size}</span> valgt — modtager SMS + email
                            </p>
                            <button
                              onClick={() => sendToMatches(s.id)}
                              disabled={sendingMatch === s.id || (selectedMatches[s.id] || new Set()).size === 0}
                              className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.1em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow2 disabled:opacity-50"
                            >
                              {sendingMatch === s.id ? "Sender..." : `📤 Send tilbud til ${(selectedMatches[s.id] || new Set()).size}`}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
