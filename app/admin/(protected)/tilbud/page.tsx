"use client";

import { useEffect, useState } from "react";
import type { Tilbud, TilbudStatus } from "@/lib/types";

const STATUS_LABELS: Record<TilbudStatus, string> = {
  draft: "Udkast",
  sent: "Sendt",
  accepted: "Accepteret",
  rejected: "Afvist",
};
const STATUS_COLORS: Record<TilbudStatus, string> = {
  draft: "bg-white/10 text-cream/60",
  sent: "bg-blue-500/20 text-blue-300",
  accepted: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

const TRADES = ["Tømrer", "Murer", "Stillads", "VVS", "El", "Maler", "Nedrivning", "Jord & anlæg", "Andet"];

export default function TilbudPage() {
  const [tilbud, setTilbud] = useState<Tilbud[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    taskDescription: "",
    trade: "Tømrer",
    estimatedHours: "8",
    location: "København",
  });
  const [newTilbud, setNewTilbud] = useState<Tilbud | null>(null);

  const load = async () => {
    const r = await fetch("/api/admin/tilbud");
    if (r.ok) setTilbud(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setNewTilbud(null);
    const r = await fetch("/api/admin/tilbud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, estimatedHours: Number(form.estimatedHours) }),
    });
    const d = await r.json();
    setCreating(false);
    if (d.ok) {
      setNewTilbud(d.tilbud);
      await load();
      setForm({ clientName: "", clientEmail: "", taskDescription: "", trade: "Tømrer", estimatedHours: "8", location: "København" });
    }
  };

  const sendTilbud = async (id: string) => {
    setSending(id);
    await fetch("/api/admin/tilbud", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "send" }),
    });
    setSending(null);
    await load();
  };

  const updateStatus = async (id: string, status: TilbudStatus) => {
    await fetch("/api/admin/tilbud", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  };

  const deleteTilbud = async (id: string) => {
    if (!confirm("Slet tilbud?")) return;
    await fetch("/api/admin/tilbud", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const inp = "bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2.5 rounded-[2px] w-full font-condensed focus:outline-none focus:border-yellow/60 transition-colors";
  const lbl = "font-condensed font-semibold text-[10px] tracking-[.15em] uppercase text-muted mb-1.5 block";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">
          COUNCIL-ASSISTERET
        </p>
        <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[32px] uppercase tracking-[-.01em] text-cream leading-none">
          Tilbud
        </h1>
        <p className="text-muted text-[13px] mt-2">Council beregner pris og skriver tilbudsteksten automatisk</p>
      </div>

      {/* Opret nyt tilbud */}
      <div className="rounded-[4px] border border-[rgba(242,238,230,.08)] bg-black2 p-6 mb-8">
        <p className="font-condensed font-black text-[13px] tracking-[.15em] uppercase text-cream mb-5">
          Nyt tilbud
        </p>
        <form onSubmit={create} className="grid grid-cols-2 max-[700px]:grid-cols-1 gap-4">
          <div>
            <label className={lbl}>Kundenavn *</label>
            <input required className={inp} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Firma A/S" />
          </div>
          <div>
            <label className={lbl}>Klient-email</label>
            <input type="email" className={inp} value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} placeholder="kunde@firma.dk" />
          </div>
          <div className="col-span-2 max-[700px]:col-span-1">
            <label className={lbl}>Opgavebeskrivelse *</label>
            <textarea required rows={3} className={`${inp} resize-none`} value={form.taskDescription} onChange={(e) => setForm({ ...form, taskDescription: e.target.value })} placeholder="Beskriv opgaven — hvad skal laves, antal personer, varighed..." />
          </div>
          <div>
            <label className={lbl}>Fag</label>
            <select className={inp} value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })}>
              {TRADES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Estimerede timer</label>
            <input type="number" min="1" className={inp} value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Lokation</label>
            <input className={inp} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="København" />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-yellow text-black font-condensed font-black text-[12px] tracking-[.15em] uppercase px-6 py-3 rounded-[2px] hover:bg-yellow/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "Council regner..." : "⚡ Opret tilbud med Council"}
            </button>
          </div>
        </form>

        {newTilbud && (
          <div className="mt-5 border border-yellow/30 bg-yellow/5 rounded-[2px] p-4">
            <p className="font-condensed font-black text-[12px] tracking-[.15em] uppercase text-yellow mb-3">
              ✓ Council har genereret tilbud
            </p>
            <div className="grid grid-cols-3 max-[700px]:grid-cols-1 gap-3 text-[13px] mb-3">
              <div>
                <p className="text-muted text-[11px] font-condensed uppercase tracking-widest">Timepris</p>
                <p className="text-cream font-bold">{newTilbud.hourlyRate} kr/t</p>
              </div>
              <div>
                <p className="text-muted text-[11px] font-condensed uppercase tracking-widest">Ekskl. moms</p>
                <p className="text-cream font-bold">{newTilbud.totalExVat.toLocaleString("da-DK")} kr</p>
              </div>
              <div>
                <p className="text-muted text-[11px] font-condensed uppercase tracking-widest">Inkl. moms</p>
                <p className="text-yellow font-black text-[18px] font-condensed">{newTilbud.totalIncVat.toLocaleString("da-DK")} kr</p>
              </div>
            </div>
            {newTilbud.councilNotes && (
              <p className="text-[12px] text-cream/70 italic border-t border-yellow/20 pt-3 mt-3">
                Council: {newTilbud.councilNotes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tilbud liste */}
      <div>
        <p className="font-condensed font-black text-[13px] tracking-[.15em] uppercase text-cream mb-4">
          Alle tilbud ({tilbud.length})
        </p>
        {loading ? (
          <p className="text-muted text-[13px]">Indlæser...</p>
        ) : tilbud.length === 0 ? (
          <p className="text-muted text-[13px]">Ingen tilbud endnu — opret det første ovenfor.</p>
        ) : (
          <div className="space-y-1">
            {tilbud.map((t) => (
              <div key={t.id}>
                <div
                  className="flex items-center gap-4 p-4 rounded-[2px] border border-[rgba(242,238,230,.06)] bg-black2 hover:bg-white/[.02] cursor-pointer"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed font-bold text-[13px] text-cream truncate">{t.clientName}</p>
                    <p className="text-[11px] text-muted truncate">{t.taskDescription.slice(0, 60)}</p>
                  </div>
                  <p className="font-condensed font-black text-[15px] text-yellow whitespace-nowrap">
                    {t.totalIncVat.toLocaleString("da-DK")} kr
                  </p>
                  <span className={`text-[10px] font-condensed font-bold tracking-[.1em] uppercase px-2 py-0.5 rounded-[2px] shrink-0 ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                  <p className="text-[11px] text-muted hidden min-[900px]:block whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString("da-DK")}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); deleteTilbud(t.id); }} className="text-[10px] text-muted hover:text-red-400 font-condensed uppercase tracking-widest transition-colors ml-1">
                    Slet
                  </button>
                </div>

                {expandedId === t.id && (
                  <div className="border border-t-0 border-[rgba(242,238,230,.06)] bg-black p-5 rounded-b-[2px] space-y-4">
                    <div className="grid grid-cols-4 max-[700px]:grid-cols-2 gap-3 text-[13px]">
                      {[
                        { label: "Timer", value: `${t.estimatedHours} t` },
                        { label: "Timepris", value: `${t.hourlyRate} kr/t` },
                        { label: "Materialer", value: `${t.materialsCost.toLocaleString("da-DK")} kr` },
                        { label: "Total inkl. moms", value: `${t.totalIncVat.toLocaleString("da-DK")} kr` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] text-muted font-condensed uppercase tracking-widest">{label}</p>
                          <p className="text-cream font-bold">{value}</p>
                        </div>
                      ))}
                    </div>

                    {t.generatedText && (
                      <div>
                        <p className="text-[10px] text-muted font-condensed uppercase tracking-widest mb-2">Council tilbudstekst</p>
                        <pre className="whitespace-pre-wrap text-cream/80 bg-white/[.03] p-3 rounded-[2px] text-[12px] leading-relaxed border border-[rgba(242,238,230,.05)]">
                          {t.generatedText}
                        </pre>
                      </div>
                    )}

                    {t.councilNotes && (
                      <p className="text-[12px] text-yellow/80 italic">{t.councilNotes}</p>
                    )}

                    <div className="flex gap-2 flex-wrap pt-1">
                      {t.status === "draft" && t.clientEmail && (
                        <button
                          disabled={sending === t.id}
                          onClick={() => sendTilbud(t.id)}
                          className="bg-yellow text-black font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow/90 disabled:opacity-50"
                        >
                          {sending === t.id ? "Sender..." : "✉ Send til klient"}
                        </button>
                      )}
                      {t.status === "sent" && (
                        <>
                          <button onClick={() => updateStatus(t.id, "accepted")} className="bg-green-500/20 text-green-300 font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-green-500/30">
                            ✓ Accepteret
                          </button>
                          <button onClick={() => updateStatus(t.id, "rejected")} className="bg-red-500/20 text-red-300 font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-red-500/30">
                            ✗ Afvist
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
