"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TRADES } from "@/lib/constants";
import type { Employee } from "@/lib/types";
import Pipeline from "./Pipeline";

const STATUS_LABELS: Record<string, string> = {
  LEDIG: "Ledig",
  UDSENDT: "Udsendt",
  INAKTIV: "Inaktiv",
  AFVENTER_BEKRÆFTELSE: "Afventer ✋",
};

const TYPE_LABELS: Record<string, string> = {
  MEDARBEJDER: "Medarbejder",
  KOORDINATOR: "Koordinator",
};

export default function MedarbejdereListPage() {
  const [mainTab, setMainTab] = useState<"oversigt" | "pipeline">("oversigt");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    requiresConfirmation: boolean;
    preview?: Record<string, string>[];
    totalRows?: number;
    autoMapping?: Record<string, string>;
    headers?: string[];
  } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/employees");
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.employees);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteOne = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne medarbejder?")) return;
    const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  async function handleUploadFile(f: File) {
    setFile(f);
    setUploadResult(null);
    setUploadLoading(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await fetch("/api/admin/employees/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.requiresConfirmation) {
        setPreview(d);
      } else if (d.ok) {
        setUploadResult(`✓ ${d.imported} medarbejdere importeret, ${d.skipped} dubletter sprunget over`);
        await load();
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
      const r = await fetch("/api/admin/employees/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) {
        setUploadResult(`✓ ${d.imported} medarbejdere importeret, ${d.skipped} dubletter sprunget over`);
        await load();
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

  async function activateEmployee(id: string) {
    // Aktiver medarbejder manuelt (sætter status fra AFVENTER_BEKRÆFTELSE → LEDIG)
    const r = await fetch(`/api/admin/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LEDIG", acceptedTerms: true }),
    });
    if (r.ok) load();
    else alert("Kunne ikke aktivere medarbejder");
  }

  // Bulk-generér onboarding-udkast for alle Afventer-medarbejdere
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  async function bulkGenerateOnboarding() {
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const r = await fetch("/api/admin/employees/onboarding", { method: "PUT" });
      const d = await r.json();
      if (d.ok) {
        setBulkResult(`✓ ${d.generated} udkast genereret — gå ind på hver medarbejder og bekræft afsendelse`);
        await load();
      } else {
        setBulkResult(`Fejl: ${d.error || "ukendt"}`);
      }
    } catch {
      setBulkResult("Netværksfejl");
    }
    setBulkLoading(false);
    setTimeout(() => setBulkResult(null), 12000);
  }

  const filtered = employees.filter((e) => {
    if (tradeFilter !== "ALL" && e.trade !== tradeFilter) return false;
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.phone.includes(q)) return false;
    }
    return true;
  });

  const inputClass =
    "bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[14px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";

  return (
    <div>
      <div className="mb-6 max-[700px]:mb-4 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">
            {mainTab === "pipeline" ? "Rekruttering" : "Oversigt"}
          </p>
          <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[32px] uppercase tracking-[-.01em] text-cream leading-none">Medarbejdere</h1>
        </div>
        {mainTab === "oversigt" && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/tilmeld"
              className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] hover:bg-yellow2 transition-colors inline-flex items-center justify-center"
              style={{ minHeight: 44 }}
            >
              + Ny tilmelding
            </Link>
            <button
              onClick={() => { setUploadOpen(true); setPreview(null); setUploadResult(null); setFile(null); }}
              className="border border-[rgba(242,238,230,.2)] text-cream font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] hover:border-yellow hover:text-yellow transition-colors inline-flex items-center justify-center"
              style={{ minHeight: 44 }}
            >
              Upload Excel
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(242,238,230,.07)] mb-8 gap-0">
        {([
          { id: "oversigt", label: "Medarbejdere" },
          { id: "pipeline", label: "Rekrutterings-pipeline" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id)}
            className={`font-condensed font-semibold text-[11px] tracking-[.18em] uppercase px-5 py-3 border-b-2 transition-colors ${
              mainTab === t.id
                ? "border-yellow text-cream"
                : "border-transparent text-muted hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pipeline-tab */}
      {mainTab === "pipeline" && <Pipeline />}

      {/* Oversigt-tab: Status-overblik */}
      {mainTab === "oversigt" && (<>
      {!loading && employees.length > 0 && (
        <div className="grid grid-cols-4 max-[700px]:grid-cols-2 gap-3 mb-6">
          {[
            { key: "LEDIG", label: "Ledige", color: "text-yellow border-yellow/40 bg-yellow/5" },
            { key: "UDSENDT", label: "Udsendt", color: "text-cream border-cream/20 bg-cream/5" },
            { key: "AFVENTER_BEKRÆFTELSE", label: "Afventer ✋", color: "text-orange-300 border-orange-400/30 bg-orange-400/5" },
            { key: "INAKTIV", label: "Inaktiv", color: "text-muted border-muted/20 bg-muted/5" },
          ].map((s) => {
            const count = employees.filter((e) => e.status === s.key).length;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(statusFilter === s.key ? "ALL" : s.key)}
                className={`text-left p-3 rounded-[2px] border transition-colors ${
                  statusFilter === s.key ? s.color : "bg-gray border-[rgba(242,238,230,0.07)] hover:border-[rgba(242,238,230,0.2)]"
                }`}
              >
                <p className="font-condensed text-[10px] tracking-[.18em] uppercase text-muted mb-1">{s.label}</p>
                <p className={`font-condensed font-black text-[24px] ${statusFilter === s.key ? "" : "text-cream"}`}>{count}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Afventer-bekræftelse banner */}
      {!loading && (() => {
        const afventer = employees.filter((e) => e.status === "AFVENTER_BEKRÆFTELSE");
        const utenUdkast = afventer.filter((e) => e.email && !e.onboardingDraftBody && !e.onboardingSentAt);
        if (afventer.length === 0) return null;
        return (
          <div className="mb-6 p-4 rounded-[2px] border border-orange-400/30 bg-orange-400/5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[260px]">
                <p className="font-condensed font-bold text-[11px] tracking-[.1em] uppercase text-orange-300 mb-2">
                  ⚠ {afventer.length} medarbejder{afventer.length === 1 ? "" : "e"} afventer bekræftelse
                </p>
                <p className="text-orange-200 text-[12px] leading-[1.6]">
                  Sarah kan skrive personlige onboarding-mails som du bekræfter inden afsendelse.
                  {utenUdkast.length > 0 && <span className="block mt-1 text-orange-300 font-bold">→ {utenUdkast.length} mangler udkast lige nu</span>}
                </p>
              </div>
              {utenUdkast.length > 0 && (
                <button
                  onClick={bulkGenerateOnboarding}
                  disabled={bulkLoading}
                  className="bg-orange-400 text-black font-condensed font-extrabold text-[11px] tracking-[.1em] uppercase px-4 py-2 rounded-[2px] hover:bg-orange-300 disabled:opacity-50"
                >
                  {bulkLoading ? "Sarah skriver..." : `✍ Lav udkast til ${Math.min(utenUdkast.length, 15)}`}
                </button>
              )}
            </div>
            {bulkResult && (
              <p className={`mt-3 text-[12px] font-condensed ${bulkResult.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{bulkResult}</p>
            )}
          </div>
        );
      })()}

      <div className="flex gap-3 mb-6 flex-wrap max-[500px]:flex-col">
        <input
          className={inputClass + " w-[260px] max-[500px]:w-full"}
          style={{ minHeight: 44 }}
          placeholder="Søg navn eller telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass + " cursor-pointer max-[500px]:w-full"} style={{ minHeight: 44 }} value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)}>
          <option value="ALL">Alle fag</option>
          {Object.entries(TRADES).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select className={inputClass + " cursor-pointer max-[500px]:w-full"} style={{ minHeight: 44 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Alle status</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Mobile cards (< 700px) ── */}
      <div className="hidden max-[700px]:flex flex-col gap-3">
        {loading ? (
          <p className="p-6 text-muted text-center bg-gray rounded-[2px]">Indlæser...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-muted text-center bg-gray rounded-[2px]">Ingen medarbejdere</p>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[6px] p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/medarbejdere/${e.id}`} className="flex-1 min-w-0">
                  <p className="text-[16px] text-cream font-semibold truncate">{e.name}</p>
                  <p className="text-[11px] text-muted uppercase tracking-[.1em] font-condensed mt-[2px]">
                    {TRADES[e.trade as keyof typeof TRADES] || e.trade} · {TYPE_LABELS[e.employeeType] || e.employeeType}
                  </p>
                </Link>
                <span className={`text-[10px] font-condensed uppercase tracking-[.12em] px-2 py-1 rounded-[2px] flex-shrink-0 ${
                  e.status === "LEDIG" ? "bg-yellow/20 text-yellow" :
                  e.status === "UDSENDT" ? "bg-cream/10 text-cream" :
                  "bg-muted/10 text-muted"
                }`}>
                  {STATUS_LABELS[e.status]}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-muted">
                <a href={`tel:${e.phone}`} className="text-cream truncate">{e.phone}</a>
                <span>{new Date(e.createdAt).toLocaleDateString("da-DK")}</span>
              </div>
              <div className="flex gap-2 mt-1">
                {e.status === "AFVENTER_BEKRÆFTELSE" && (
                  <button
                    onClick={() => activateEmployee(e.id)}
                    className="flex-1 text-center font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-orange-300 border border-orange-400/40 rounded-[4px] bg-orange-400/10"
                    style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ✓ Aktivér
                  </button>
                )}
                <Link
                  href={`/admin/medarbejdere/${e.id}`}
                  className="flex-1 text-center font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-yellow border border-[rgba(245,196,0,.3)] rounded-[4px]"
                  style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  Åbn →
                </Link>
                <button
                  onClick={() => deleteOne(e.id)}
                  className="px-4 font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-muted border border-[rgba(242,238,230,.08)] rounded-[4px] hover:text-red-400 hover:border-red-400/40"
                  style={{ minHeight: 44 }}
                >
                  Slet
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table (≥ 700px) ── */}
      <div className="max-[700px]:hidden bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(242,238,230,0.07)]">
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Navn</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Fag</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Type</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Status</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Telefon</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Oprettet</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-muted text-center">Indlæser...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-muted text-center">Ingen medarbejdere</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-b border-[rgba(242,238,230,0.04)] hover:bg-[rgba(245,196,0,.03)]">
                  <td className="p-4">
                    <Link href={`/admin/medarbejdere/${e.id}`} className="text-cream hover:text-yellow">
                      {e.name}
                    </Link>
                  </td>
                  <td className="p-4 text-muted text-[14px]">{TRADES[e.trade as keyof typeof TRADES] || e.trade}</td>
                  <td className="p-4 text-muted text-[14px]">{TYPE_LABELS[e.employeeType] || e.employeeType}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-condensed uppercase tracking-[.12em] px-2 py-1 rounded-[2px] ${
                      e.status === "LEDIG" ? "bg-yellow/20 text-yellow" :
                      e.status === "UDSENDT" ? "bg-cream/10 text-cream" :
                      e.status === "AFVENTER_BEKRÆFTELSE" ? "bg-orange-400/15 text-orange-300 border border-orange-400/30" :
                      "bg-muted/10 text-muted"
                    }`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="p-4 text-muted text-[14px]">{e.phone}</td>
                  <td className="p-4 text-muted text-[13px]">{new Date(e.createdAt).toLocaleDateString("da-DK")}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {e.status === "AFVENTER_BEKRÆFTELSE" && (
                        <button
                          onClick={() => activateEmployee(e.id)}
                          className="text-[11px] font-condensed font-bold uppercase tracking-[.12em] text-orange-300 hover:text-orange-200 border border-orange-400/30 px-2 py-1 rounded-[2px] hover:bg-orange-400/10"
                          title="Aktivér uden at vente på selv-bekræftelse"
                        >
                          ✓ Aktivér
                        </button>
                      )}
                      <button
                        onClick={() => deleteOne(e.id)}
                        className="text-[11px] font-condensed uppercase tracking-[.12em] text-muted hover:text-red-400"
                      >
                        Slet
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </>)}

      {/* Upload modal — tilgængeligt uanset tab */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,12,10,.85)" }}>
          <div className="bg-gray border border-[rgba(242,238,230,0.1)] rounded-[2px] w-full max-w-[640px] p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-condensed font-semibold text-[10px] tracking-[.22em] uppercase text-yellow mb-1">Bulk-import</p>
                <h2 className="font-condensed font-black text-[20px] uppercase text-cream">Upload medarbejdere</h2>
              </div>
              <button onClick={() => setUploadOpen(false)} className="text-muted hover:text-cream text-[20px] leading-none">✕</button>
            </div>

            <div className="mb-4 p-3 bg-[rgba(245,196,0,.06)] border border-yellow/20 rounded-[2px]">
              <p className="text-cream/80 text-[12px] leading-[1.6]">
                Upload en Excel/CSV med kolonner: <span className="text-yellow font-bold">Navn, Telefon</span> (påkrævet) og evt.
                Email, Fag, Fødselsdato, By, Færdigheder, Erfaring, Noter.
                <br/><br/>
                Importerede medarbejdere får status <span className="text-orange-300 font-bold">&quot;Afventer&quot;</span> indtil de accepterer kontrakten via /tilmeld
                eller du aktiverer dem manuelt.
              </p>
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
                  <span className="text-yellow font-bold">{preview.totalRows} rækker</span> fundet i <span className="text-cream">{file?.name}</span>. Bekræft mapping:
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[rgba(242,238,230,0.07)]">
                        {["Navn", "Telefon", "Email", "Fag", "By"].map((h) => (
                          <th key={h} className="text-left text-muted font-condensed tracking-[.12em] uppercase py-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview?.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-[rgba(242,238,230,0.04)]">
                          <td className="py-2 pr-4 text-cream">{row.name || "–"}</td>
                          <td className="py-2 pr-4 text-cream">{row.phone || "–"}</td>
                          <td className="py-2 pr-4 text-muted">{row.email || "–"}</td>
                          <td className="py-2 pr-4 text-muted">{row.trade || "–"}</td>
                          <td className="py-2 text-muted">{row.city || "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  <button onClick={confirmImport} disabled={uploadLoading} className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase px-6 py-3 hover:bg-yellow2 transition-colors disabled:opacity-50">
                    {uploadLoading ? "Importerer..." : `Importer ${preview.totalRows} medarbejdere`}
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
    </div>
  );
}
