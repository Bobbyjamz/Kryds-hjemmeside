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
          <button type="submit" disabled={creating} className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-6 py-3 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-50">
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
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/admin/vagter/${s.id}`} className="font-condensed font-extrabold text-[16px] uppercase tracking-[.02em] text-cream hover:text-yellow">{s.title}</Link>
                        <span className="text-[10px] font-condensed uppercase tracking-[.12em] px-2 py-[2px] rounded-[2px] bg-yellow/20 text-yellow">{STATUS_LABEL[s.status]}</span>
                      </div>
                      <p className="text-[12px] text-muted font-condensed uppercase tracking-[.1em]">
                        {TRADES[s.trade as keyof typeof TRADES] || s.trade} · {s.location || "—"}
                      </p>
                      <p className="text-[13px] text-cream mt-1">
                        {new Date(s.startAt).toLocaleString("da-DK")} → {new Date(s.endAt).toLocaleString("da-DK")}
                      </p>
                      {s.signups.length > 0 && (
                        <p className="text-[12px] text-muted mt-2">
                          {s.signups.length} tilmeldt{s.signups.length > 1 ? "e" : ""}:{" "}
                          <span className="text-cream">{s.signups.map(employeeName).join(", ")}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteShift(s.id)}
                      className="text-[11px] font-condensed uppercase tracking-[.12em] text-muted hover:text-red-400"
                    >
                      Slet
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
