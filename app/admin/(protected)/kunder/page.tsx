"use client";

import { useEffect, useState } from "react";
import type { Customer } from "@/lib/types";

const STATUS_LABELS: Record<Customer["status"], string> = {
  lead: "Lead",
  aktiv: "Aktiv",
  inaktiv: "Inaktiv",
};
const STATUS_COLORS: Record<Customer["status"], string> = {
  lead: "bg-blue-500/20 text-blue-300",
  aktiv: "bg-green-500/20 text-green-300",
  inaktiv: "bg-white/10 text-cream/50",
};

type FilterStatus = "alle" | Customer["status"];
type FilterType = "alle" | "privat" | "virksomhed";

export default function KunderPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("alle");
  const [typeFilter, setTypeFilter] = useState<FilterType>("alle");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [councilResult, setCouncilResult] = useState<Record<string, { councilAdvice: string; generatedEmail: string; approval: string; approved: boolean }>>({});
  const [councilLoading, setCouncilLoading] = useState<string | null>(null);

  // New customer form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "virksomhed" as "virksomhed" | "privat", name: "", company: "", email: "", phone: "", cvr: "", trade: "", notes: "" });
  const [formSaving, setFormSaving] = useState(false);

  const load = async () => {
    const r = await fetch("/api/admin/customers");
    if (r.ok) setCustomers(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const deleteCustomer = async (id: string) => {
    if (!confirm("Slet denne kunde?")) return;
    await fetch("/api/admin/customers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  };

  const updateStatus = async (id: string, status: Customer["status"]) => {
    await fetch("/api/admin/customers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    await load();
  };

  const runCouncil = async (customer: Customer) => {
    setCouncilLoading(customer.id);
    const r = await fetch("/api/admin/sarah/council-approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: customer.id, contactType: "customer", emailType: customer.status === "lead" ? "first_contact" : "followup" }),
    });
    const d = await r.json();
    if (d.ok) {
      setCouncilResult((prev) => ({ ...prev, [customer.id]: d }));
    }
    setCouncilLoading(null);
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setFormSaving(false);
    setShowForm(false);
    setForm({ type: "virksomhed", name: "", company: "", email: "", phone: "", cvr: "", trade: "", notes: "" });
    await load();
  };

  const filtered = customers.filter((c) => {
    if (statusFilter !== "alle" && c.status !== statusFilter) return false;
    if (typeFilter !== "alle" && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    leads: customers.filter((c) => c.status === "lead").length,
    aktive: customers.filter((c) => c.status === "aktiv").length,
    inaktive: customers.filter((c) => c.status === "inaktiv").length,
    virksomheder: customers.filter((c) => c.type === "virksomhed").length,
    private: customers.filter((c) => c.type === "privat").length,
  };

  const inp = "bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2.5 rounded-[2px] w-full font-condensed focus:outline-none focus:border-yellow/60 transition-colors";
  const lbl = "font-condensed font-semibold text-[10px] tracking-[.15em] uppercase text-muted mb-1.5 block";

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">CRM</p>
          <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[32px] uppercase tracking-[-.01em] text-cream leading-none">Kunder</h1>
          <p className="text-muted text-[13px] mt-2">Leads og kunder — importeret fra Excel eller oprettet manuelt</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-yellow text-black font-condensed font-black text-[11px] tracking-[.15em] uppercase px-5 py-2.5 rounded-[2px] hover:bg-yellow/90 transition-colors"
          >
            + Ny kunde
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2 gap-3 mb-8">
        {[
          { label: "Leads", value: stats.leads, color: "text-blue-300" },
          { label: "Aktive", value: stats.aktive, color: "text-green-300" },
          { label: "Inaktive", value: stats.inaktive, color: "text-muted" },
          { label: "Virksomheder", value: stats.virksomheder, color: "text-yellow" },
          { label: "Private", value: stats.private, color: "text-cream" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-black2 border border-[rgba(242,238,230,.06)] rounded-[2px] p-4">
            <p className={`font-condensed font-black text-[28px] leading-none ${color}`}>{value}</p>
            <p className="font-condensed text-[10px] tracking-[.15em] uppercase text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* New customer form */}
      {showForm && (
        <div className="bg-black2 border border-[rgba(242,238,230,.08)] rounded-[2px] p-6 mb-6">
          <p className="font-condensed font-black text-[12px] tracking-[.15em] uppercase text-cream mb-4">Ny kunde</p>
          <form onSubmit={createCustomer} className="grid grid-cols-2 max-[700px]:grid-cols-1 gap-4">
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "virksomhed" | "privat" })}>
                <option value="virksomhed">Virksomhed</option>
                <option value="privat">Privat</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Navn / Kontaktperson *</label>
              <input required className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kontaktperson" />
            </div>
            {form.type === "virksomhed" && (
              <div>
                <label className={lbl}>Firmanavn</label>
                <input className={inp} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Firma A/S" />
              </div>
            )}
            <div>
              <label className={lbl}>Email</label>
              <input type="email" className={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@firma.dk" />
            </div>
            <div>
              <label className={lbl}>Telefon</label>
              <input type="tel" className={inp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+45 42 77 88 66" />
            </div>
            {form.type === "virksomhed" && (
              <div>
                <label className={lbl}>CVR</label>
                <input className={inp} value={form.cvr} onChange={(e) => setForm({ ...form, cvr: e.target.value })} placeholder="12345678" />
              </div>
            )}
            <div>
              <label className={lbl}>Fag/Interesse</label>
              <input className={inp} value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="Tømrer, Murer..." />
            </div>
            <div className="col-span-2 max-[700px]:col-span-1">
              <label className={lbl}>Noter</label>
              <textarea rows={2} className={`${inp} resize-none`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-2 max-[700px]:col-span-1 flex gap-2">
              <button type="submit" disabled={formSaving} className="bg-yellow text-black font-condensed font-black text-[12px] tracking-[.15em] uppercase px-5 py-2.5 rounded-[2px] hover:bg-yellow/90 disabled:opacity-50">
                {formSaving ? "Gemmer..." : "Opret kunde"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted font-condensed text-[12px] tracking-[.12em] uppercase px-4 py-2.5 border border-[rgba(242,238,230,.1)] rounded-[2px] hover:text-cream">
                Annuller
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søg navn, firma, email..."
          className="bg-black border border-[rgba(242,238,230,.1)] text-cream text-[13px] px-3 py-2 rounded-[2px] w-[220px] font-condensed focus:outline-none focus:border-yellow/60"
        />
        {(["alle", "lead", "aktiv", "inaktiv"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`font-condensed font-bold text-[10px] tracking-[.12em] uppercase px-3 py-2 rounded-[2px] border transition-colors ${statusFilter === s ? "bg-yellow text-black border-yellow" : "text-muted border-[rgba(242,238,230,.1)] hover:text-cream"}`}>
            {s === "alle" ? "Alle" : STATUS_LABELS[s as Customer["status"]]}
          </button>
        ))}
        {(["alle", "virksomhed", "privat"] as const).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`font-condensed font-bold text-[10px] tracking-[.12em] uppercase px-3 py-2 rounded-[2px] border transition-colors ${typeFilter === t ? "bg-white/10 text-cream border-[rgba(242,238,230,.3)]" : "text-muted border-[rgba(242,238,230,.1)] hover:text-cream"}`}>
            {t === "alle" ? "Alle typer" : t === "virksomhed" ? "🏢 Virksomhed" : "👤 Privat"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted text-[13px]">Indlæser...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-[13px]">Ingen kunder matcher filteret.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((c) => (
            <div key={c.id}>
              <div
                className="flex items-center gap-3 p-4 rounded-[2px] border border-[rgba(242,238,230,.06)] bg-black2 hover:bg-white/[.02] cursor-pointer"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-condensed font-bold text-[13px] text-cream truncate">
                    {c.company ? `${c.company} — ` : ""}{c.name}
                  </p>
                  <p className="text-[11px] text-muted truncate">{c.email || c.phone || "Ingen kontaktinfo"}</p>
                </div>
                {c.trade && <span className="text-[11px] text-muted hidden min-[900px]:block">{c.trade}</span>}
                <span className={`text-[10px] font-condensed font-bold tracking-[.1em] uppercase px-2 py-0.5 rounded-[2px] shrink-0 ${c.type === "virksomhed" ? "bg-yellow/10 text-yellow" : "bg-white/5 text-cream/60"}`}>
                  {c.type}
                </span>
                <span className={`text-[10px] font-condensed font-bold tracking-[.1em] uppercase px-2 py-0.5 rounded-[2px] shrink-0 ${STATUS_COLORS[c.status]}`}>
                  {STATUS_LABELS[c.status]}
                </span>
                <p className="text-[11px] text-muted hidden min-[900px]:block whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString("da-DK")}
                </p>
                <button onClick={(e) => { e.stopPropagation(); deleteCustomer(c.id); }} className="text-[10px] text-muted hover:text-red-400 font-condensed uppercase tracking-widest transition-colors ml-1 shrink-0">
                  Slet
                </button>
              </div>

              {expandedId === c.id && (
                <div className="border border-t-0 border-[rgba(242,238,230,.06)] bg-black p-5 rounded-b-[2px] space-y-4">
                  {/* Info grid */}
                  <div className="grid grid-cols-3 max-[700px]:grid-cols-1 gap-3 text-[13px]">
                    {[
                      ["Kontakt", c.name],
                      c.company ? ["Firma", c.company] : null,
                      c.email ? ["Email", c.email] : null,
                      c.phone ? ["Telefon", c.phone] : null,
                      c.cvr ? ["CVR", c.cvr] : null,
                      c.trade ? ["Faginteresse", c.trade] : null,
                      c.source ? ["Kilde", c.source] : null,
                    ].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-muted font-condensed uppercase tracking-widest">{k}</p>
                        <p className="text-cream">{v}</p>
                      </div>
                    ))}
                  </div>

                  {c.notes && (
                    <p className="text-[13px] text-cream/70 italic border-l-2 border-yellow/30 pl-3">{c.notes}</p>
                  )}

                  {/* Status buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {(["lead", "aktiv", "inaktiv"] as const).filter((s) => s !== c.status).map((s) => (
                      <button key={s} onClick={() => updateStatus(c.id, s)}
                        className={`font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] ${STATUS_COLORS[s]} hover:opacity-90`}>
                        → {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>

                  {/* Council email generator */}
                  <div className="border-t border-[rgba(242,238,230,.06)] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-condensed font-bold text-[11px] tracking-[.15em] uppercase text-yellow">Council email</p>
                      <button
                        onClick={() => runCouncil(c)}
                        disabled={councilLoading === c.id}
                        className="bg-yellow/10 text-yellow border border-yellow/30 font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow/20 disabled:opacity-50 transition-colors"
                      >
                        {councilLoading === c.id ? "Council tænker..." : "⚡ Generer email"}
                      </button>
                    </div>

                    {councilResult[c.id] && (
                      <div className="space-y-3">
                        <div className="bg-white/[.03] border border-[rgba(242,238,230,.05)] rounded-[2px] p-3">
                          <p className="text-[10px] text-muted font-condensed uppercase tracking-widest mb-1">Council råd</p>
                          <p className="text-[12px] text-cream/80 italic">{councilResult[c.id].councilAdvice}</p>
                        </div>
                        <div className="bg-white/[.03] border border-[rgba(242,238,230,.05)] rounded-[2px] p-3">
                          <p className="text-[10px] text-muted font-condensed uppercase tracking-widest mb-1">Genereret email</p>
                          <pre className="whitespace-pre-wrap text-[12px] text-cream/90 leading-relaxed">{councilResult[c.id].generatedEmail}</pre>
                        </div>
                        <div className={`p-2 rounded-[2px] text-[12px] font-condensed ${councilResult[c.id].approved ? "bg-green-500/10 text-green-300" : "bg-amber-400/10 text-amber-300"}`}>
                          {councilResult[c.id].approval}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
