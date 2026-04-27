"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TRADES } from "@/lib/constants";
import type { Shift, Employee } from "@/lib/types";

const STATUSES = ["OPEN", "FILLED", "CANCELLED", "COMPLETED"] as const;

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 16);
}

export default function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [shift, setShift] = useState<Shift | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [autoMatching, setAutoMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [sRes, eRes] = await Promise.all([
        fetch(`/api/admin/shifts/${id}`),
        fetch("/api/admin/employees"),
      ]);
      if (sRes.ok) setShift((await sRes.json()).shift);
      if (eRes.ok) setEmployees((await eRes.json()).employees);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className="text-muted">Indlæser...</p>;
  if (!shift) return <p className="text-muted">Vagt ikke fundet</p>;

  const update = (patch: Partial<Shift>) => setShift({ ...shift, ...patch });

  const employeeName = (eid: string) => employees.find((e) => e.id === eid)?.name || eid;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const payload = {
      ...shift,
      startAt: new Date(shift.startAt).toISOString(),
      endAt: new Date(shift.endAt).toISOString(),
    };
    const res = await fetch(`/api/admin/shifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setMessage("Gemt");
    else setMessage("Kunne ikke gemme");
    setSaving(false);
  };

  const autoMatch = async () => {
    setAutoMatching(true);
    setMatchResult(null);
    const res = await fetch("/api/admin/shifts/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId: id }),
    });
    const data = await res.json();
    setMatchResult(res.ok ? `Sendt til ${data.matched} medarbejdere` : "Fejl ved auto-match");
    if (res.ok) setShift({ ...shift!, autoMatchSent: true, matchedEmployeeIds: data.names });
    setAutoMatching(false);
  };

  const del = async () => {
    if (!confirm("Slet vagten permanent?")) return;
    const res = await fetch(`/api/admin/shifts/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/vagter");
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[15px] px-[14px] py-[10px] rounded-[2px] outline-none focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";
  const labelClass = "block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[6px]";

  return (
    <div className="max-w-[820px]">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/admin/vagter" className="text-[11px] font-condensed uppercase tracking-[.12em] text-muted hover:text-cream">← Vagter</Link>
          <h1 className="font-condensed font-black text-[40px] uppercase tracking-[-.01em] text-cream leading-none mt-2">{shift.title}</h1>
        </div>
        <button
          onClick={del}
          className="font-condensed font-semibold text-[11px] tracking-[.15em] uppercase text-muted border border-[rgba(242,238,230,.1)] hover:text-red-400 hover:border-red-400 px-4 py-2 rounded-[2px] transition-colors"
        >
          Slet vagt
        </button>
      </div>

      <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4 max-[700px]:grid-cols-1">
          <div>
            <label className={labelClass}>Titel</label>
            <input className={inputClass} value={shift.title} onChange={(e) => update({ title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Fag</label>
            <select className={inputClass + " cursor-pointer"} value={shift.trade} onChange={(e) => update({ trade: e.target.value })}>
              {Object.entries(TRADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Sted</label>
            <input className={inputClass} value={shift.location} onChange={(e) => update({ location: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Timeløn (kr/t)</label>
            <input type="number" className={inputClass} value={shift.hourlyRate ?? ""} onChange={(e) => update({ hourlyRate: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className={labelClass}>Start</label>
            <input type="datetime-local" className={inputClass} value={toLocalInput(shift.startAt)} onChange={(e) => update({ startAt: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className={labelClass}>Slut</label>
            <input type="datetime-local" className={inputClass} value={toLocalInput(shift.endAt)} onChange={(e) => update({ endAt: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass + " cursor-pointer"} value={shift.status} onChange={(e) => update({ status: e.target.value as Shift["status"] })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tildelt til</label>
            <select className={inputClass + " cursor-pointer"} value={shift.assignedTo || ""} onChange={(e) => update({ assignedTo: e.target.value || undefined })}>
              <option value="">— Ingen —</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className={labelClass}>Beskrivelse</label>
          <textarea className={inputClass + " min-h-[100px] resize-y"} value={shift.description || ""} onChange={(e) => update({ description: e.target.value })} />
        </div>
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={save}
            disabled={saving}
            className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-6 py-3 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-50"
          >
            {saving ? "Gemmer..." : "Gem ændringer"}
          </button>
          {message && <span className="text-[12px] text-muted">{message}</span>}
        </div>
      </div>

      <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <h2 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.04em] text-cream">Tilmeldte ({shift.signups.length})</h2>
          <button
            onClick={autoMatch}
            disabled={autoMatching}
            className="border border-yellow text-yellow font-condensed font-extrabold text-[11px] tracking-[.12em] uppercase px-5 py-2 rounded-[2px] hover:bg-[rgba(245,196,0,.1)] transition-colors disabled:opacity-50"
          >
            {autoMatching ? "Matcher..." : "Auto-match"}
          </button>
          {shift.autoMatchSent && (
            <span className="text-[11px] text-muted">Tidligere sendt til {shift.matchedEmployeeIds?.length ?? 0}</span>
          )}
          {matchResult && <span className="text-[12px] text-muted">{matchResult}</span>}
        </div>
        {shift.signups.length === 0 ? (
          <p className="text-muted text-[13px]">Ingen har budt ind endnu.</p>
        ) : (
          <ul className="space-y-2">
            {shift.signups.map((sid) => (
              <li key={sid} className="text-[14px] text-cream border border-[rgba(242,238,230,.06)] rounded-[2px] p-3 flex items-center justify-between">
                <span>{employeeName(sid)}</span>
                <Link href={`/admin/medarbejdere/${sid}`} className="text-[11px] font-condensed uppercase tracking-[.12em] text-yellow hover:underline">Se profil</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
