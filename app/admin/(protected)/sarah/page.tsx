"use client";

import { useEffect, useRef, useState } from "react";
import type { SarahContact, SarahLog, SarahStatus, LeadBotConfig } from "@/lib/types";

interface LeadBotBatch {
  batchId: string;
  generatedAt: string;
  receivedAt: string;
  total: number;
  accepted: number;
  rejected: number;
  sourceBreakdown: Record<string, number>;
}

const STATUS_LABELS: Record<SarahStatus, string> = {
  pending: "Afventer",
  emailed: "Email sendt",
  followed_up: "Opfølgning",
  replied: "Svar",
  meeting: "Møde",
  closed: "Lukket",
};

const STATUS_COLORS: Record<SarahStatus, string> = {
  pending: "bg-white/10 text-cream/60",
  emailed: "bg-blue-500/20 text-blue-300",
  followed_up: "bg-yellow/20 text-yellow",
  replied: "bg-green-500/20 text-green-300",
  meeting: "bg-purple-500/20 text-purple-300",
  closed: "bg-white/5 text-cream/30",
};

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className={`rounded-[4px] border border-[rgba(242,238,230,.08)] p-5 ${color ?? "bg-black2"}`}>
      <p className="text-[36px] font-condensed font-black text-cream leading-none">{value}</p>
      <p className="text-[11px] font-condensed font-semibold tracking-[.15em] uppercase text-muted mt-2">{label}</p>
    </div>
  );
}

function Badge({ status }: { status: SarahStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-condensed font-bold tracking-[.1em] uppercase ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

interface SentEmail {
  id: string;
  source: "lead" | "contact";
  recipient: string;
  recipientName?: string;
  subject: string;
  bodyPreview?: string;
  sentAt: string;
  industry?: string;
  serviceType?: string;
  angle?: string;
  tone?: string;
  bodyLength?: number;
  councilScore?: number;
  customerType?: string;
  wasEdited?: boolean;
  editSummary?: string;
  city?: string;
  phone?: string;
  leadStatus?: string;
  contactType?: string;
  contactTrade?: string;
  contactStatus?: string;
  followUpSentAt?: string;
  repliedAt?: string;
}

export default function SarahPage() {
  const [tab, setTab] = useState<"overview" | "contacts" | "sent" | "inbox" | "leadbot" | "log">("overview");
  const [contacts, setContacts] = useState<SarahContact[]>([]);
  const [log, setLog] = useState<SarahLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SarahStatus | "all">("all");
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentFilter, setSentFilter] = useState<"all" | "lead" | "contact">("all");
  const [expandedSentId, setExpandedSentId] = useState<string | null>(null);
  // LeadBot tab state
  const [lbConfig, setLbConfig] = useState<LeadBotConfig | null>(null);
  const [lbBatches, setLbBatches] = useState<LeadBotBatch[]>([]);
  const [lbTotals, setLbTotals] = useState<{ batches: number; totalLeads: number; accepted: number; rejected: number } | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbSaving, setLbSaving] = useState(false);
  const [lbSaveOk, setLbSaveOk] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/sarah/run");
      if (r.ok) {
        const d = await r.json();
        setContacts(d.contacts ?? []);
        setLog(d.log ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadSentEmails = async () => {
    setSentLoading(true);
    try {
      const r = await fetch("/api/admin/sarah/sent-emails");
      if (r.ok) {
        const d = await r.json();
        setSentEmails(d.emails ?? []);
      }
    } finally {
      setSentLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "sent" && sentEmails.length === 0) {
      loadSentEmails();
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLeadBot = async () => {
    setLbLoading(true);
    try {
      const [cfgRes, batchRes] = await Promise.all([
        fetch("/api/admin/leadbot/config"),
        fetch("/api/admin/leadbot"),
      ]);
      if (cfgRes.ok) {
        const d = await cfgRes.json();
        setLbConfig(d.config);
      }
      if (batchRes.ok) {
        const d = await batchRes.json();
        setLbBatches(d.batches ?? []);
        setLbTotals(d.totals ?? null);
      }
    } finally {
      setLbLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "leadbot" && !lbConfig) {
      loadLeadBot();
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveLeadBotConfig = async () => {
    if (!lbConfig) return;
    setLbSaving(true);
    setLbSaveOk(null);
    try {
      const r = await fetch("/api/admin/leadbot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lbConfig),
      });
      if (r.ok) {
        const d = await r.json();
        setLbConfig(d.config);
        setLbSaveOk("Gemt ✓");
        setTimeout(() => setLbSaveOk(null), 2500);
      } else {
        setLbSaveOk("Fejl ved gem");
      }
    } finally {
      setLbSaving(false);
    }
  };

  const stats = {
    pending: contacts.filter((c) => c.status === "pending").length,
    emailed: contacts.filter((c) => c.status === "emailed").length,
    followed_up: contacts.filter((c) => c.status === "followed_up").length,
    replied: contacts.filter((c) => c.status === "replied").length,
    meeting: contacts.filter((c) => c.status === "meeting").length,
  };

  const isActive = (() => {
    const now = new Date();
    return now.getDay() > 0 && now.getDay() < 6 && now.getHours() >= 8 && now.getHours() < 17;
  })();

  const uploadFile = async (file: File) => {
    setUploadResult("Importerer...");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/sarah/upload", { method: "POST", body: fd });
    const d = await r.json();
    if (d.ok) {
      const parts: string[] = [];
      if (d.imported > 0) parts.push(`${d.imported} outreach-kontakter`);
      if (d.customersImported > 0) parts.push(`${d.customersImported} kunder`);
      if (parts.length === 0) parts.push("0 nye (alle allerede importeret?)");
      const skippedTotal = (d.skipped ?? 0) + (d.customersSkipped ?? 0);
      setUploadResult(`✓ Importeret: ${parts.join(" + ")}${skippedTotal > 0 ? ` · ${skippedTotal} sprunget over` : ""}`);
      await load();
    } else {
      setUploadResult(`Fejl: ${d.error}`);
    }
  };

  const runSarah = async (mode: string) => {
    setRunning(mode);
    setRunResult(null);
    const r = await fetch("/api/admin/sarah/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const d = await r.json();
    setRunning(null);
    if (d.ok) {
      setRunResult(
        mode === "email"
          ? `Sarah sendte ${d.emailsSent} emails`
          : `${d.followUpsSent} opfølgninger sendt`
      );
      await load();
    } else {
      setRunResult(`Fejl: ${d.error}`);
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm("Slet denne kontakt?")) return;
    await fetch("/api/admin/sarah/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const proposeMeeting = async (contactId: string, proposedTime: string) => {
    await fetch("/api/admin/sarah/meeting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, proposedTime }),
    });
    alert("Møde-forslag registreret");
  };

  const filtered = filterStatus === "all"
    ? contacts
    : contacts.filter((c) => c.status === filterStatus);

  const TabBtn = ({ id, label, count }: { id: typeof tab; label: string; count?: number }) => (
    <button
      onClick={() => setTab(id)}
      className={`font-condensed font-semibold text-[11px] tracking-[.18em] uppercase px-4 py-3 border-b-2 transition-colors ${
        tab === id
          ? "border-yellow text-cream"
          : "border-transparent text-muted hover:text-cream"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-2 bg-yellow text-black text-[9px] font-black px-1.5 py-0.5 rounded-[2px]">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">
            AI OUTREACH
          </p>
          <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[32px] uppercase tracking-[-.01em] text-cream leading-none">
            Sarah ✦
          </h1>
          <p className="text-muted text-[13px] mt-2">Autonom outreach-assistent · Council-drevet</p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-flex items-center gap-2 text-[11px] font-condensed font-bold tracking-[.12em] uppercase px-3 py-1.5 rounded-[2px] border ${
            isActive
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-white/10 bg-white/5 text-muted"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
            {isActive ? "Aktiv" : "Inaktiv"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(242,238,230,.07)] mb-8 flex-wrap">
        <TabBtn id="overview" label="Oversigt" />
        <TabBtn id="contacts" label="Kontakter" count={contacts.length} />
        <TabBtn id="sent" label="Sendte mails" count={sentEmails.length || undefined} />
        <TabBtn id="inbox" label="Indbakke" count={stats.replied} />
        <TabBtn id="leadbot" label="LeadBot" count={lbBatches.length || undefined} />
        <TabBtn id="log" label="Log" count={log.length} />
      </div>

      {loading && (
        <p className="text-muted text-[13px]">Indlæser...</p>
      )}

      {/* ── OVERSIGT ── */}
      {!loading && tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-5 max-[700px]:grid-cols-2 gap-3">
            <StatCard label="Afventer" value={stats.pending} />
            <StatCard label="Emails sendt" value={stats.emailed} color="bg-blue-500/5 border-blue-500/20" />
            <StatCard label="Opfølgninger" value={stats.followed_up} color="bg-yellow/5 border-yellow/20" />
            <StatCard label="Svar" value={stats.replied} color="bg-green-500/5 border-green-500/20" />
            <StatCard label="Møder" value={stats.meeting} color="bg-purple-500/5 border-purple-500/20" />
          </div>

          {/* Upload */}
          <div className="rounded-[4px] border border-[rgba(242,238,230,.08)] bg-black2 p-6">
            <p className="font-condensed font-black text-[13px] tracking-[.15em] uppercase text-cream mb-4">
              Importer kontakter
            </p>
            <div
              className="border-2 border-dashed border-[rgba(242,238,230,.12)] rounded-[4px] p-10 text-center cursor-pointer hover:border-yellow/40 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
            >
              <p className="text-[28px] mb-2">📊</p>
              <p className="text-cream font-condensed font-semibold text-[13px]">Træk .xlsx hertil</p>
              <p className="text-muted text-[12px] mt-1">
                eller <span className="text-yellow cursor-pointer">klik for at vælge</span>
              </p>
              <p className="text-muted text-[11px] mt-3">
                Sheet &quot;Partnere&quot; → type=partner · Sheet &quot;Medarbejdere&quot; → type=medarbejder<br />
                Kolonner: Navn, Email, Firma, Fag
              </p>
              <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
            </div>
            {uploadResult && (
              <p className={`mt-3 text-[13px] font-condensed ${uploadResult.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {uploadResult}
              </p>
            )}
          </div>

          {/* Run buttons */}
          <div className="rounded-[4px] border border-[rgba(242,238,230,.08)] bg-black2 p-6">
            <p className="font-condensed font-black text-[13px] tracking-[.15em] uppercase text-cream mb-4">
              Kør Sarah manuelt
            </p>
            <div className="flex gap-3 flex-wrap">
              {[
                { mode: "email", label: "✉ Send emails (maks 15)", style: "bg-yellow text-black hover:bg-yellow/90" },
                { mode: "followup", label: "🔄 Send opfølgninger", style: "bg-black border border-[rgba(242,238,230,.15)] text-cream hover:bg-white/5" },
              ].map(({ mode, label, style }) => (
                <button
                  key={mode}
                  disabled={running !== null}
                  onClick={() => runSarah(mode)}
                  className={`font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] transition-colors disabled:opacity-50 ${style}`}
                >
                  {running === mode ? "Kører..." : label}
                </button>
              ))}
            </div>
            {runResult && (
              <p className={`mt-3 text-[13px] font-condensed ${runResult.startsWith("Fejl") ? "text-red-400" : "text-green-400"}`}>
                {runResult}
              </p>
            )}
            <p className="text-muted text-[11px] mt-4">
              Council rådgiver automatisk Sarah inden hver email · Kræver ANTHROPIC_API_KEY + RESEND_API_KEY
            </p>
          </div>

          {/* Schedule */}
          <div className="rounded-[4px] border border-[rgba(242,238,230,.08)] bg-black2 p-6">
            <p className="font-condensed font-black text-[13px] tracking-[.15em] uppercase text-cream mb-4">
              Dagsskema (Vercel Cron)
            </p>
            <div className="grid grid-cols-4 max-[700px]:grid-cols-2 gap-2">
              {[
                { tid: "08:00", opgave: "Emails til nye kontakter" },
                { tid: "10:00", opgave: "Council forbedrer emails" },
                { tid: "13:00", opgave: "Opfølgninger sendes" },
                { tid: "16:00", opgave: "Daglig rapport" },
              ].map(({ tid, opgave }) => (
                <div key={tid} className="border border-[rgba(242,238,230,.06)] rounded-[2px] p-3 text-center">
                  <p className="font-condensed font-black text-[18px] text-yellow">{tid}</p>
                  <p className="text-[11px] text-muted mt-1">{opgave}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── KONTAKTER ── */}
      {!loading && tab === "contacts" && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(["all", "pending", "emailed", "followed_up", "replied", "meeting", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`font-condensed font-semibold text-[10px] tracking-[.15em] uppercase px-3 py-1.5 rounded-[2px] border transition-colors ${
                  filterStatus === s
                    ? "border-yellow bg-yellow/10 text-yellow"
                    : "border-[rgba(242,238,230,.1)] text-muted hover:text-cream"
                }`}
              >
                {s === "all" ? "Alle" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted text-[13px]">Ingen kontakter — upload et Excel-ark for at komme i gang.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((c) => (
                <div key={c.id}>
                  <div
                    className="flex items-center gap-4 p-4 rounded-[2px] border border-[rgba(242,238,230,.06)] bg-black2 hover:bg-white/[.02] cursor-pointer"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-condensed font-bold text-[13px] text-cream truncate">{c.name}</p>
                      <p className="text-[11px] text-muted truncate">{c.company || c.email}</p>
                    </div>
                    <Badge status={c.status} />
                    <span className={`text-[10px] font-condensed uppercase px-2 py-1 rounded-[2px] border border-[rgba(242,238,230,.08)] text-muted`}>
                      {c.type === "partner" ? "Virksomhed" : c.type === "privat" ? "Privat" : "Medarbejder"}
                    </span>
                    <p className="text-[11px] text-muted hidden min-[900px]:block">
                      {c.emailSentAt ? new Date(c.emailSentAt).toLocaleDateString("da-DK") : "—"}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteContact(c.id); }}
                      className="text-[10px] text-muted hover:text-red-400 font-condensed uppercase tracking-widest ml-2 transition-colors"
                    >
                      Slet
                    </button>
                  </div>
                  {expandedId === c.id && (
                    <div className="border border-t-0 border-[rgba(242,238,230,.06)] bg-black p-4 rounded-b-[2px] grid grid-cols-2 max-[700px]:grid-cols-1 gap-4 text-[13px]">
                      <div>
                        <p className="text-[10px] font-condensed font-bold tracking-[.15em] uppercase text-muted mb-2">Email: {c.email}</p>
                        {c.generatedEmail ? (
                          <pre className="whitespace-pre-wrap text-cream/80 bg-white/[.03] p-3 rounded-[2px] text-[12px] leading-relaxed border border-[rgba(242,238,230,.05)]">
                            {c.generatedEmail}
                          </pre>
                        ) : <p className="text-muted">Ingen email genereret endnu.</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-condensed font-bold tracking-[.15em] uppercase text-muted mb-2">Council-rådgivning</p>
                        {c.councilAdvice ? (
                          <div className="bg-yellow/5 border border-yellow/20 p-3 rounded-[2px] text-cream/80 text-[12px] leading-relaxed">
                            {c.councilAdvice}
                          </div>
                        ) : <p className="text-muted">Ingen rådgivning endnu.</p>}
                        {c.trade && <p className="text-muted text-[11px] mt-2">Fag: {c.trade}</p>}
                        {c.notes && <p className="text-muted text-[11px] mt-1">{c.notes}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SENDTE MAILS ── */}
      {tab === "sent" && (
        <div>
          {/* Filter + refresh */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(["all", "lead", "contact"] as const).map((s) => {
                const count = s === "all"
                  ? sentEmails.length
                  : sentEmails.filter((e) => e.source === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setSentFilter(s)}
                    className={`font-condensed font-semibold text-[10px] tracking-[.15em] uppercase px-3 py-1.5 rounded-[2px] border transition-colors ${
                      sentFilter === s
                        ? "border-yellow bg-yellow/10 text-yellow"
                        : "border-[rgba(242,238,230,.1)] text-muted hover:text-cream"
                    }`}
                  >
                    {s === "all" ? `Alle (${count})` : s === "lead" ? `Lead-pipeline (${count})` : `Sarah-kontakter (${count})`}
                  </button>
                );
              })}
            </div>
            <button
              onClick={loadSentEmails}
              disabled={sentLoading}
              className="text-[10px] font-condensed font-bold tracking-[.12em] uppercase text-muted hover:text-yellow transition-colors disabled:opacity-50"
            >
              {sentLoading ? "..." : "↻ Opdatér"}
            </button>
          </div>

          {sentLoading && sentEmails.length === 0 ? (
            <p className="text-muted text-[13px]">Henter sendte mails...</p>
          ) : sentEmails.length === 0 ? (
            <p className="text-muted text-[13px]">Ingen mails er sendt endnu.</p>
          ) : (
            <div className="space-y-1">
              {sentEmails
                .filter((e) => sentFilter === "all" || e.source === sentFilter)
                .slice(0, 200)
                .map((e) => (
                <div key={e.id}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-[2px] border border-[rgba(242,238,230,.06)] bg-black2 hover:bg-white/[.02] cursor-pointer"
                    onClick={() => setExpandedSentId(expandedSentId === e.id ? null : e.id)}
                  >
                    <span className={`text-[10px] font-condensed font-bold tracking-[.1em] uppercase px-2 py-0.5 rounded-[2px] shrink-0 ${
                      e.source === "lead" ? "bg-yellow/15 text-yellow" : "bg-blue-500/15 text-blue-300"
                    }`}>
                      {e.source === "lead" ? "Lead" : "Kontakt"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-condensed font-bold text-[13px] text-cream truncate">
                        {e.recipientName || e.recipient}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {e.subject}
                        {e.industry ? ` · ${e.industry}` : ""}
                      </p>
                    </div>
                    {e.councilScore !== undefined && (
                      <span className={`text-[10px] font-condensed font-bold px-2 py-0.5 rounded-[2px] shrink-0 ${
                        e.councilScore >= 7 ? "bg-green-500/15 text-green-300"
                        : e.councilScore >= 5 ? "bg-yellow/15 text-yellow"
                        : "bg-red-500/15 text-red-300"
                      }`}>
                        {e.councilScore.toFixed(1)}
                      </span>
                    )}
                    {e.wasEdited && (
                      <span className="text-[10px] font-condensed text-purple-300 shrink-0" title={e.editSummary || "Rettet manuelt"}>
                        ✎ Rettet
                      </span>
                    )}
                    <p className="text-[11px] text-muted whitespace-nowrap shrink-0 hidden min-[700px]:block">
                      {new Date(e.sentAt).toLocaleString("da-DK", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {expandedSentId === e.id && (
                    <div className="border border-t-0 border-[rgba(242,238,230,.06)] bg-black p-4 rounded-b-[2px] grid grid-cols-2 max-[700px]:grid-cols-1 gap-4 text-[12px]">
                      <div className="space-y-2">
                        <p className="text-[10px] font-condensed font-bold tracking-[.15em] uppercase text-muted">Modtager</p>
                        <p className="text-cream"><span className="text-muted">Email:</span> {e.recipient}</p>
                        {e.recipientName && <p className="text-cream"><span className="text-muted">Navn:</span> {e.recipientName}</p>}
                        {e.city && <p className="text-cream"><span className="text-muted">By:</span> {e.city}</p>}
                        {e.phone && <p className="text-cream"><span className="text-muted">Tlf:</span> {e.phone}</p>}
                        {e.contactType && <p className="text-cream"><span className="text-muted">Type:</span> {e.contactType}</p>}
                        {e.contactTrade && <p className="text-cream"><span className="text-muted">Fag:</span> {e.contactTrade}</p>}
                        {e.industry && <p className="text-cream"><span className="text-muted">Branche:</span> {e.industry}</p>}
                        {e.serviceType && <p className="text-cream"><span className="text-muted">Service:</span> {e.serviceType}</p>}
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-condensed font-bold tracking-[.15em] uppercase text-muted">Mail-detaljer</p>
                        <p className="text-cream"><span className="text-muted">Sendt:</span> {new Date(e.sentAt).toLocaleString("da-DK")}</p>
                        <p className="text-cream"><span className="text-muted">Emne:</span> {e.subject}</p>
                        {e.angle && <p className="text-cream"><span className="text-muted">Vinkel:</span> {e.angle}</p>}
                        {e.tone && <p className="text-cream"><span className="text-muted">Tone:</span> {e.tone}</p>}
                        {e.bodyLength !== undefined && <p className="text-cream"><span className="text-muted">Længde:</span> {e.bodyLength} tegn</p>}
                        {e.councilScore !== undefined && <p className="text-cream"><span className="text-muted">Council-score:</span> {e.councilScore.toFixed(1)} / 10</p>}
                        {e.customerType && <p className="text-cream"><span className="text-muted">Kundetype:</span> {e.customerType}</p>}
                        {e.leadStatus && <p className="text-cream"><span className="text-muted">Lead-status:</span> {e.leadStatus}</p>}
                        {e.contactStatus && <p className="text-cream"><span className="text-muted">Kontakt-status:</span> {e.contactStatus}</p>}
                        {e.followUpSentAt && <p className="text-cream"><span className="text-muted">Opfølgning:</span> {new Date(e.followUpSentAt).toLocaleString("da-DK")}</p>}
                        {e.repliedAt && <p className="text-green-300"><span className="text-muted">✓ Svar:</span> {new Date(e.repliedAt).toLocaleString("da-DK")}</p>}
                        {e.wasEdited && e.editSummary && (
                          <div className="pt-2 mt-2 border-t border-[rgba(242,238,230,.06)]">
                            <p className="text-[10px] font-condensed font-bold tracking-[.15em] uppercase text-purple-300 mb-1">✎ Manuel redigering</p>
                            <p className="text-cream/80 text-[11px] leading-relaxed">{e.editSummary}</p>
                          </div>
                        )}
                      </div>
                      {e.bodyPreview && (
                        <div className="col-span-2">
                          <p className="text-[10px] font-condensed font-bold tracking-[.15em] uppercase text-muted mb-2">Body-preview</p>
                          <pre className="whitespace-pre-wrap text-cream/80 bg-white/[.03] p-3 rounded-[2px] text-[11px] leading-relaxed border border-[rgba(242,238,230,.05)]">
                            {e.bodyPreview}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {sentEmails.length > 200 && (
                <p className="text-muted text-[11px] mt-4 text-center font-condensed">
                  Viser de seneste 200 af {sentEmails.length} mails
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── INDBAKKE ── */}
      {!loading && tab === "inbox" && (
        <div>
          <p className="text-muted text-[13px] mb-6">
            Kontakter der har svaret — markér dem manuelt som &apos;replied&apos; via Kontakter-tabben, eller integrer webhook for auto-detektering.
          </p>
          {contacts.filter((c) => c.status === "replied").length === 0 ? (
            <p className="text-muted text-[13px]">Ingen svar endnu.</p>
          ) : (
            <div className="space-y-3">
              {contacts.filter((c) => c.status === "replied").map((c) => (
                <MeetingRow key={c.id} contact={c} onPropose={proposeMeeting} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LEADBOT ── */}
      {tab === "leadbot" && (
        <div className="space-y-8">
          {lbLoading && <p className="text-muted text-[13px]">Indlæser LeadBot-konfiguration…</p>}

          {lbConfig && (
            <>
              {/* Stats */}
              {lbTotals && (
                <div className="grid grid-cols-4 gap-3 max-[700px]:grid-cols-2">
                  <StatCard label="Batches" value={lbTotals.batches} />
                  <StatCard label="Modtagne leads" value={lbTotals.totalLeads} />
                  <StatCard label="Accepteret" value={lbTotals.accepted} color="bg-green-500/10" />
                  <StatCard label="Afvist" value={lbTotals.rejected} color="bg-red-500/10" />
                </div>
              )}

              {/* Focus-editor */}
              <div className="border border-[rgba(242,238,230,.08)] rounded-[4px] bg-black2 p-6">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="font-condensed font-black text-[20px] uppercase text-cream tracking-[-.01em]">
                      Fortæl LeadBot hvad vi leder efter
                    </h2>
                    <p className="text-muted text-[12px] mt-1">
                      Bot'en henter denne config hver gang den starter et scrape-loop.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {lbSaveOk && (
                      <span className="text-[11px] font-condensed font-bold tracking-[.1em] uppercase text-green-400">
                        {lbSaveOk}
                      </span>
                    )}
                    <button
                      onClick={saveLeadBotConfig}
                      disabled={lbSaving}
                      className="bg-yellow text-black font-condensed font-bold text-[11px] tracking-[.14em] uppercase px-5 py-2.5 rounded-[2px] hover:bg-yellow/90 disabled:opacity-50"
                    >
                      {lbSaving ? "Gemmer…" : "💾 Gem"}
                    </button>
                  </div>
                </div>

                {/* Fritekst-fokus */}
                <label className="block mb-5">
                  <span className="font-condensed font-semibold text-[11px] tracking-[.18em] uppercase text-yellow block mb-2">
                    Fokus (fritekst — Sarah læser dette højt for bot'en)
                  </span>
                  <textarea
                    value={lbConfig.focus}
                    onChange={(e) => setLbConfig({ ...lbConfig, focus: e.target.value })}
                    rows={4}
                    placeholder="Lige nu vil vi fokusere på malerfirmaer i Storkøbenhavn der er ved at ansætte. Spring forsikringsselskaber over."
                    className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-4 py-3 rounded-[2px] focus:border-yellow/60 focus:outline-none"
                  />
                </label>

                {/* Prioritet + Eksklud */}
                <div className="grid grid-cols-2 gap-4 mb-5 max-[700px]:grid-cols-1">
                  <ChipEditor
                    label="Prioritets-søgeord"
                    placeholder="malerfirma, facademaling, …"
                    items={lbConfig.priorityQueries}
                    onChange={(items) => setLbConfig({ ...lbConfig, priorityQueries: items })}
                    color="yellow"
                  />
                  <ChipEditor
                    label="Eksklud-søgeord"
                    placeholder="forsikring, advokat, …"
                    items={lbConfig.excludeQueries}
                    onChange={(items) => setLbConfig({ ...lbConfig, excludeQueries: items })}
                    color="red"
                  />
                </div>

                {/* Byer */}
                <ChipEditor
                  label="Geografi (byer/kommuner — tomt = hele DK)"
                  placeholder="København, Frederiksberg, Lyngby, …"
                  items={lbConfig.cities}
                  onChange={(items) => setLbConfig({ ...lbConfig, cities: items })}
                  color="blue"
                />

                {/* Lead-type focus */}
                <div className="mt-5">
                  <span className="font-condensed font-semibold text-[11px] tracking-[.18em] uppercase text-yellow block mb-2">
                    Lead-type fokus
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {(["company", "employee", "both"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setLbConfig({ ...lbConfig, leadTypeFocus: t })}
                        className={`font-condensed font-bold text-[11px] tracking-[.14em] uppercase px-4 py-2 rounded-[2px] border transition-colors ${
                          lbConfig.leadTypeFocus === t
                            ? "bg-yellow text-black border-yellow"
                            : "bg-black border-[rgba(242,238,230,.12)] text-muted hover:text-cream"
                        }`}
                      >
                        {t === "company" ? "🏢 Virksomheder" : t === "employee" ? "👷 Medarbejdere" : "🔄 Begge"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source toggles */}
                <div className="mt-6">
                  <span className="font-condensed font-semibold text-[11px] tracking-[.18em] uppercase text-yellow block mb-3">
                    Aktive kilder
                  </span>
                  <div className="grid grid-cols-4 gap-2 max-[700px]:grid-cols-2">
                    {(Object.keys(lbConfig.enabledSources) as Array<keyof typeof lbConfig.enabledSources>).map((src) => (
                      <label
                        key={src}
                        className={`flex items-center gap-2 px-3 py-2 rounded-[2px] border cursor-pointer transition-colors ${
                          lbConfig.enabledSources[src]
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-black border-[rgba(242,238,230,.08)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={lbConfig.enabledSources[src]}
                          onChange={(e) =>
                            setLbConfig({
                              ...lbConfig,
                              enabledSources: { ...lbConfig.enabledSources, [src]: e.target.checked },
                            })
                          }
                          className="accent-yellow"
                        />
                        <span className="font-condensed text-[12px] text-cream uppercase tracking-[.05em]">
                          {src}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Kvalitetsfilter */}
                <div className="grid grid-cols-2 gap-4 mt-6 max-[700px]:grid-cols-1">
                  <label className="block">
                    <span className="font-condensed font-semibold text-[11px] tracking-[.18em] uppercase text-yellow block mb-2">
                      Min email-confidence ({lbConfig.minEmailConfidence.toFixed(2)})
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={lbConfig.minEmailConfidence}
                      onChange={(e) =>
                        setLbConfig({ ...lbConfig, minEmailConfidence: parseFloat(e.target.value) })
                      }
                      className="w-full accent-yellow"
                    />
                  </label>
                  <label className="block">
                    <span className="font-condensed font-semibold text-[11px] tracking-[.18em] uppercase text-yellow block mb-2">
                      Max leads pr. døgn (0 = ubegrænset)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={lbConfig.dailyLeadCap}
                      onChange={(e) =>
                        setLbConfig({ ...lbConfig, dailyLeadCap: parseInt(e.target.value || "0", 10) })
                      }
                      className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-4 py-2 rounded-[2px] focus:border-yellow/60 focus:outline-none"
                    />
                  </label>
                </div>

                {lbConfig.updatedAt && lbConfig.updatedAt !== "1970-01-01T00:00:00.000Z" && (
                  <p className="text-[11px] text-muted mt-5">
                    Sidst opdateret {new Date(lbConfig.updatedAt).toLocaleString("da-DK")}
                    {lbConfig.updatedBy && ` af ${lbConfig.updatedBy}`}
                  </p>
                )}
              </div>

              {/* Recent batches */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h2 className="font-condensed font-black text-[16px] uppercase text-cream tracking-[.05em]">
                    Seneste batches
                  </h2>
                  <button
                    onClick={loadLeadBot}
                    className="text-[10px] font-condensed font-bold tracking-[.14em] uppercase text-muted hover:text-cream border border-[rgba(242,238,230,.12)] px-3 py-1.5 rounded-[2px]"
                  >
                    ↻ Opdater
                  </button>
                </div>
                {lbBatches.length === 0 ? (
                  <p className="text-muted text-[13px]">Ingen batches modtaget endnu. Når LeadBot poster til <code className="text-cream/80 bg-black2 px-1 rounded-[2px]">/api/leadbot/ingest</code> dukker de op her.</p>
                ) : (
                  <div className="space-y-2">
                    {lbBatches.map((b) => (
                      <div key={b.batchId} className="border border-[rgba(242,238,230,.05)] bg-black2 rounded-[2px] p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-muted font-mono truncate">{b.batchId}</p>
                            <p className="text-[12px] text-cream mt-1">
                              {new Date(b.receivedAt).toLocaleString("da-DK", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              <span className="text-muted"> · </span>
                              <span className="text-green-400 font-bold">{b.accepted} accepteret</span>
                              {b.rejected > 0 && (
                                <>
                                  <span className="text-muted"> · </span>
                                  <span className="text-red-400">{b.rejected} afvist</span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {Object.entries(b.sourceBreakdown).map(([src, n]) => (
                              <span key={src} className="text-[9px] font-condensed font-bold tracking-[.08em] uppercase bg-white/5 text-cream/70 px-1.5 py-0.5 rounded-[2px]">
                                {src} {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── LOG ── */}
      {!loading && tab === "log" && (
        <div>
          {log.length === 0 ? (
            <p className="text-muted text-[13px]">Loggen er tom endnu.</p>
          ) : (
            <div className="space-y-1">
              {log.slice(0, 100).map((l) => (
                <div key={l.id} className="flex items-start gap-4 p-3 border border-[rgba(242,238,230,.05)] rounded-[2px] bg-black2">
                  <p className="text-[11px] text-muted whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString("da-DK", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <span className={`text-[10px] font-condensed font-bold tracking-[.1em] uppercase px-2 py-0.5 rounded-[2px] shrink-0 ${
                    l.action === "email_sent" ? "bg-blue-500/20 text-blue-300"
                    : l.action === "followup_sent" ? "bg-yellow/20 text-yellow"
                    : l.action === "reply_received" ? "bg-green-500/20 text-green-300"
                    : l.action === "meeting_created" ? "bg-purple-500/20 text-purple-300"
                    : "bg-white/10 text-cream/60"
                  }`}>
                    {l.action.replace("_", " ")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-cream truncate">{l.contactName}</p>
                    {l.details && <p className="text-[11px] text-muted truncate">{l.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChipEditor({
  label,
  placeholder,
  items,
  onChange,
  color = "yellow",
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (next: string[]) => void;
  color?: "yellow" | "red" | "blue";
}) {
  const [draft, setDraft] = useState("");
  const colorClass =
    color === "red"
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : color === "blue"
      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
      : "bg-yellow/15 text-yellow border-yellow/30";

  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...items, ...parts]));
    onChange(next);
    setDraft("");
  };

  return (
    <div>
      <span className="font-condensed font-semibold text-[11px] tracking-[.18em] uppercase text-yellow block mb-2">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((it) => (
          <span
            key={it}
            className={`inline-flex items-center gap-1.5 text-[11px] font-condensed font-bold tracking-[.05em] px-2 py-1 rounded-[2px] border ${colorClass}`}
          >
            {it}
            <button
              onClick={() => onChange(items.filter((x) => x !== it))}
              className="hover:text-cream text-cream/60"
              aria-label={`Fjern ${it}`}
            >
              ×
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-[11px] text-muted italic">Ingen — tilføj nedenfor</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] focus:border-yellow/60 focus:outline-none"
        />
        <button
          onClick={() => add(draft)}
          className="bg-white/10 hover:bg-white/20 text-cream font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-3 py-2 rounded-[2px]"
        >
          + Tilføj
        </button>
      </div>
    </div>
  );
}

function MeetingRow({ contact, onPropose }: { contact: SarahContact; onPropose: (id: string, time: string) => void }) {
  const [time, setTime] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="border border-[rgba(242,238,230,.08)] bg-black2 p-4 rounded-[2px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <p className="font-condensed font-bold text-[13px] text-cream">{contact.name}</p>
          <p className="text-[11px] text-muted">{contact.company} · {contact.email}</p>
        </div>
        <Badge status={contact.status} />
      </div>
      {!sent ? (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-black border border-[rgba(242,238,230,.12)] text-cream text-[12px] px-3 py-2 rounded-[2px] font-condensed"
          />
          <button
            onClick={() => { if (time) { onPropose(contact.id, time); setSent(true); } }}
            className="bg-yellow text-black font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow/90"
          >
            📅 Foreslå møde
          </button>
        </div>
      ) : (
        <p className="text-green-400 text-[12px] font-condensed">✓ Møde foreslået</p>
      )}
    </div>
  );
}
