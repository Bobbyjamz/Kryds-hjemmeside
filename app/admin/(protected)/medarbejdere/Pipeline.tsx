"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lead, Employee } from "@/lib/types";

// ── Stage-definition ────────────────────────────────────────────────────────

type Stage = "ny" | "udkast" | "kontaktet" | "afventer" | "aktiv";

const STAGES: { id: Stage; label: string; description: string }[] = [
  { id: "ny",        label: "Ny kandidat",      description: "Fundet af LeadBot — ingen kontakt sendt" },
  { id: "udkast",    label: "Udkast klar",       description: "Sarah har skrevet email — afventer afsendelse" },
  { id: "kontaktet", label: "Kontaktet",          description: "Email sendt — afventer svar" },
  { id: "afventer",  label: "Afventer kontrakt",  description: "Registreret — mangler at acceptere vilkår" },
  { id: "aktiv",     label: "Aktiv",              description: "Ledig eller udsendt" },
];

function stageOfLead(lead: Lead): Stage {
  if (lead.status === "Sent") return "kontaktet";
  if (lead.status === "Drafted") return "udkast";
  return "ny";
}

function stageOfEmployee(e: Employee): Stage {
  if (e.status === "AFVENTER_BEKRÆFTELSE") return "afventer";
  return "aktiv";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function FunnelBar({
  stages,
  counts,
  active,
  onSelect,
}: {
  stages: typeof STAGES;
  counts: Record<Stage, number>;
  active: Stage;
  onSelect: (s: Stage) => void;
}) {
  return (
    <div className="flex gap-1 mb-8 flex-wrap">
      {stages.map((s, i) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex-1 min-w-[100px] text-left p-3 rounded-[2px] border transition-colors ${
              isActive
                ? "bg-yellow/10 border-yellow/60 text-yellow"
                : "bg-gray border-[rgba(242,238,230,0.07)] text-muted hover:border-[rgba(242,238,230,0.2)] hover:text-cream"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-condensed text-[9px] tracking-[.18em] uppercase">
                {i + 1}. {s.label}
              </span>
              {i < stages.length - 1 && (
                <span className="text-muted text-[10px] ml-1">→</span>
              )}
            </div>
            <span className={`font-condensed font-black text-[28px] leading-none ${isActive ? "text-yellow" : "text-cream"}`}>
              {counts[s.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Pipeline-komponent ───────────────────────────────────────────────────────

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<Stage>("ny");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [leadsRes, empRes] = await Promise.all([
      fetch("/api/admin/leads/upload"),
      fetch("/api/admin/employees"),
    ]);
    if (leadsRes.ok) {
      const d = await leadsRes.json();
      setLeads((d.leads as Lead[]).filter((l) => l.leadType === "employee"));
    }
    if (empRes.ok) {
      const d = await empRes.json();
      setEmployees(d.employees as Employee[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Tæl leads/medarbejdere per stage ──────────────────────────────────────
  const counts: Record<Stage, number> = {
    ny:        leads.filter((l) => stageOfLead(l) === "ny").length,
    udkast:    leads.filter((l) => stageOfLead(l) === "udkast").length,
    kontaktet: leads.filter((l) => stageOfLead(l) === "kontaktet").length,
    afventer:  employees.filter((e) => stageOfEmployee(e) === "afventer").length,
    aktiv:     employees.filter((e) => stageOfEmployee(e) === "aktiv").length,
  };

  // ── Aktions ───────────────────────────────────────────────────────────────

  async function generateDraft(leadId: string) {
    setActionLoading(leadId);
    setActionMsg(null);
    const r = await fetch("/api/admin/leads/sarah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const d = await r.json();
    if (r.ok) {
      setActionMsg({ id: leadId, ok: true, text: "✓ Udkast genereret — skift til 'Udkast klar'" });
      await load();
      setActiveStage("udkast");
    } else {
      setActionMsg({ id: leadId, ok: false, text: `Fejl: ${d.error}` });
    }
    setActionLoading(null);
  }

  async function sendEmail(leadId: string) {
    setActionLoading(leadId);
    setActionMsg(null);
    const r = await fetch("/api/admin/leads/sarah", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, action: "send" }),
    });
    const d = await r.json();
    if (r.ok) {
      setActionMsg({ id: leadId, ok: true, text: "✓ Email sendt — kandidaten er nu kontaktet" });
      await load();
      setActiveStage("kontaktet");
    } else {
      setActionMsg({ id: leadId, ok: false, text: `Fejl: ${d.error}` });
    }
    setActionLoading(null);
  }

  async function convertToEmployee(leadId: string) {
    setActionLoading(leadId);
    setActionMsg(null);
    const r = await fetch("/api/admin/employees/from-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const d = await r.json();
    if (r.ok) {
      setActionMsg({ id: leadId, ok: true, text: "✓ Konverteret til medarbejder — sender /tilmeld link nu" });
      await load();
      setActiveStage("afventer");
    } else {
      setActionMsg({ id: leadId, ok: false, text: `Fejl: ${d.error}` });
    }
    setActionLoading(null);
  }

  async function activateEmployee(empId: string) {
    setActionLoading(empId);
    setActionMsg(null);
    const r = await fetch(`/api/admin/employees/${empId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LEDIG", acceptedTerms: true }),
    });
    if (r.ok) {
      setActionMsg({ id: empId, ok: true, text: "✓ Aktiveret — medarbejder er nu ledig" });
      await load();
      setActiveStage("aktiv");
    } else {
      setActionMsg({ id: empId, ok: false, text: "Fejl: kunne ikke aktivere" });
    }
    setActionLoading(null);
  }

  // ── Nuværende stages indhold ───────────────────────────────────────────────

  const stageDef = STAGES.find((s) => s.id === activeStage)!;

  const nyLeads        = leads.filter((l) => stageOfLead(l) === "ny");
  const udkastLeads    = leads.filter((l) => stageOfLead(l) === "udkast");
  const kontaktetLeads = leads.filter((l) => stageOfLead(l) === "kontaktet");
  const afventerEmps   = employees.filter((e) => stageOfEmployee(e) === "afventer");
  const aktivEmps      = employees.filter((e) => stageOfEmployee(e) === "aktiv");

  if (loading) return <p className="text-muted text-[13px]">Indlæser pipeline…</p>;

  return (
    <div>
      {/* Intro */}
      <div className="mb-6">
        <p className="text-[13px] text-muted">
          Fra LeadBot-kandidat til aktiv medarbejder. Klik en fase for at se og handle.
        </p>
      </div>

      {/* Funnel */}
      <FunnelBar stages={STAGES} counts={counts} active={activeStage} onSelect={setActiveStage} />

      {/* Global besked */}
      {actionMsg && (
        <div className={`mb-4 p-3 rounded-[2px] text-[13px] font-condensed ${
          actionMsg.ok
            ? "bg-green-500/10 border border-green-500/30 text-green-300"
            : "bg-red-500/10 border border-red-500/30 text-red-300"
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Stage header */}
      <div className="mb-5">
        <h2 className="font-condensed font-black text-[22px] uppercase tracking-[-.01em] text-cream leading-none">
          {stageDef.label}
          <span className="ml-3 text-yellow">{counts[activeStage]}</span>
        </h2>
        <p className="text-[12px] text-muted mt-1">{stageDef.description}</p>
      </div>

      {/* ── NY ── */}
      {activeStage === "ny" && (
        <div className="space-y-1">
          {nyLeads.length === 0 ? (
            <p className="text-muted text-[13px] p-4 bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
              Ingen nye kandidater. LeadBot finder automatisk nye kandidater dagligt.
            </p>
          ) : nyLeads.map((lead) => (
            <div key={lead.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="font-condensed font-bold text-[14px] text-cream">
                  {lead.contactName || lead.companyName}
                </p>
                <p className="text-[11px] text-muted mt-1">
                  {lead.serviceType || lead.industry || "Fag ukendt"}
                  {lead.city ? ` · ${lead.city}` : ""}
                  {lead.email ? ` · ${lead.email}` : ""}
                </p>
                {lead.personalAngle && (
                  <p className="text-[11px] text-cream/60 mt-1 italic">&quot;{lead.personalAngle}&quot;</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {actionLoading === lead.id ? (
                  <span className="text-[11px] text-muted font-condensed">Sarah skriver…</span>
                ) : (
                  <button
                    onClick={() => generateDraft(lead.id)}
                    className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow/90 transition-colors"
                  >
                    ✍ Lav Sarah-udkast
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── UDKAST ── */}
      {activeStage === "udkast" && (
        <div className="space-y-1">
          {udkastLeads.length === 0 ? (
            <p className="text-muted text-[13px] p-4 bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
              Ingen udkast klar. Gå til &apos;Ny kandidat&apos; og lad Sarah skrive.
            </p>
          ) : udkastLeads.map((lead) => (
            <div key={lead.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-condensed font-bold text-[14px] text-cream">
                    {lead.contactName || lead.companyName}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {lead.serviceType || lead.industry || "Fag ukendt"}
                    {lead.city ? ` · ${lead.city}` : ""}
                    {lead.email ? ` · ${lead.email}` : ""}
                  </p>
                  {lead.draftSubject && (
                    <p className="text-[11px] text-yellow mt-2 font-condensed">
                      Emne: {lead.draftSubject}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {actionLoading === lead.id ? (
                    <span className="text-[11px] text-muted font-condensed">Sender…</span>
                  ) : (
                    <>
                      <button
                        onClick={() => sendEmail(lead.id)}
                        className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow/90 transition-colors"
                      >
                        ✉ Send email
                      </button>
                      <button
                        onClick={() => convertToEmployee(lead.id)}
                        className="border border-[rgba(242,238,230,.2)] text-cream font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:border-yellow hover:text-yellow transition-colors"
                      >
                        → Konverter direkte
                      </button>
                    </>
                  )}
                </div>
              </div>
              {lead.draftBody && (
                <div className="bg-black/40 border border-[rgba(242,238,230,0.06)] rounded-[2px] p-3">
                  <p className="text-[11px] text-muted font-condensed uppercase tracking-[.12em] mb-2">Udkast-preview</p>
                  <p className="text-[12px] text-cream/80 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {lead.draftBody.slice(0, 300)}{lead.draftBody.length > 300 ? "…" : ""}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── KONTAKTET ── */}
      {activeStage === "kontaktet" && (
        <div className="space-y-1">
          {kontaktetLeads.length === 0 ? (
            <p className="text-muted text-[13px] p-4 bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
              Ingen kontaktede kandidater endnu.
            </p>
          ) : kontaktetLeads.map((lead) => {
            const sentDaysAgo = lead.sentAt
              ? Math.floor((Date.now() - new Date(lead.sentAt).getTime()) / 86400000)
              : null;
            return (
              <div key={lead.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4 flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-condensed font-bold text-[14px] text-cream">
                    {lead.contactName || lead.companyName}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {lead.serviceType || lead.industry || "Fag ukendt"}
                    {lead.email ? ` · ${lead.email}` : ""}
                    {sentDaysAgo !== null && (
                      <span className={sentDaysAgo >= 5 ? " text-yellow" : ""}>
                        {` · Sendt for ${sentDaysAgo} dag${sentDaysAgo === 1 ? "" : "e"} siden`}
                      </span>
                    )}
                  </p>
                  {lead.emailOpened && (
                    <p className="text-[11px] text-green-400 mt-1">✓ Email åbnet</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {actionLoading === lead.id ? (
                    <span className="text-[11px] text-muted font-condensed">Konverterer…</span>
                  ) : (
                    <button
                      onClick={() => convertToEmployee(lead.id)}
                      className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow/90 transition-colors"
                    >
                      → Konverter til medarbejder
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── AFVENTER KONTRAKT ── */}
      {activeStage === "afventer" && (
        <div className="space-y-1">
          {afventerEmps.length === 0 ? (
            <p className="text-muted text-[13px] p-4 bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
              Ingen afventer kontrakt.
            </p>
          ) : afventerEmps.map((emp) => (
            <div key={emp.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="font-condensed font-bold text-[14px] text-cream">{emp.name}</p>
                <p className="text-[11px] text-muted mt-1">
                  {emp.trade} · {emp.phone}
                  {emp.email ? ` · ${emp.email}` : ""}
                </p>
                <p className="text-[11px] text-orange-300 mt-1">
                  Registreret {new Date(emp.createdAt).toLocaleDateString("da-DK")} — mangler kontrakt-godkendelse
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {actionLoading === emp.id ? (
                  <span className="text-[11px] text-muted font-condensed">Aktiverer…</span>
                ) : (
                  <>
                    <button
                      onClick={() => activateEmployee(emp.id)}
                      className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow/90 transition-colors"
                    >
                      ✓ Aktivér manuelt
                    </button>
                    {emp.email && (
                      <a
                        href={`mailto:${emp.email}?subject=Tilmeld%20dig%20KrydsByg&body=Hej%20${encodeURIComponent(emp.name)}%2C%0A%0AGå%20til%20krydsbyg.com%2Ftilmeld%20og%20acceptér%20dine%20vilkår.`}
                        className="border border-[rgba(242,238,230,.2)] text-cream font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:border-yellow hover:text-yellow transition-colors"
                      >
                        ✉ Send /tilmeld-link
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AKTIV ── */}
      {activeStage === "aktiv" && (
        <div className="space-y-1">
          {aktivEmps.length === 0 ? (
            <p className="text-muted text-[13px] p-4 bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]">
              Ingen aktive medarbejdere endnu.
            </p>
          ) : aktivEmps.map((emp) => (
            <div key={emp.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="font-condensed font-bold text-[14px] text-cream">{emp.name}</p>
                <p className="text-[11px] text-muted mt-1">
                  {emp.trade} · {emp.phone}
                </p>
              </div>
              <span className={`text-[10px] font-condensed font-bold uppercase tracking-[.12em] px-2 py-1 rounded-[2px] flex-shrink-0 ${
                emp.status === "LEDIG"
                  ? "bg-yellow/20 text-yellow border border-yellow/30"
                  : "bg-cream/10 text-cream border border-cream/20"
              }`}>
                {emp.status === "LEDIG" ? "Ledig" : "Udsendt"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Konverteringsrate */}
      {(leads.length > 0 || employees.length > 0) && (
        <div className="mt-10 pt-6 border-t border-[rgba(242,238,230,0.07)]">
          <p className="font-condensed text-[11px] uppercase tracking-[.15em] text-muted mb-3">
            Pipeline-statistik
          </p>
          <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
            {[
              {
                label: "Konverteringsrate",
                value: leads.length > 0
                  ? `${Math.round(((counts.afventer + counts.aktiv) / leads.length) * 100)}%`
                  : "—",
                sub: "Kandidater → Medarbejder",
              },
              {
                label: "Klar til afsendelse",
                value: counts.udkast,
                sub: "Sarah-udkast afventer",
              },
              {
                label: "Total i pipeline",
                value: leads.length + counts.afventer + counts.aktiv,
                sub: `${leads.length} leads · ${counts.afventer + counts.aktiv} medarb.`,
              },
            ].map((s) => (
              <div key={s.label} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4">
                <p className="text-[10px] font-condensed uppercase tracking-[.15em] text-muted mb-1">{s.label}</p>
                <p className="font-condensed font-black text-[28px] text-yellow leading-none">{s.value}</p>
                <p className="text-[11px] text-muted mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
