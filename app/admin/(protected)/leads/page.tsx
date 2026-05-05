"use client";

import { useState, useEffect, useRef } from "react";
import type { Lead, LeadStatus, LeadType } from "@/lib/types";

const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  company: "🏢 Virksomheder",
  private: "🏠 Private",
  employee: "👷 Medarbejdere",
};

const LEAD_TYPE_COLORS: Record<LeadType, string> = {
  company: "text-blue-300 border-[rgba(96,165,250,.3)] bg-[rgba(96,165,250,.08)]",
  private: "text-green-300 border-[rgba(74,222,128,.3)] bg-[rgba(74,222,128,.08)]",
  employee: "text-yellow border-[rgba(245,196,0,.3)] bg-[rgba(245,196,0,.08)]",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  New:           "bg-[rgba(242,238,230,.08)] text-muted border-[rgba(242,238,230,.15)]",
  Analyzed:      "bg-[rgba(96,165,250,.1)] text-blue-300 border-[rgba(96,165,250,.3)]",
  Drafted:       "bg-[rgba(251,146,60,.1)] text-orange-300 border-[rgba(251,146,60,.3)]",
  Approved:      "bg-[rgba(74,222,128,.1)] text-green-300 border-[rgba(74,222,128,.3)]",
  Sent:          "bg-[rgba(34,197,94,.08)] text-green-400 border-[rgba(34,197,94,.2)]",
  Rejected:      "bg-[rgba(248,113,113,.1)] text-red-300 border-[rgba(248,113,113,.3)]",
  "Needs Review":"bg-[rgba(245,196,0,.1)] text-yellow border-[rgba(245,196,0,.3)]",
};

const STATUS_DA: Record<LeadStatus, string> = {
  New: "Ny", Analyzed: "Analyseret", Drafted: "Udkast", Approved: "Godkendt",
  Sent: "Sendt", Rejected: "Afvist", "Needs Review": "Til review",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | LeadType>("all");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ requiresConfirmation: boolean; preview?: Record<string, string>[]; totalRows?: number; autoMapping?: Record<string, string>; headers?: string[] } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail panel edit state
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editing, setEditing] = useState(false);

  async function fetchLeads() {
    try {
      const r = await fetch("/api/admin/leads/upload");
      const d = await r.json();
      setLeads(d.leads || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find((l) => l.id === selectedLead.id);
      if (updated) {
        setSelectedLead(updated);
        setEditSubject(updated.draftSubject || "");
        setEditBody(updated.draftBody || "");
      }
    }
  }, [leads]);

  async function handleUploadFile(f: File) {
    setFile(f);
    setUploadResult(null);
    setUploadLoading(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await fetch("/api/admin/leads/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.requiresConfirmation) {
        setPreview(d);
      } else if (d.ok) {
        setUploadResult(`✓ ${d.imported} leads importeret, ${d.skipped} dubletter sprunget over`);
        await fetchLeads();
        setPreview(null);
      } else {
        setUploadResult(`Fejl: ${d.error}`);
      }
    } catch {
      setUploadResult("Fejl under upload");
    }
    setUploadLoading(false);
  }

  async function confirmImport() {
    if (!file || !preview?.autoMapping) return;
    setUploadLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapping", JSON.stringify(preview.autoMapping));
    try {
      const r = await fetch("/api/admin/leads/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) {
        setUploadResult(`✓ ${d.imported} leads importeret, ${d.skipped} dubletter sprunget over`);
        await fetchLeads();
        setPreview(null);
        setFile(null);
      } else {
        setUploadResult(`Fejl: ${d.error}`);
      }
    } catch {
      setUploadResult("Fejl under import");
    }
    setUploadLoading(false);
  }

  async function runCouncil(leadId: string) {
    setActionLoading(leadId + "-council");
    try {
      const r = await fetch("/api/admin/leads/council", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId }) });
      const d = await r.json();
      if (!d.ok) alert(d.error || "Council fejlede");
      await fetchLeads();
    } catch { alert("Fejl"); }
    setActionLoading(null);
  }

  async function runSarah(leadId: string, regenerate = false) {
    setActionLoading(leadId + "-sarah");
    try {
      const r = await fetch("/api/admin/leads/sarah", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, regenerate }) });
      const d = await r.json();
      if (!d.ok) alert(d.error || "Sarah fejlede");
      await fetchLeads();
    } catch { alert("Fejl"); }
    setActionLoading(null);
  }

  async function patchLead(leadId: string, action: string, extras?: Record<string, string>) {
    setActionLoading(leadId + "-" + action);
    try {
      await fetch("/api/admin/leads/sarah", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, action, ...extras }) });
      await fetchLeads();
    } catch {}
    setActionLoading(null);
  }

  async function runBatchCouncil() {
    setActionLoading("batch-council");
    const r = await fetch("/api/admin/leads/council", { method: "PUT" });
    const d = await r.json();
    alert(`Council analyserede ${d.analyzed} leads`);
    await fetchLeads();
    setActionLoading(null);
  }

  async function runBatchSarah() {
    setActionLoading("batch-sarah");
    const analyzed = leads.filter((l) => l.status === "Analyzed");
    for (const lead of analyzed.slice(0, 10)) {
      await fetch("/api/admin/leads/sarah", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
    }
    await fetchLeads();
    setActionLoading(null);
  }

  async function sendApproved() {
    setActionLoading("batch-send");
    const approved = leads.filter((l) => l.status === "Approved" && l.email && l.draftBody);
    let sent = 0;
    for (const lead of approved.slice(0, 20)) {
      try {
        const r = await fetch("/api/admin/leads/sarah", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id, action: "send" }) });
        const d = await r.json();
        if (d.ok) sent++;
      } catch {}
    }
    await fetchLeads();
    setActionLoading(null);
    alert(`${sent} emails sendt!`);
  }

  // Filter leads baseret på aktiv tab
  const filteredLeads = activeTab === "all"
    ? leads
    : leads.filter((l) => (l.leadType || "company") === activeTab);

  const tabCounts: Record<"all" | LeadType, number> = {
    all: leads.length,
    company: leads.filter((l) => (l.leadType || "company") === "company").length,
    private: leads.filter((l) => l.leadType === "private").length,
    employee: leads.filter((l) => l.leadType === "employee").length,
  };

  const stats = {
    New: filteredLeads.filter((l) => l.status === "New").length,
    Analyzed: filteredLeads.filter((l) => l.status === "Analyzed").length,
    Drafted: filteredLeads.filter((l) => l.status === "Drafted").length,
    Approved: filteredLeads.filter((l) => l.status === "Approved").length,
    Sent: filteredLeads.filter((l) => l.status === "Sent").length,
  };

  const btnClass = "font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-3 py-[6px] rounded-[2px] border transition-colors disabled:opacity-40";

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-condensed font-semibold text-[10px] tracking-[.22em] uppercase text-yellow mb-1">Sarah & Council</p>
          <h1 className="font-condensed font-black text-[32px] uppercase leading-[.95] tracking-[-.01em] text-cream">Leads</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setUploadOpen(true); setPreview(null); setUploadResult(null); setFile(null); }}
            className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-5 py-3 hover:bg-yellow2 transition-colors"
          >
            Upload Excel
          </button>
          <button
            onClick={runBatchCouncil}
            disabled={actionLoading === "batch-council" || stats.New === 0}
            className={`${btnClass} border-[rgba(96,165,250,.3)] text-blue-300 hover:border-blue-300`}
          >
            {actionLoading === "batch-council" ? "Analyserer..." : `Council alle (${stats.New} nye)`}
          </button>
          <button
            onClick={runBatchSarah}
            disabled={actionLoading === "batch-sarah" || stats.Analyzed === 0}
            className={`${btnClass} border-[rgba(251,146,60,.3)] text-orange-300 hover:border-orange-300`}
          >
            {actionLoading === "batch-sarah" ? "Skriver..." : `Sarah alle (${stats.Analyzed} analyseret)`}
          </button>
          <button
            onClick={sendApproved}
            disabled={actionLoading === "batch-send" || stats.Approved === 0}
            className={`${btnClass} border-[rgba(34,197,94,.3)] text-green-300 hover:border-green-300`}
          >
            {actionLoading === "batch-send" ? "Sender..." : `Send alle (${stats.Approved} godkendt)`}
          </button>
        </div>
      </div>

      {/* Type-tabs */}
      <div className="flex gap-1 mb-6 border-b border-[rgba(242,238,230,0.07)] pb-0">
        {(["all", "company", "private", "employee"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-[10px] border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-yellow text-yellow"
                : "border-transparent text-muted hover:text-cream"
            }`}
          >
            {tab === "all" ? "Alle" : LEAD_TYPE_LABELS[tab]} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8 max-[900px]:grid-cols-3">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="bg-gray border border-[rgba(242,238,230,0.07)] p-4 rounded-[2px]">
            <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-1">{STATUS_DA[k as LeadStatus] || k}</p>
            <p className="font-condensed font-black text-[28px] text-cream">{v}</p>
          </div>
        ))}
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,12,10,.85)" }}>
          <div className="bg-gray border border-[rgba(242,238,230,0.1)] rounded-[2px] w-full max-w-[640px] p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-condensed font-black text-[20px] uppercase text-cream">Upload Excel</h2>
              <button onClick={() => setUploadOpen(false)} className="text-muted hover:text-cream text-[20px] leading-none">✕</button>
            </div>

            {!preview && (
              <div
                className="border-2 border-dashed border-[rgba(242,238,230,.15)] rounded-[2px] p-12 text-center cursor-pointer hover:border-yellow transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUploadFile(f); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-muted text-[14px] mb-2">Træk .xlsx eller .csv fil hertil</p>
                <p className="text-[12px] text-muted opacity-60">eller klik for at vælge</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} />
              </div>
            )}

            {uploadLoading && <p className="text-muted text-[13px] mt-4 text-center">Behandler fil...</p>}

            {preview?.requiresConfirmation && (
              <div className="mt-4">
                <p className="text-cream text-[13px] mb-3">
                  <span className="text-yellow font-bold">{preview.totalRows} rækker</span> fundet i <span className="text-cream">{file?.name}</span>. Bekræft auto-mapping:
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[rgba(242,238,230,0.07)]">
                        {["Virksomhed", "Kontakt", "Email", "Telefon", "Branche"].map((h) => (
                          <th key={h} className="text-left text-muted font-condensed tracking-[.12em] uppercase py-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview?.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-[rgba(242,238,230,0.04)]">
                          <td className="py-2 pr-4 text-cream">{row.companyName || "–"}</td>
                          <td className="py-2 pr-4 text-cream">{row.contactName || "–"}</td>
                          <td className="py-2 pr-4 text-muted">{row.email || "–"}</td>
                          <td className="py-2 pr-4 text-muted">{row.phone || "–"}</td>
                          <td className="py-2 text-muted">{row.industry || "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  <button onClick={confirmImport} disabled={uploadLoading} className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-6 py-3 hover:bg-yellow2 transition-colors disabled:opacity-50">
                    {uploadLoading ? "Importerer..." : `Importer ${preview.totalRows} leads`}
                  </button>
                  <button onClick={() => { setPreview(null); setFile(null); }} className="border border-[rgba(242,238,230,.15)] text-muted font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-3 hover:text-cream transition-colors">
                    Annuller
                  </button>
                </div>
              </div>
            )}

            {uploadResult && (
              <div className={`mt-4 p-4 rounded-[2px] border text-[13px] ${uploadResult.startsWith("✓") ? "border-green-400/30 bg-green-400/5 text-green-300" : "border-red-400/30 bg-red-400/5 text-red-300"}`}>
                {uploadResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leads table */}
      {loading ? (
        <div className="text-center text-muted py-20 font-condensed uppercase tracking-[.12em]">Henter leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-20 bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          <p className="text-muted font-condensed text-[14px] mb-3">Ingen leads i denne kategori</p>
          <button onClick={() => setUploadOpen(true)} className="text-yellow font-condensed font-bold text-[12px] tracking-[.1em] uppercase hover:underline">Upload Excel →</button>
        </div>
      ) : (
        <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[rgba(242,238,230,0.07)]">
                {["Type", "Virksomhed/Navn", "Kontakt", "Email", "Budget", "Score", "Status", "Handlinger"].map((h) => (
                  <th key={h} className="text-left font-condensed font-semibold text-[10px] tracking-[.18em] uppercase text-muted px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const isLoading = (s: string) => actionLoading === lead.id + "-" + s;
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-[rgba(242,238,230,0.04)] hover:bg-[rgba(242,238,230,.02)] cursor-pointer"
                    onClick={() => { setSelectedLead(lead); setEditSubject(lead.draftSubject || ""); setEditBody(lead.draftBody || ""); setEditing(false); }}
                  >
                    <td className="px-4 py-3">
                      {lead.leadType ? (
                        <span className={`inline-block font-condensed font-bold text-[9px] tracking-[.1em] uppercase px-[6px] py-[2px] rounded-[2px] border ${LEAD_TYPE_COLORS[lead.leadType]}`}>
                          {lead.leadType === "company" ? "🏢" : lead.leadType === "private" ? "🏠" : "👷"}
                        </span>
                      ) : <span className="text-muted text-[11px]">🏢</span>}
                    </td>
                    <td className="px-4 py-3 text-cream font-semibold max-w-[180px] truncate">{lead.companyName}</td>
                    <td className="px-4 py-3 text-muted text-[12px]">
                      {lead.contactName || "–"}
                      {lead.contactTitle && <span className="block text-[10px] text-muted opacity-60">{lead.contactTitle}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted truncate max-w-[140px] text-[12px]">{lead.email || "–"}</td>
                    <td className="px-4 py-3 text-muted text-[12px]">{lead.budget || "–"}</td>
                    <td className="px-4 py-3">
                      {lead.councilScore ? (
                        <span className={`font-condensed font-black text-[16px] ${lead.councilScore >= 7 ? "text-green-300" : lead.councilScore >= 4 ? "text-yellow" : "text-red-300"}`}>
                          {lead.councilScore}
                        </span>
                      ) : <span className="text-muted">–</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block font-condensed font-bold text-[10px] tracking-[.1em] uppercase px-[8px] py-[3px] rounded-[2px] border ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_DA[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => runCouncil(lead.id)}
                          disabled={!!actionLoading}
                          title="Council analyse"
                          className="text-blue-300 hover:text-blue-200 border border-[rgba(96,165,250,.2)] hover:border-blue-300 font-condensed text-[10px] tracking-[.1em] uppercase px-2 py-[4px] transition-colors disabled:opacity-30"
                        >
                          {isLoading("council") ? "..." : "Council ▶"}
                        </button>
                        <button
                          onClick={() => runSarah(lead.id, !!lead.draftBody)}
                          disabled={!!actionLoading || !lead.councilAnalysis}
                          title="Sarah skriver udkast"
                          className="text-orange-300 hover:text-orange-200 border border-[rgba(251,146,60,.2)] hover:border-orange-300 font-condensed text-[10px] tracking-[.1em] uppercase px-2 py-[4px] transition-colors disabled:opacity-30"
                        >
                          {isLoading("sarah") ? "..." : "Sarah ✍"}
                        </button>
                        {lead.status === "Drafted" && (
                          <button
                            onClick={() => patchLead(lead.id, "approve")}
                            disabled={!!actionLoading}
                            title="Godkend"
                            className="text-green-300 hover:text-green-200 border border-[rgba(74,222,128,.2)] hover:border-green-300 font-condensed text-[10px] uppercase px-2 py-[4px] transition-colors disabled:opacity-30"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => patchLead(lead.id, "reject")}
                          disabled={!!actionLoading}
                          title="Afvis"
                          className="text-red-300 hover:text-red-200 border border-[rgba(248,113,113,.2)] hover:border-red-300 font-condensed text-[10px] uppercase px-2 py-[4px] transition-colors disabled:opacity-30"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(12,12,10,.6)" }} onClick={() => setSelectedLead(null)}>
          <div
            className="bg-black2 border-l border-[rgba(242,238,230,0.08)] w-full max-w-[560px] h-full overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className={`inline-block font-condensed font-bold text-[10px] tracking-[.1em] uppercase px-[8px] py-[3px] rounded-[2px] border mb-2 ${STATUS_COLORS[selectedLead.status]}`}>
                  {STATUS_DA[selectedLead.status]}
                </span>
                <h2 className="font-condensed font-black text-[22px] uppercase text-cream leading-tight">{selectedLead.companyName}</h2>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-muted hover:text-cream text-[22px] leading-none flex-shrink-0 ml-4">✕</button>
            </div>

            {/* Lead info */}
            <section className="mb-6 p-5 bg-gray rounded-[2px] border border-[rgba(242,238,230,0.07)]">
              <div className="flex items-center gap-3 mb-3">
                <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted">Lead info</p>
                {selectedLead.leadType && (
                  <span className={`font-condensed font-bold text-[9px] tracking-[.1em] uppercase px-[7px] py-[3px] rounded-[2px] border ${LEAD_TYPE_COLORS[selectedLead.leadType]}`}>
                    {LEAD_TYPE_LABELS[selectedLead.leadType]}
                  </span>
                )}
              </div>
              {[
                ["Kontakt", selectedLead.contactName ? `${selectedLead.contactName}${selectedLead.contactTitle ? ` — ${selectedLead.contactTitle}` : ""}` : null],
                ["Email", selectedLead.email],
                ["Telefon", selectedLead.phone],
                ["Branche", selectedLead.industry],
                ["By", selectedLead.city],
                ["Website", selectedLead.website],
                ["Service", selectedLead.serviceType],
                ["Budget", selectedLead.budget],
                ["Vinkel", selectedLead.personalAngle],
                ["Noter", selectedLead.notes],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex gap-3 mb-2">
                  <span className="font-condensed text-[11px] tracking-[.1em] uppercase text-muted w-[80px] flex-shrink-0">{k}</span>
                  <span className="text-cream text-[13px] break-all">{v}</span>
                </div>
              ))}
            </section>

            {/* Council analyse */}
            {selectedLead.councilAnalysis && (
              <section className="mb-6 p-5 bg-gray rounded-[2px] border border-[rgba(96,165,250,.15)]">
                <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-blue-300 mb-4">Council analyse</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-condensed font-black text-[24px] border-2 ${selectedLead.councilScore! >= 7 ? "border-green-300 text-green-300" : selectedLead.councilScore! >= 4 ? "border-yellow text-yellow" : "border-red-300 text-red-300"}`}>
                    {selectedLead.councilScore}
                  </div>
                  <div>
                    <p className="text-cream font-condensed font-bold text-[14px] uppercase">{selectedLead.councilAnalysis.customerType}</p>
                    <p className="text-muted text-[12px]">Tone: {selectedLead.councilAnalysis.tone}</p>
                  </div>
                </div>
                {[
                  ["Anbefalet vinkel", selectedLead.councilAnalysis.recommendedAngle],
                  ["Salgsråd", selectedLead.councilAnalysis.salesAdvice],
                  ["Brandråd", selectedLead.councilAnalysis.brandAdvice],
                  ["Driftsråd", selectedLead.councilAnalysis.operationsAdvice],
                  ["Finansråd", selectedLead.councilAnalysis.financeAdvice],
                ].map(([k, v]) => (
                  <div key={k} className="mb-3">
                    <p className="font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">{k}</p>
                    <p className="text-cream text-[13px] leading-[1.6]">{v}</p>
                  </div>
                ))}
                {selectedLead.councilAnalysis.risks.length > 0 && (
                  <div className="mb-3">
                    <p className="font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-2">Risici</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.councilAnalysis.risks.map((r) => (
                        <span key={r} className="text-[11px] text-red-300 bg-red-400/10 border border-red-400/20 px-2 py-[2px] rounded-[2px]">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 p-3 bg-[rgba(96,165,250,.06)] border border-[rgba(96,165,250,.2)] rounded-[2px]">
                  <p className="font-condensed text-[10px] tracking-[.15em] uppercase text-blue-300 mb-1">Endelig anbefaling</p>
                  <p className="text-cream text-[13px] leading-[1.6]">{selectedLead.councilAnalysis.finalRecommendation}</p>
                </div>

                {/* Sarah-briefing fra Council */}
                {selectedLead.councilAnalysis.sarahBriefing && (
                  <div className="mt-4 p-3 bg-[rgba(245,196,0,.06)] border border-yellow/30 rounded-[2px]">
                    <p className="font-condensed text-[10px] tracking-[.15em] uppercase text-yellow mb-3">Sarah-briefing fra Council</p>
                    <div className="mb-3">
                      <p className="font-condensed text-[10px] tracking-[.12em] uppercase text-muted mb-1">Åbningslinje</p>
                      <p className="text-cream text-[13px] italic">&ldquo;{selectedLead.councilAnalysis.sarahBriefing.openingLine}&rdquo;</p>
                    </div>
                    <div className="mb-3">
                      <p className="font-condensed text-[10px] tracking-[.12em] uppercase text-muted mb-1">Pain points</p>
                      <ul className="text-cream text-[13px] leading-[1.6] list-disc list-inside">
                        {selectedLead.councilAnalysis.sarahBriefing.painPoints.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    <div className="mb-3">
                      <p className="font-condensed text-[10px] tracking-[.12em] uppercase text-muted mb-1">Fokus-ydelser</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.councilAnalysis.sarahBriefing.keyServices.map((s) => (
                          <span key={s} className="text-[11px] text-yellow bg-yellow/10 border border-yellow/30 px-2 py-[2px] rounded-[2px]">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="font-condensed text-[10px] tracking-[.12em] uppercase text-muted mb-1">Emne-forslag</p>
                      <ul className="text-cream text-[13px] leading-[1.5]">
                        {selectedLead.councilAnalysis.sarahBriefing.subjectOptions.map((s, i) => <li key={i}>· {s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="font-condensed text-[10px] tracking-[.12em] uppercase text-muted mb-1">Call to action</p>
                      <p className="text-cream text-[13px] font-bold">{selectedLead.councilAnalysis.sarahBriefing.callToAction}</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Sarah udkast */}
            {selectedLead.draftBody && (
              <section className="mb-6 p-5 bg-gray rounded-[2px] border border-[rgba(251,146,60,.2)]">
                <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-orange-300 mb-4">Sarah&apos;s udkast</p>
                <div className="mb-3 p-2 bg-[rgba(245,196,0,.06)] border border-yellow/20 rounded-[2px]">
                  <p className="text-yellow text-[11px] font-condensed">⚠ Sarah sender IKKE automatisk — du skal godkende først</p>
                </div>

                {editing ? (
                  <>
                    <div className="mb-3">
                      <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-2">Emne</label>
                      <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow" />
                    </div>
                    <div className="mb-4">
                      <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-2">Besked</label>
                      <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={10} className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow resize-y" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { patchLead(selectedLead.id, "edit", { editedSubject: editSubject, editedBody: editBody }); setEditing(false); }} className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-5 py-2 hover:bg-yellow2 transition-colors">Gem ændringer</button>
                      <button onClick={() => setEditing(false)} className="border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[12px] uppercase px-4 py-2 hover:text-cream transition-colors">Annuller</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <p className="font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Emne</p>
                      <p className="text-cream text-[14px] font-semibold">{selectedLead.draftSubject}</p>
                    </div>
                    <div className="mb-4">
                      <p className="font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Besked</p>
                      <p className="text-cream text-[13px] leading-[1.7] whitespace-pre-wrap">{selectedLead.draftBody}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedLead.status === "Drafted" || selectedLead.status === "Needs Review") && (
                        <button onClick={() => patchLead(selectedLead.id, "approve")} disabled={!!actionLoading} className="bg-[rgba(74,222,128,.15)] text-green-300 border border-green-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-2 hover:bg-[rgba(74,222,128,.25)] transition-colors disabled:opacity-40">
                          Godkend ✓
                        </button>
                      )}
                      {selectedLead.status === "Approved" && selectedLead.email && (
                        <button onClick={() => patchLead(selectedLead.id, "send")} disabled={!!actionLoading} className="bg-[rgba(34,197,94,.15)] text-green-300 border border-green-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-2 hover:bg-[rgba(34,197,94,.25)] transition-colors disabled:opacity-40">
                          {actionLoading === selectedLead.id + "-send" ? "Sender..." : "Send ✉"}
                        </button>
                      )}
                      <button onClick={() => runSarah(selectedLead.id, true)} disabled={!!actionLoading} className="border border-[rgba(251,146,60,.3)] text-orange-300 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-4 py-2 hover:border-orange-300 transition-colors disabled:opacity-40">
                        {actionLoading === selectedLead.id + "-sarah" ? "Genererer..." : "Regenerer"}
                      </button>
                      <button onClick={() => setEditing(true)} className="border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[12px] uppercase px-4 py-2 hover:text-cream transition-colors">
                        Rediger
                      </button>
                      <button onClick={() => patchLead(selectedLead.id, "reject")} disabled={!!actionLoading} className="border border-red-400/20 text-red-300 font-condensed font-bold text-[12px] uppercase px-4 py-2 hover:border-red-300 transition-colors disabled:opacity-40">
                        Afvis
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {!selectedLead.councilAnalysis && (
                <button onClick={() => runCouncil(selectedLead.id)} disabled={!!actionLoading} className="bg-[rgba(96,165,250,.12)] text-blue-300 border border-blue-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-2 hover:bg-[rgba(96,165,250,.2)] transition-colors disabled:opacity-40">
                  {actionLoading === selectedLead.id + "-council" ? "Analyserer..." : "Kør Council ▶"}
                </button>
              )}
              {selectedLead.councilAnalysis && !selectedLead.draftBody && (
                <button onClick={() => runSarah(selectedLead.id)} disabled={!!actionLoading} className="bg-[rgba(251,146,60,.12)] text-orange-300 border border-orange-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-2 hover:bg-[rgba(251,146,60,.2)] transition-colors disabled:opacity-40">
                  {actionLoading === selectedLead.id + "-sarah" ? "Skriver..." : "Skriv udkast (Sarah) ✍"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
