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
  Incomplete:    "bg-[rgba(148,163,184,.1)] text-slate-400 border-[rgba(148,163,184,.3)]",
};

const STATUS_DA: Record<LeadStatus, string> = {
  New: "Ny", Analyzed: "Analyseret", Drafted: "Udkast", Approved: "Godkendt",
  Sent: "Sendt", Rejected: "Afvist", "Needs Review": "Til review",
  Incomplete: "Ufuldstændig",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | LeadType | "warm">("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ requiresConfirmation: boolean; preview?: Record<string, string>[]; totalRows?: number; autoMapping?: Record<string, string>; headers?: string[] } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail panel — Sarah draft edit
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Lead-info edit state
  const [editingLead, setEditingLead] = useState(false);
  const [leadEdit, setLeadEdit] = useState<{
    companyName: string; email: string; phone: string; contactName: string;
    contactTitle: string; website: string; city: string; industry: string;
    serviceType: string; budget: string; notes: string; personalAngle: string;
  } | null>(null);

  // Manuel opret lead
  const emptyNewLead = {
    companyName: "", email: "", phone: "", contactName: "", contactTitle: "",
    website: "", city: "", industry: "", serviceType: "", budget: "",
    notes: "", personalAngle: "", leadType: "company" as LeadType,
  };
  const [creatingLead, setCreatingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState(emptyNewLead);
  const [createError, setCreateError] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Find emails for leads der mangler email (boligforeninger osv.)
  const [enrichResult, setEnrichResult] = useState<{ enriched: number; guessed: number; failed: number; remaining: number; hasHunter: boolean; hasApollo: boolean } | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  // Bulk-firma-søgning (paste navne, få info hentet)
  const [bulkSearchOpen, setBulkSearchOpen] = useState(false);
  const [bulkSearchInput, setBulkSearchInput] = useState("");
  const [bulkSearchType, setBulkSearchType] = useState<LeadType>("company");
  const [bulkSearchService, setBulkSearchService] = useState("");
  const [bulkSearchLoading, setBulkSearchLoading] = useState(false);
  const [bulkSearchResult, setBulkSearchResult] = useState<{ added: number; withEmail: number; withoutEmail: number; failed: number; skipped: number } | null>(null);

  async function runBulkSearch() {
    const names = bulkSearchInput.split(/[\n,;]/).map((s) => s.trim()).filter((s) => s.length >= 3);
    if (names.length === 0) { alert("Indtast firmanavne (én pr. linje eller komma-adskilt)"); return; }
    if (names.length > 50) { alert("Max 50 firmanavne pr. søgning"); return; }
    if (!confirm(`Søg efter ${names.length} firmaer? Tager ~${Math.ceil(names.length * 2 / 60)} minut${names.length > 30 ? "ter" : ""}.`)) return;

    setBulkSearchLoading(true);
    setBulkSearchResult(null);
    try {
      const r = await fetch("/api/admin/leads/bulk-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names, leadType: bulkSearchType, serviceType: bulkSearchService || undefined }),
      });
      const d = await r.json();
      if (d.ok) {
        setBulkSearchResult({ added: d.added, withEmail: d.withEmail, withoutEmail: d.withoutEmail, failed: d.failed, skipped: d.skipped });
        await fetchLeads();
        setBulkSearchInput("");
      } else {
        alert(`Fejl: ${d.error}`);
      }
    } catch {
      alert("Netværksfejl");
    }
    setBulkSearchLoading(false);
  }

  async function enrichEmails() {
    const noEmail = leads.filter((l) => !l.email && l.status === "New");
    if (noEmail.length === 0) { alert("Alle New leads har allerede email"); return; }
    if (!confirm(`Find emails for ${Math.min(noEmail.length, 30)} leads uden email? Tager 2-5 minutter.`)) return;
    setEnrichLoading(true);
    setEnrichResult(null);
    try {
      const r = await fetch("/api/admin/leads/enrich-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const d = await r.json();
      if (d.ok) {
        setEnrichResult({ enriched: d.enriched, guessed: d.guessed, failed: d.failed, remaining: d.remaining, hasHunter: d.hasHunter, hasApollo: d.hasApollo });
        await fetchLeads();
      } else {
        alert(`Fejl: ${d.error}`);
      }
    } catch {
      alert("Netværksfejl");
    }
    setEnrichLoading(false);
  }

  // Konverter employee-lead → medarbejder i medarbejder-databasen
  async function convertToEmployee(leadId: string) {
    if (!confirm("Konverter dette lead til medarbejder? De får status 'Afventer bekræftelse' indtil kontrakt accepteres.")) return;
    setActionLoading(leadId + "-convert");
    try {
      const r = await fetch("/api/admin/employees/from-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const d = await r.json();
      if (d.ok) {
        alert(`✓ ${d.employee.name} oprettet som medarbejder. Send dem /tilmeld link så de kan acceptere kontrakten.`);
        await fetchLeads();
      } else {
        alert(`Fejl: ${d.error}`);
      }
    } catch {
      alert("Netværksfejl");
    }
    setActionLoading(null);
  }

  function openLeadEdit(lead: Lead) {
    setLeadEdit({
      companyName: lead.companyName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      contactName: lead.contactName || "",
      contactTitle: lead.contactTitle || "",
      website: lead.website || "",
      city: lead.city || "",
      industry: lead.industry || "",
      serviceType: lead.serviceType || "",
      budget: lead.budget || "",
      notes: lead.notes || "",
      personalAngle: lead.personalAngle || "",
    });
    setEditingLead(true);
  }

  async function saveLeadEdit() {
    if (!selectedLead || !leadEdit) return;
    setActionLoading("lead-edit");
    try {
      await fetch("/api/admin/leads/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLead.id, ...leadEdit }),
      });
      await fetchLeads();
      setEditingLead(false);
    } catch {}
    setActionLoading(null);
  }

  async function createLead() {
    if (!newLeadForm.companyName.trim()) { setCreateError("Firmanavn er påkrævet"); return; }
    setCreateError(null);
    setActionLoading("create-lead");
    try {
      const r = await fetch("/api/admin/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeadForm),
      });
      const d = await r.json();
      if (!d.ok) { setCreateError(d.error || "Oprettelse fejlede"); }
      else {
        await fetchLeads();
        setCreatingLead(false);
        setNewLeadForm(emptyNewLead);
        // Vælg det nye lead i detaljepanelet
        if (d.lead) setSelectedLead(d.lead);
      }
    } catch { setCreateError("Netværksfejl"); }
    setActionLoading(null);
  }

  async function runFollowUp(leadId: string) {
    setActionLoading(leadId + "-followup");
    try {
      const r = await fetch("/api/admin/leads/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const d = await r.json();
      if (!d.ok) alert(d.error || "Opfølgning fejlede");
      else {
        const stepLabel = d.step === 1 ? "#1 (dag 5)" : "#2 (dag 14)";
        alert(`✓ Opfølgning ${stepLabel} sendt af Sarah!\n\nEmne: ${d.subject}`);
      }
      await fetchLeads();
    } catch { alert("Netværksfejl"); }
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

  // Helper: bestemmer hvornår leadet sidst blev kontaktet (sortering)
  const lastTouch = (l: Lead): string => {
    return l.followUp2SentAt || l.followUp1SentAt || l.sentAt || l.createdAt;
  };

  // Varme leads: status=Sent, har telefonnummer, sendt for >2 dage siden — klar til opkald
  const isWarm = (l: Lead): boolean => {
    if (l.status !== "Sent") return false;
    if (!l.phone || l.phone.trim().length < 6) return false;
    if (!l.sentAt) return false;
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    return l.sentAt <= twoDaysAgo;
  };

  // Filter leads baseret på aktiv tab + statusFilter
  let filteredLeads = leads
    .filter((l) => {
      if (activeTab === "all") return true;
      if (activeTab === "warm") return isWarm(l);
      return (l.leadType || "company") === activeTab;
    })
    .filter((l) => statusFilter === "all" || l.status === statusFilter);

  // Varme leads sorteres med åbnede + senest kontaktede øverst
  if (activeTab === "warm") {
    filteredLeads = [...filteredLeads].sort((a, b) => {
      // Åbnede emails først
      if (a.emailOpened && !b.emailOpened) return -1;
      if (!a.emailOpened && b.emailOpened) return 1;
      // Derefter senest kontaktede
      return lastTouch(b).localeCompare(lastTouch(a));
    });
  }

  const tabCounts: Record<"all" | LeadType | "warm", number> = {
    all: leads.length,
    company: leads.filter((l) => (l.leadType || "company") === "company").length,
    private: leads.filter((l) => l.leadType === "private").length,
    employee: leads.filter((l) => l.leadType === "employee").length,
    warm: leads.filter(isWarm).length,
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
            onClick={() => { setCreatingLead(true); setCreateError(null); setNewLeadForm(emptyNewLead); }}
            className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-5 py-3 hover:bg-yellow2 transition-colors"
          >
            + Tilføj lead
          </button>
          <button
            onClick={() => { setUploadOpen(true); setPreview(null); setUploadResult(null); setFile(null); }}
            className="border border-[rgba(242,238,230,.2)] text-cream font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-5 py-3 hover:border-yellow hover:text-yellow transition-colors"
          >
            Upload Excel
          </button>
          <button
            onClick={() => { setBulkSearchOpen(true); setBulkSearchResult(null); }}
            className="border border-yellow/40 text-yellow font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-5 py-3 hover:bg-yellow/10 transition-colors"
          >
            🔍 Bulk-søg firmaer
          </button>
          <button
            onClick={enrichEmails}
            disabled={enrichLoading}
            title="Forsøg at finde emails for leads der mangler en"
            className={`${btnClass} border-purple-400/40 text-purple-300 hover:border-purple-300`}
          >
            {enrichLoading ? "Søger emails..." : `🔎 Find emails (${leads.filter((l) => !l.email && l.status === "New").length})`}
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

      {/* Enrichment-resultat banner */}
      {enrichResult && (
        <div className="mb-6 p-4 rounded-[2px] border border-purple-400/30 bg-purple-400/[.05]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <p className="font-condensed font-bold text-[11px] tracking-[.1em] uppercase text-purple-300 mb-2">
                🔎 Email-søgning færdig
              </p>
              <p className="text-cream text-[13px] leading-[1.6]">
                <span className="text-green-400 font-bold">{enrichResult.enriched - enrichResult.guessed} fundet</span>
                {" · "}
                <span className="text-yellow font-bold">{enrichResult.guessed} gættet</span> (info@/kontakt@ mønstre)
                {" · "}
                <span className="text-muted">{enrichResult.failed} fejlede</span>
                {enrichResult.remaining > 0 && (
                  <> · <span className="text-muted">{enrichResult.remaining} tilbage (kør igen for flere)</span></>
                )}
              </p>
              {!enrichResult.hasHunter && !enrichResult.hasApollo && (
                <p className="text-purple-200 text-[12px] mt-2">
                  💡 Tip: Tilføj <code className="text-purple-300">HUNTER_API_KEY</code> i Vercel for at finde flere emails (gratis 25/md på hunter.io)
                </p>
              )}
            </div>
            <button onClick={() => setEnrichResult(null)} className="text-muted hover:text-cream text-[18px]">✕</button>
          </div>
        </div>
      )}

      {/* Type-tabs */}
      <div className="flex gap-1 mb-6 border-b border-[rgba(242,238,230,0.07)] pb-0 flex-wrap">
        {(["all", "company", "private", "employee", "warm"] as const).map((tab) => {
          const isWarmTab = tab === "warm";
          const label = tab === "all"
            ? "Alle"
            : tab === "warm"
            ? "🔥 Ring til dem"
            : LEAD_TYPE_LABELS[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-[10px] border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? isWarmTab
                    ? "border-orange-400 text-orange-400"
                    : "border-yellow text-yellow"
                  : isWarmTab && tabCounts.warm > 0
                  ? "border-transparent text-orange-300/70 hover:text-orange-300"
                  : "border-transparent text-muted hover:text-cream"
              }`}
            >
              {label} ({tabCounts[tab]})
            </button>
          );
        })}
      </div>

      {/* Hjælpetekst på Varm-fanen */}
      {activeTab === "warm" && (
        <div className="mb-4 p-4 rounded-[2px] border border-orange-400/30 bg-orange-400/5">
          <p className="text-[12px] text-orange-200 leading-[1.6]">
            <span className="font-condensed font-bold text-[11px] tracking-[.1em] uppercase text-orange-300">
              🔥 Ring-listen
            </span>
            <br />
            Leads der har modtaget en email fra Sarah for mindst 2 dage siden og har et telefonnummer.
            Email-konvertering er 1-3% — telefon er 15-25%. Ring til dem nu mens de stadig husker mailen.
          </p>
        </div>
      )}

      {/* Stats — klikbare som filter */}
      <div className="grid grid-cols-5 gap-3 mb-4 max-[900px]:grid-cols-3">
        {Object.entries(stats).map(([k, v]) => {
          const active = statusFilter === k;
          return (
            <button
              key={k}
              onClick={() => setStatusFilter(active ? "all" : k as LeadStatus)}
              className={`text-left p-4 rounded-[2px] border transition-colors ${
                active
                  ? "bg-yellow/10 border-yellow/50"
                  : "bg-gray border-[rgba(242,238,230,0.07)] hover:border-[rgba(242,238,230,0.2)]"
              }`}
            >
              <p className={`font-condensed font-semibold text-[10px] tracking-[.2em] uppercase mb-1 ${active ? "text-yellow" : "text-muted"}`}>
                {STATUS_DA[k as LeadStatus] || k}
              </p>
              <p className={`font-condensed font-black text-[28px] ${active ? "text-yellow" : "text-cream"}`}>{v}</p>
            </button>
          );
        })}
      </div>

      {/* Aktive filtre + quick-filter knapper */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="font-condensed text-[10px] tracking-[.15em] uppercase text-muted">Vis:</span>
        {(["all", "New", "Sent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f === "all" ? "all" : f as LeadStatus)}
            className={`font-condensed font-bold text-[10px] tracking-[.1em] uppercase px-3 py-[5px] rounded-[2px] border transition-colors ${
              statusFilter === f
                ? "bg-yellow/10 border-yellow/50 text-yellow"
                : "border-[rgba(242,238,230,.1)] text-muted hover:text-cream"
            }`}
          >
            {f === "all" ? "Alle" : f === "New" ? "Nye" : "Sendte"}
          </button>
        ))}
        {statusFilter !== "all" && (
          <button
            onClick={() => setStatusFilter("all")}
            className="font-condensed text-[10px] text-muted hover:text-red-300 transition-colors ml-1"
          >
            ✕ Nulstil filter
          </button>
        )}
        <span className="font-condensed text-[10px] text-muted ml-auto">
          {filteredLeads.length} leads vist
        </span>
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
                    <td className="px-4 py-3 text-muted truncate max-w-[140px] text-[12px]">
                      {lead.email
                        ? lead.email
                        : lead.smsSentAt
                        ? <span className="text-purple-300 font-condensed font-bold text-[10px] tracking-[.06em] uppercase">📱 SMS-lead</span>
                        : "–"}
                      {lead.status === "Sent" && (
                        <span className="block text-[10px] mt-1">
                          {lead.smsSentAt
                            ? <span className="text-purple-300">SMS {new Date(lead.smsSentAt).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</span>
                            : <>
                                {lead.emailOpened && <span className="text-green-400 font-bold">✓ Åbnet · </span>}
                                {lead.followUp2SentAt
                                  ? <span className="text-orange-300">F2 {new Date(lead.followUp2SentAt).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</span>
                                  : lead.followUp1SentAt
                                  ? <span className="text-yellow">F1 {new Date(lead.followUp1SentAt).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</span>
                                  : lead.sentAt
                                  ? <span className="text-muted">Mail {new Date(lead.sentAt).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</span>
                                  : null}
                              </>}
                          {lead.phone && <span className="block text-cream/80">{lead.phone}</span>}
                        </span>
                      )}
                    </td>
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
                      {lead.status === "Sent" && (
                        <span className="block mt-[4px] text-[9px] font-condensed font-bold tracking-[.08em] uppercase">
                          {lead.followUp2SentAt
                            ? <span className="text-orange-300">F1 ✓ F2 ✓</span>
                            : lead.followUp1SentAt
                            ? <span className="text-yellow">F1 ✓ · F2 →</span>
                            : <span className="text-muted/60">F1 → dag 5</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {/* Varm-fanen: Ring-knap er hovedaktion */}
                        {activeTab === "warm" && lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="bg-orange-400 text-black font-condensed font-extrabold text-[10px] tracking-[.1em] uppercase px-3 py-[5px] rounded-[2px] hover:bg-orange-300 transition-colors no-underline flex items-center gap-1"
                            title={`Ring til ${lead.phone}`}
                          >
                            📞 Ring
                          </a>
                        )}
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
                          disabled={!!actionLoading || (lead.leadType !== "employee" && !lead.councilAnalysis)}
                          title={lead.leadType === "employee" ? "Sarah skriver onboarding-mail" : "Sarah skriver udkast"}
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

            {/* Employee-lead bekræftelses-banner */}
            {selectedLead.leadType === "employee" && selectedLead.status !== "Approved" && (
              <section className="mb-6 p-4 rounded-[2px] border border-yellow/40 bg-yellow/[.06]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-yellow mb-1">👷 Medarbejder-lead</p>
                    <p className="text-cream text-[12px] leading-[1.5]">
                      Konverter til medarbejder-databasen, eller lad Sarah skrive en onboarding-mail som du bekræfter inden afsendelse.
                    </p>
                  </div>
                  <button
                    onClick={() => convertToEmployee(selectedLead.id)}
                    disabled={!!actionLoading || !selectedLead.phone}
                    title={!selectedLead.phone ? "Mangler telefonnummer" : "Opret som medarbejder"}
                    className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.1em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-40"
                  >
                    {actionLoading === selectedLead.id + "-convert" ? "Konverterer..." : "→ Bliv medarbejder"}
                  </button>
                </div>
              </section>
            )}

            {/* Lead info */}
            <section className="mb-6 p-5 bg-gray rounded-[2px] border border-[rgba(242,238,230,0.07)]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted">Lead info</p>
                  {selectedLead.leadType && (
                    <span className={`font-condensed font-bold text-[9px] tracking-[.1em] uppercase px-[7px] py-[3px] rounded-[2px] border ${LEAD_TYPE_COLORS[selectedLead.leadType]}`}>
                      {LEAD_TYPE_LABELS[selectedLead.leadType]}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => openLeadEdit(selectedLead)}
                  className="font-condensed font-bold text-[10px] tracking-[.1em] uppercase text-muted hover:text-yellow border border-[rgba(242,238,230,.12)] hover:border-yellow/40 px-3 py-[4px] rounded-[2px] transition-colors"
                >
                  Rediger ✎
                </button>
              </div>

              {/* Mangler email — fremhævet advarsel */}
              {!selectedLead.email && (
                <div className="mb-3 p-2 bg-[rgba(248,113,113,.08)] border border-red-400/30 rounded-[2px] flex items-center justify-between gap-2">
                  <p className="text-red-300 text-[11px] font-condensed">⚠ Ingen email — Sarah kan ikke sende</p>
                  <button onClick={() => openLeadEdit(selectedLead)} className="text-red-300 font-condensed font-bold text-[10px] uppercase hover:text-red-200">Tilføj →</button>
                </div>
              )}
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

            {/* SMS-lead sektion */}
            {selectedLead.smsSentAt && (
              <section className="mb-6 p-5 bg-gray rounded-[2px] border border-[rgba(167,139,250,.25)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-purple-300">📱 SMS sendt</p>
                  <span className="text-[11px] text-muted font-condensed">
                    {new Date(selectedLead.smsSentAt).toLocaleString("da-DK", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {selectedLead.smsBody && (
                  <div className="p-3 bg-[rgba(167,139,250,.06)] border border-purple-400/20 rounded-[2px] mb-3">
                    <p className="text-cream text-[13px] leading-[1.6]">{selectedLead.smsBody}</p>
                    <p className="text-muted text-[10px] mt-2">{selectedLead.smsBody.length} tegn · Sendt til {selectedLead.phone}</p>
                  </div>
                )}
                <div className="p-3 bg-[rgba(251,146,60,.05)] border border-orange-400/20 rounded-[2px]">
                  <p className="text-orange-200 text-[12px] leading-[1.6] font-condensed">
                    <span className="font-bold text-orange-300">📞 Næste skridt:</span> Ring til dem! SMS-konvertering er lav — et opkald er 10× mere effektivt.
                    {selectedLead.phone && (
                      <a href={`tel:${selectedLead.phone}`} className="ml-2 text-orange-300 font-bold hover:underline">{selectedLead.phone}</a>
                    )}
                  </p>
                </div>
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
                      <button
                        onClick={async () => {
                          const r = await fetch("/api/admin/leads/preview", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ leadId: selectedLead.id }),
                          });
                          const d = await r.json();
                          if (d.html) setPreviewHtml(d.html);
                        }}
                        className="border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[12px] uppercase px-4 py-2 hover:text-cream transition-colors"
                      >
                        Forhåndsvis ✉
                      </button>
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

            {/* ── Opfølgnings-pipeline (kun for Sent leads) ──────────────────── */}
            {selectedLead.status === "Sent" && (() => {
              const sentDate = selectedLead.sentAt ? new Date(selectedLead.sentAt) : null;
              const plannedF1 = sentDate ? new Date(sentDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null;
              const plannedF2 = sentDate ? new Date(sentDate.getTime() + 14 * 24 * 60 * 60 * 1000) : null;
              const plannedClose = sentDate ? new Date(sentDate.getTime() + 21 * 24 * 60 * 60 * 1000) : null;
              const fmtDate = (d: Date | null) =>
                d ? d.toLocaleDateString("da-DK", { day: "numeric", month: "short" }) : "–";
              const fmtDatetime = (s: string) =>
                new Date(s).toLocaleDateString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

              const steps = [
                {
                  key: "sent",
                  icon: "📧",
                  label: "Første mail",
                  sub: "Dag 0",
                  done: !!selectedLead.sentAt,
                  doneLabel: selectedLead.sentAt ? `Sendt ${fmtDatetime(selectedLead.sentAt)}` : null,
                  plannedLabel: null,
                  color: "border-green-400 bg-green-400/15",
                  textColor: "text-green-300",
                },
                {
                  key: "f1",
                  icon: "🔁",
                  label: "Opfølgning 1",
                  sub: "Dag 5",
                  done: !!selectedLead.followUp1SentAt,
                  doneLabel: selectedLead.followUp1SentAt ? `Sendt ${fmtDatetime(selectedLead.followUp1SentAt)}` : null,
                  plannedLabel: plannedF1 ? `Planlagt ~${fmtDate(plannedF1)}` : null,
                  color: "border-yellow bg-yellow/10",
                  textColor: "text-yellow",
                },
                {
                  key: "f2",
                  icon: "🎯",
                  label: "Opfølgning 2",
                  sub: "Dag 14",
                  done: !!selectedLead.followUp2SentAt,
                  doneLabel: selectedLead.followUp2SentAt ? `Sendt ${fmtDatetime(selectedLead.followUp2SentAt)}` : null,
                  plannedLabel: plannedF2 ? `Planlagt ~${fmtDate(plannedF2)}` : null,
                  color: "border-orange-400 bg-orange-400/10",
                  textColor: "text-orange-300",
                },
                {
                  key: "close",
                  icon: "🗄",
                  label: "Auto-luk",
                  sub: "Dag 21",
                  done: false,
                  doneLabel: null,
                  plannedLabel: plannedClose ? `Planlagt ~${fmtDate(plannedClose)}` : null,
                  color: "border-[rgba(242,238,230,.2)] bg-transparent",
                  textColor: "text-muted",
                },
              ];

              const canSendF1 = !selectedLead.followUp1SentAt;
              const canSendF2 = !!selectedLead.followUp1SentAt && !selectedLead.followUp2SentAt;
              const canSendAny = canSendF1 || canSendF2;

              return (
                <section className="mb-6 p-5 bg-gray rounded-[2px] border border-[rgba(242,238,230,.1)]">
                  <div className="flex items-center justify-between mb-5">
                    <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted">
                      📬 Opfølgnings-pipeline
                    </p>
                    {selectedLead.emailOpened && (
                      <span className="font-condensed font-bold text-[10px] tracking-[.08em] uppercase text-green-300 bg-green-400/10 border border-green-400/30 px-2 py-[2px] rounded-[2px]">
                        ✓ Email åbnet
                        {selectedLead.emailOpenedAt ? ` ${fmtDate(new Date(selectedLead.emailOpenedAt))}` : ""}
                      </span>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3 mb-5">
                    {steps.map((s) => (
                      <div key={s.key} className="flex items-start gap-3">
                        {/* Dot */}
                        <div className={`flex-shrink-0 w-[28px] h-[28px] rounded-full border-2 flex items-center justify-center text-[12px] mt-[1px] ${s.done ? s.color : "border-[rgba(242,238,230,.15)] bg-transparent"}`}>
                          {s.done ? "✓" : s.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-condensed font-bold text-[12px] tracking-[.06em] uppercase ${s.done ? "text-cream" : "text-muted"}`}>
                              {s.label}
                            </p>
                            <span className="font-condensed text-[10px] tracking-[.08em] uppercase text-muted opacity-60">
                              {s.sub}
                            </span>
                          </div>
                          {s.done && s.doneLabel && (
                            <p className={`text-[11px] mt-[1px] ${s.textColor}`}>✓ {s.doneLabel}</p>
                          )}
                          {!s.done && s.plannedLabel && (
                            <p className="text-[11px] text-muted/60 mt-[1px]">{s.plannedLabel}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Connector lines between steps */}
                  {/* Manual trigger */}
                  {canSendAny && (
                    <div className="pt-4 border-t border-[rgba(242,238,230,.08)]">
                      <p className="text-[11px] text-muted mb-3">
                        {canSendF1
                          ? "Klar til opfølgning #1 — Sarah og Council skriver en personlig reminder"
                          : "Klar til opfølgning #2 — Sarah skriver den afsluttende mail"}
                      </p>
                      <button
                        onClick={() => runFollowUp(selectedLead.id)}
                        disabled={!!actionLoading}
                        className="bg-[rgba(251,146,60,.12)] text-orange-300 border border-orange-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-[9px] hover:bg-[rgba(251,146,60,.22)] transition-colors disabled:opacity-40 flex items-center gap-2"
                      >
                        {actionLoading === selectedLead.id + "-followup"
                          ? "Council + Sarah arbejder..."
                          : canSendF1
                          ? "🔁 Send opfølgning #1 nu"
                          : "🎯 Send opfølgning #2 nu"}
                      </button>
                      <p className="text-[10px] text-muted/50 mt-2">
                        Cron sender automatisk på dag {canSendF1 ? "5" : "14"} — brug knappen for at sende nu
                      </p>
                    </div>
                  )}
                  {!canSendAny && (
                    <div className="pt-4 border-t border-[rgba(242,238,230,.08)]">
                      <p className="text-[11px] text-orange-200/70">
                        Alle opfølgninger er sendt. Auto-luk sker {plannedClose ? `~${fmtDate(plannedClose)}` : "om 21 dage"} hvis ingen svar.
                      </p>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {/* Council kræves kun for company/private leads — ikke for medarbejder */}
              {!selectedLead.councilAnalysis && selectedLead.leadType !== "employee" && (
                <button onClick={() => runCouncil(selectedLead.id)} disabled={!!actionLoading} className="bg-[rgba(96,165,250,.12)] text-blue-300 border border-blue-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-2 hover:bg-[rgba(96,165,250,.2)] transition-colors disabled:opacity-40">
                  {actionLoading === selectedLead.id + "-council" ? "Analyserer..." : "Kør Council ▶"}
                </button>
              )}
              {/* Sarah: enten kør med Council, eller direkte for employee-leads */}
              {!selectedLead.draftBody && (selectedLead.councilAnalysis || selectedLead.leadType === "employee") && (
                <button onClick={() => runSarah(selectedLead.id)} disabled={!!actionLoading} className="bg-[rgba(251,146,60,.12)] text-orange-300 border border-orange-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-2 hover:bg-[rgba(251,146,60,.2)] transition-colors disabled:opacity-40">
                  {actionLoading === selectedLead.id + "-sarah" ? "Skriver..." : selectedLead.leadType === "employee" ? "Skriv onboarding-mail (Sarah) ✍" : "Skriv udkast (Sarah) ✍"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead-edit modal */}
      {editingLead && leadEdit && selectedLead && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" style={{ background: "rgba(12,12,10,.88)" }} onClick={() => setEditingLead(false)}>
          <div className="bg-gray border border-[rgba(242,238,230,0.1)] rounded-[2px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-condensed font-black text-[18px] uppercase text-cream">Rediger lead</h3>
              <button onClick={() => setEditingLead(false)} className="text-muted hover:text-cream text-[20px] leading-none">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                ["Firmanavn / Navn", "companyName"],
                ["Email", "email"],
                ["Telefon", "phone"],
                ["Kontaktperson", "contactName"],
                ["Stilling / Titel", "contactTitle"],
                ["Website", "website"],
                ["By", "city"],
                ["Branche", "industry"],
                ["Service type", "serviceType"],
                ["Budget (DKK)", "budget"],
              ] as [string, keyof typeof leadEdit][]).map(([label, key]) => (
                <div key={key} className={key === "email" || key === "companyName" ? "col-span-2" : ""}>
                  <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">
                    {label}
                    {key === "email" && !leadEdit.email && <span className="text-red-400 ml-1">*mangler</span>}
                  </label>
                  <input
                    value={leadEdit[key]}
                    onChange={(e) => setLeadEdit({ ...leadEdit, [key]: e.target.value })}
                    className={`w-full bg-black border text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow transition-colors ${
                      key === "email" && !leadEdit.email
                        ? "border-red-400/50 focus:border-yellow"
                        : "border-[rgba(242,238,230,.12)]"
                    }`}
                    placeholder={key === "email" ? "eks. info@firma.dk" : key === "budget" ? "eks. 15.000–20.000" : ""}
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Personlig vinkel</label>
                <input
                  value={leadEdit.personalAngle}
                  onChange={(e) => setLeadEdit({ ...leadEdit, personalAngle: e.target.value })}
                  className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow"
                  placeholder="Noget specifikt Council og Sarah skal vide om dette lead"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Noter</label>
                <textarea
                  value={leadEdit.notes}
                  onChange={(e) => setLeadEdit({ ...leadEdit, notes: e.target.value })}
                  rows={4}
                  className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow resize-y"
                />
              </div>
            </div>

            {/* Budget-hjælp */}
            <div className="mt-3 p-3 bg-[rgba(245,196,0,.05)] border border-yellow/20 rounded-[2px]">
              <p className="font-condensed text-[10px] tracking-[.12em] uppercase text-yellow mb-2">Budget-estimat guide</p>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-muted">
                {[
                  ["Andelsforening (lille)", "10.000–15.000"],
                  ["Andelsforening (stor)", "15.000–30.000"],
                  ["Ejendomsadministrator", "15.000–50.000"],
                  ["Privat renovering", "10.000–25.000"],
                  ["Facility kontrakt", "20.000–100.000"],
                  ["Enkelt opgave", "5.000–15.000"],
                ].map(([type, range]) => (
                  <button
                    key={type}
                    onClick={() => setLeadEdit({ ...leadEdit, budget: range })}
                    className="text-left hover:text-cream transition-colors"
                  >
                    <span className="text-yellow">→</span> {type}: <span className="text-cream">{range}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={saveLeadEdit}
                disabled={actionLoading === "lead-edit"}
                className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-6 py-3 hover:bg-yellow2 transition-colors disabled:opacity-50"
              >
                {actionLoading === "lead-edit" ? "Gemmer..." : "Gem ændringer"}
              </button>
              <button onClick={() => setEditingLead(false)} className="border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[12px] uppercase px-5 py-3 hover:text-cream transition-colors">
                Annuller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opret lead manuelt — modal */}
      {creatingLead && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" style={{ background: "rgba(12,12,10,.88)" }} onClick={() => setCreatingLead(false)}>
          <div className="bg-gray border border-[rgba(242,238,230,0.1)] rounded-[2px] w-full max-w-[580px] max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-condensed font-semibold text-[10px] tracking-[.22em] uppercase text-yellow mb-1">Manuel oprettelse</p>
                <h3 className="font-condensed font-black text-[20px] uppercase text-cream">Tilføj nyt lead</h3>
              </div>
              <button onClick={() => setCreatingLead(false)} className="text-muted hover:text-cream text-[20px] leading-none">✕</button>
            </div>

            {/* Lead type vælger */}
            <div className="mb-4">
              <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-2">Type</label>
              <div className="flex gap-2">
                {(["company", "private", "employee"] as LeadType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewLeadForm({ ...newLeadForm, leadType: t })}
                    className={`font-condensed font-bold text-[11px] tracking-[.1em] uppercase px-4 py-[7px] rounded-[2px] border transition-colors ${
                      newLeadForm.leadType === t
                        ? LEAD_TYPE_COLORS[t] + " border-current"
                        : "border-[rgba(242,238,230,.12)] text-muted hover:text-cream"
                    }`}
                  >
                    {t === "company" ? "🏢 Virksomhed" : t === "private" ? "🏠 Privat" : "👷 Medarbejder"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                ["Firmanavn / Navn *", "companyName", "col-span-2"],
                ["Email", "email", "col-span-2"],
                ["Telefon", "phone", ""],
                ["By", "city", ""],
                ["Kontaktperson", "contactName", ""],
                ["Stilling / Titel", "contactTitle", ""],
                ["Website", "website", "col-span-2"],
                ["Branche", "industry", ""],
                ["Service type", "serviceType", ""],
                ["Budget (DKK)", "budget", "col-span-2"],
              ] as [string, keyof typeof newLeadForm, string][]).map(([label, key, span]) => (
                <div key={key} className={span}>
                  <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">{label}</label>
                  <input
                    value={newLeadForm[key] as string}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, [key]: e.target.value })}
                    className={`w-full bg-black border text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow transition-colors ${
                      key === "companyName" && !newLeadForm.companyName
                        ? "border-red-400/40"
                        : "border-[rgba(242,238,230,.12)]"
                    }`}
                    placeholder={
                      key === "email" ? "eks. info@firma.dk" :
                      key === "budget" ? "eks. 15.000–25.000" :
                      key === "website" ? "eks. https://firma.dk" : ""
                    }
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Personlig vinkel</label>
                <input
                  value={newLeadForm.personalAngle}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, personalAngle: e.target.value })}
                  className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow"
                  placeholder="Noget specifikt Council og Sarah skal vide"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Noter</label>
                <textarea
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow resize-y"
                  placeholder="Baggrundsviden, særlige hensyn, kilde..."
                />
              </div>
            </div>

            {/* Budget guide */}
            <div className="mt-3 p-3 bg-[rgba(245,196,0,.05)] border border-yellow/20 rounded-[2px]">
              <p className="font-condensed text-[10px] tracking-[.12em] uppercase text-yellow mb-2">Budget-estimat guide</p>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {[
                  ["Andelsforening (lille)", "10.000–15.000"],
                  ["Andelsforening (stor)", "15.000–30.000"],
                  ["Ejendomsadministrator", "15.000–50.000"],
                  ["Privat renovering", "10.000–25.000"],
                  ["Facility kontrakt", "20.000–100.000"],
                  ["Enkelt opgave", "5.000–15.000"],
                ].map(([type, range]) => (
                  <button
                    key={type}
                    onClick={() => setNewLeadForm({ ...newLeadForm, budget: range })}
                    className="text-left text-muted hover:text-cream transition-colors"
                  >
                    <span className="text-yellow">→</span> {type}: <span className="text-cream">{range}</span>
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <div className="mt-3 p-3 bg-red-400/5 border border-red-400/30 rounded-[2px] text-red-300 text-[12px] font-condensed">
                ⚠ {createError}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={createLead}
                disabled={actionLoading === "create-lead" || !newLeadForm.companyName.trim()}
                className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-6 py-3 hover:bg-yellow2 transition-colors disabled:opacity-50"
              >
                {actionLoading === "create-lead" ? "Opretter..." : "Opret lead →"}
              </button>
              <button onClick={() => setCreatingLead(false)} className="border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[12px] uppercase px-5 py-3 hover:text-cream transition-colors">
                Annuller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk-søg firmaer modal */}
      {bulkSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,12,10,.88)" }} onClick={() => setBulkSearchOpen(false)}>
          <div className="bg-gray border border-yellow/30 rounded-[2px] w-full max-w-[640px] p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-condensed font-semibold text-[10px] tracking-[.22em] uppercase text-yellow mb-1">Bulk-søgning</p>
                <h2 className="font-condensed font-black text-[20px] uppercase text-cream">Find firmaer via navn</h2>
              </div>
              <button onClick={() => setBulkSearchOpen(false)} className="text-muted hover:text-cream text-[20px] leading-none">✕</button>
            </div>

            <div className="mb-4 p-3 bg-yellow/[.06] border border-yellow/20 rounded-[2px]">
              <p className="text-cream/80 text-[12px] leading-[1.6]">
                Paste en liste af firmanavne (én pr. linje eller komma-adskilt). Systemet søger på OpenStreetMap +
                website-scraper og opretter dem som leads med email/telefon/website hvor muligt.
                <br/><br/>
                <span className="text-yellow">Max 50 navne pr. søgning. ~2 sek pr. firma.</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Type</label>
                <select
                  value={bulkSearchType}
                  onChange={(e) => setBulkSearchType(e.target.value as LeadType)}
                  className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow"
                >
                  <option value="company">🏢 Virksomhed</option>
                  <option value="private">🏠 Privat</option>
                  <option value="employee">👷 Medarbejder</option>
                </select>
              </div>
              <div>
                <label className="block font-condensed text-[10px] tracking-[.15em] uppercase text-muted mb-1">Service-type (valgfri)</label>
                <input
                  value={bulkSearchService}
                  onChange={(e) => setBulkSearchService(e.target.value)}
                  placeholder="fx Malerarbejde"
                  className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow"
                />
              </div>
            </div>

            <textarea
              value={bulkSearchInput}
              onChange={(e) => setBulkSearchInput(e.target.value)}
              rows={10}
              placeholder={"AlbertsenFarver ApS\nMalerfirmaet Hansen\nPedersen Byg\n..."}
              className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow resize-y mb-3 font-mono"
            />

            <p className="text-[11px] text-muted mb-3">
              {bulkSearchInput.split(/[\n,;]/).filter((s) => s.trim().length >= 3).length} navne klar
            </p>

            <div className="flex gap-3 mb-3">
              <button
                onClick={runBulkSearch}
                disabled={bulkSearchLoading || bulkSearchInput.trim().length < 3}
                className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-6 py-3 hover:bg-yellow2 disabled:opacity-50"
              >
                {bulkSearchLoading ? "Søger... (kan tage flere min)" : "🔍 Søg & opret leads"}
              </button>
              <button onClick={() => setBulkSearchOpen(false)} className="border border-[rgba(242,238,230,.15)] text-muted font-condensed font-bold text-[12px] uppercase px-5 py-3 hover:text-cream">
                Annuller
              </button>
            </div>

            {bulkSearchResult && (
              <div className="p-3 rounded-[2px] border border-green-400/30 bg-green-400/[.05]">
                <p className="text-cream text-[13px] leading-[1.6]">
                  <span className="text-green-400 font-bold">✓ {bulkSearchResult.added} leads oprettet</span>
                  {" — "}
                  <span className="text-green-300">{bulkSearchResult.withEmail} med email</span>
                  {" · "}
                  <span className="text-yellow">{bulkSearchResult.withoutEmail} uden email (SMS-kandidater)</span>
                  {bulkSearchResult.skipped > 0 && <> · <span className="text-muted">{bulkSearchResult.skipped} dubletter sprunget over</span></>}
                  {bulkSearchResult.failed > 0 && <> · <span className="text-red-400">{bulkSearchResult.failed} fejlede</span></>}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HTML-preview modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(12,12,10,.88)" }} onClick={() => setPreviewHtml(null)}>
          <div className="bg-white rounded-[4px] w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-[#f5f5f0] border-b border-gray-200 flex-shrink-0">
              <span className="font-condensed font-bold text-[12px] tracking-[.12em] uppercase text-gray-500">Forhåndsvisning — præcis hvad modtageren ser</span>
              <button onClick={() => setPreviewHtml(null)} className="text-gray-400 hover:text-gray-800 text-[20px] leading-none font-light">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <iframe
                srcDoc={previewHtml}
                title="Email preview"
                className="w-full border-0"
                style={{ height: 600 }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
