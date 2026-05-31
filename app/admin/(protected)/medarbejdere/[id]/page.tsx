"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TRADES } from "@/lib/constants";
import type { Employee } from "@/lib/types";

const STATUSES = ["LEDIG", "UDSENDT", "INAKTIV", "AFVENTER_BEKRÆFTELSE"] as const;
const TYPES = ["MEDARBEJDER", "KOORDINATOR"] as const;

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Onboarding-mail state — SKAL stå før early returns (Rules of Hooks)
  const [onboardingLoading, setOnboardingLoading] = useState<string | null>(null);
  const [onboardingEditing, setOnboardingEditing] = useState(false);
  const [editedOnboardingSubject, setEditedOnboardingSubject] = useState("");
  const [editedOnboardingBody, setEditedOnboardingBody] = useState("");

  useEffect(() => {
    fetch(`/api/admin/employees/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.employee) setEmployee(d.employee);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-muted">Indlæser...</p>;
  if (!employee) return <p className="text-muted">Medarbejder ikke fundet</p>;

  const update = (patch: Partial<Employee>) => setEmployee({ ...employee, ...patch });

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });
    if (res.ok) setMessage("Gemt");
    else setMessage("Kunne ikke gemme");
    setSaving(false);
  };

  const del = async () => {
    if (!confirm("Slet denne medarbejder permanent?")) return;
    const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/medarbejdere");
  };

  // ── Onboarding-mail (Sarah skriver, du bekræfter) ──────────────────────
  async function generateOnboarding(regenerate = false) {
    if (!employee?.email) { setMessage("Tilføj email først"); return; }
    setOnboardingLoading("generate");
    try {
      const r = await fetch("/api/admin/employees/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id, regenerate }),
      });
      const d = await r.json();
      if (d.ok) {
        setEmployee({ ...employee, onboardingDraftSubject: d.subject, onboardingDraftBody: d.body, onboardingDraftCreatedAt: new Date().toISOString() });
        setMessage("Udkast genereret — gennemse og bekræft inden afsendelse");
      } else {
        setMessage(`Fejl: ${d.error}`);
      }
    } catch {
      setMessage("Netværksfejl");
    }
    setOnboardingLoading(null);
  }

  async function patchOnboarding(action: string, extras?: Record<string, string>) {
    setOnboardingLoading(action);
    try {
      const r = await fetch("/api/admin/employees/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id, action, ...extras }),
      });
      const d = await r.json();
      if (d.ok) {
        // Refresh employee
        const er = await fetch(`/api/admin/employees/${id}`);
        if (er.ok) {
          const { employee: fresh } = await er.json();
          setEmployee(fresh);
        }
        if (action === "send") setMessage("✓ Onboarding-mail sendt!");
        else if (action === "approve") setMessage("Godkendt — klar til afsendelse");
        else if (action === "reject") setMessage("Udkast slettet");
        else if (action === "edit") { setMessage("Ændringer gemt"); setOnboardingEditing(false); }
      } else {
        setMessage(`Fejl: ${d.error}`);
      }
    } catch {
      setMessage("Netværksfejl");
    }
    setOnboardingLoading(null);
  }

  const confirmEmployee = async () => {
    if (!employee.email) {
      setMessage("Tilføj email først — koden sendes via email");
      return;
    }
    setConfirming(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}/confirm`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEmployee({ ...employee, confirmed: true, confirmedAt: new Date().toISOString(), confirmationCode: data.code });
        if (data.emailSent) {
          setMessage(`Bekræftet! Kode ${data.code} sendt til ${employee.email}`);
        } else {
          setMessage(`Bekræftet! Kode: ${data.code} (email IKKE sendt — tjek Resend)`);
        }
      } else {
        setMessage(data.error || "Kunne ikke bekræfte");
      }
    } catch {
      setMessage("Fejl ved bekræftelse");
    }
    setConfirming(false);
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[15px] px-[14px] py-[10px] rounded-[2px] outline-none focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";
  const labelClass = "block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[6px]";

  return (
    <div className="max-w-[900px]">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/admin/medarbejdere" className="text-[11px] font-condensed uppercase tracking-[.12em] text-muted hover:text-cream">← Medarbejdere</Link>
          <h1 className="font-condensed font-black text-[40px] uppercase tracking-[-.01em] text-cream leading-none mt-2">{employee.name}</h1>
          {employee.contractVersion && (
            <p className="text-[12px] text-muted mt-2">Kontrakt {employee.contractVersion} accepteret {employee.acceptedAt ? new Date(employee.acceptedAt).toLocaleString("da-DK") : ""}</p>
          )}
        </div>
        <button
          onClick={del}
          className="font-condensed font-semibold text-[11px] tracking-[.15em] uppercase text-muted border border-[rgba(242,238,230,.1)] hover:text-red-400 hover:border-red-400 px-4 py-2 rounded-[2px] transition-colors"
        >
          Slet medarbejder
        </button>
      </div>

      <div className="grid grid-cols-[180px_1fr] gap-8 mb-8 max-[700px]:grid-cols-1">
        <div>
          {employee.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={employee.photoPath} alt={employee.name} className="w-full aspect-square object-cover rounded-[2px] border border-[rgba(242,238,230,.07)]" />
          ) : (
            <div className="w-full aspect-square bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.07)] rounded-[2px] flex items-center justify-center text-muted text-[11px] uppercase tracking-[.1em] font-condensed">
              Intet billede
            </div>
          )}
          {employee.cvPath && (
            <a href={employee.cvPath} target="_blank" rel="noopener noreferrer" className="block mt-3 text-center bg-[rgba(245,196,0,.1)] border border-yellow text-yellow font-condensed font-semibold text-[11px] tracking-[.12em] uppercase px-3 py-2 rounded-[2px] hover:bg-[rgba(245,196,0,.2)]">
              Se CV
            </a>
          )}
        </div>

        <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-6">
          {/* Bekræftelses-sektion */}
          <div className={`mb-6 p-4 rounded-[2px] border ${employee.confirmed ? "border-green-500/30 bg-green-500/5" : "border-yellow/30 bg-yellow/5"}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-condensed font-bold text-[11px] tracking-[.15em] uppercase text-muted mb-1">
                  Status
                </p>
                {employee.confirmed ? (
                  <div>
                    <p className="text-[15px] text-green-400 font-semibold">
                      Bekræftet {employee.confirmedAt ? `· ${new Date(employee.confirmedAt).toLocaleDateString("da-DK")}` : ""}
                    </p>
                    {employee.confirmationCode && (
                      <p className="text-[13px] text-muted mt-1">
                        Kode: <span className="text-cream font-mono tracking-[.15em]">{employee.confirmationCode}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[15px] text-yellow font-semibold">
                    Afventer bekræftelse
                  </p>
                )}
              </div>
              <button
                onClick={confirmEmployee}
                disabled={confirming}
                className={`font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] transition-colors disabled:opacity-50 ${
                  employee.confirmed
                    ? "bg-[rgba(242,238,230,.1)] text-cream border border-[rgba(242,238,230,.15)] hover:border-yellow hover:text-yellow"
                    : "bg-yellow text-black hover:bg-yellow2"
                }`}
              >
                {confirming ? "Sender..." : employee.confirmed ? "Send ny kode" : "Bekræft & send kode"}
              </button>
            </div>
          </div>

          {/* ── Onboarding-mail (Sarah) ──────────────────────────────── */}
          {employee.email && (
            <div className="mb-6 p-4 rounded-[2px] border border-[rgba(251,146,60,.25)] bg-[rgba(251,146,60,.04)]">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="font-condensed font-bold text-[11px] tracking-[.15em] uppercase text-orange-300">
                  ✉ Onboarding-mail
                </p>
                {employee.onboardingSentAt ? (
                  <span className="text-[11px] text-green-400 font-condensed font-bold">
                    ✓ Sendt {new Date(employee.onboardingSentAt).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}
                  </span>
                ) : employee.onboardingApprovedAt ? (
                  <span className="text-[11px] text-yellow font-condensed font-bold">Godkendt — klar til afsendelse</span>
                ) : employee.onboardingDraftBody ? (
                  <span className="text-[11px] text-orange-300 font-condensed font-bold">Udkast klar — gennemse og bekræft</span>
                ) : (
                  <span className="text-[11px] text-muted font-condensed">Intet udkast endnu</span>
                )}
              </div>

              {!employee.onboardingDraftBody && !employee.onboardingSentAt && (
                <button
                  onClick={() => generateOnboarding(false)}
                  disabled={!!onboardingLoading}
                  className="bg-[rgba(251,146,60,.15)] text-orange-300 border border-orange-400/30 font-condensed font-bold text-[12px] tracking-[.08em] uppercase px-5 py-2 rounded-[2px] hover:bg-[rgba(251,146,60,.25)] transition-colors disabled:opacity-50"
                >
                  {onboardingLoading === "generate" ? "Sarah skriver..." : "✍ Sarah skriver udkast"}
                </button>
              )}

              {employee.onboardingDraftBody && !employee.onboardingSentAt && (
                <>
                  {onboardingEditing ? (
                    <>
                      <input
                        value={editedOnboardingSubject}
                        onChange={(e) => setEditedOnboardingSubject(e.target.value)}
                        className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow mb-2"
                        placeholder="Emne"
                      />
                      <textarea
                        value={editedOnboardingBody}
                        onChange={(e) => setEditedOnboardingBody(e.target.value)}
                        rows={10}
                        className="w-full bg-black border border-[rgba(242,238,230,.12)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow resize-y mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => patchOnboarding("edit", { editedSubject: editedOnboardingSubject, editedBody: editedOnboardingBody })}
                          disabled={!!onboardingLoading}
                          className="bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.08em] uppercase px-4 py-2 rounded-[2px] hover:bg-yellow2"
                        >
                          {onboardingLoading === "edit" ? "Gemmer..." : "Gem ændringer"}
                        </button>
                        <button onClick={() => setOnboardingEditing(false)} className="border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[11px] uppercase px-3 py-2 hover:text-cream">
                          Annuller
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 p-3 bg-black/40 border border-[rgba(242,238,230,.06)] rounded-[2px]">
                        <p className="text-muted text-[10px] font-condensed tracking-[.1em] uppercase mb-1">Emne</p>
                        <p className="text-cream text-[14px] font-semibold mb-3">{employee.onboardingDraftSubject}</p>
                        <p className="text-muted text-[10px] font-condensed tracking-[.1em] uppercase mb-1">Besked</p>
                        <p className="text-cream text-[13px] leading-[1.7] whitespace-pre-wrap">{employee.onboardingDraftBody}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {!employee.onboardingApprovedAt && (
                          <button
                            onClick={() => patchOnboarding("approve")}
                            disabled={!!onboardingLoading}
                            className="bg-[rgba(74,222,128,.15)] text-green-300 border border-green-400/30 font-condensed font-bold text-[11px] tracking-[.08em] uppercase px-4 py-2 rounded-[2px] hover:bg-[rgba(74,222,128,.25)] disabled:opacity-50"
                          >
                            Godkend ✓
                          </button>
                        )}
                        {employee.onboardingApprovedAt && (
                          <button
                            onClick={() => patchOnboarding("send")}
                            disabled={!!onboardingLoading}
                            className="bg-[rgba(34,197,94,.15)] text-green-300 border border-green-400/30 font-condensed font-bold text-[11px] tracking-[.08em] uppercase px-4 py-2 rounded-[2px] hover:bg-[rgba(34,197,94,.25)] disabled:opacity-50"
                          >
                            {onboardingLoading === "send" ? "Sender..." : "Send ✉"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditedOnboardingSubject(employee.onboardingDraftSubject || "");
                            setEditedOnboardingBody(employee.onboardingDraftBody || "");
                            setOnboardingEditing(true);
                          }}
                          className="border border-[rgba(242,238,230,.12)] text-muted font-condensed font-bold text-[11px] tracking-[.08em] uppercase px-3 py-2 rounded-[2px] hover:text-cream"
                        >
                          Rediger
                        </button>
                        <button
                          onClick={() => generateOnboarding(true)}
                          disabled={!!onboardingLoading}
                          className="border border-[rgba(251,146,60,.3)] text-orange-300 font-condensed font-bold text-[11px] tracking-[.08em] uppercase px-3 py-2 rounded-[2px] hover:border-orange-300 disabled:opacity-50"
                        >
                          {onboardingLoading === "generate" ? "..." : "Regenerer"}
                        </button>
                        <button
                          onClick={() => patchOnboarding("reject")}
                          disabled={!!onboardingLoading}
                          className="border border-red-400/30 text-red-300 font-condensed font-bold text-[11px] tracking-[.08em] uppercase px-3 py-2 rounded-[2px] hover:border-red-300 disabled:opacity-50"
                        >
                          Slet udkast
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4 max-[700px]:grid-cols-1">
            <div>
              <label className={labelClass}>Navn</label>
              <input className={inputClass} value={employee.name} onChange={(e) => update({ name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input className={inputClass} value={employee.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} value={employee.email || ""} onChange={(e) => update({ email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Fødselsdato</label>
              <input type="date" className={inputClass} value={employee.birthDate} onChange={(e) => update({ birthDate: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Fag</label>
              <select className={inputClass + " cursor-pointer"} value={employee.trade} onChange={(e) => update({ trade: e.target.value })}>
                {Object.entries(TRADES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass + " cursor-pointer"} value={employee.employeeType} onChange={(e) => update({ employeeType: e.target.value as Employee["employeeType"] })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass + " cursor-pointer"} value={employee.status} onChange={(e) => update({ status: e.target.value as Employee["status"] })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className={labelClass}>Kompetencer (komma-adskilt)</label>
            <input
              className={inputClass}
              value={employee.skills.join(", ")}
              onChange={(e) => update({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Erfaring</label>
            <textarea className={inputClass + " min-h-[100px] resize-y"} value={employee.experience || ""} onChange={(e) => update({ experience: e.target.value })} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Noter</label>
            <textarea className={inputClass + " min-h-[80px] resize-y"} value={employee.notes || ""} onChange={(e) => update({ notes: e.target.value })} />
          </div>

          {employee.references.length > 0 && (
            <div className="mb-4">
              <p className={labelClass}>Referencer</p>
              <ul className="space-y-2">
                {employee.references.map((r, i) => (
                  <li key={i} className="text-[13px] text-cream border border-[rgba(242,238,230,.06)] rounded-[2px] p-2">
                    <span className="font-semibold">{r.name}</span>
                    {r.company && <span className="text-muted"> · {r.company}</span>}
                    {r.phone && <span className="text-muted"> · {r.phone}</span>}
                    {r.relation && <span className="text-muted"> · {r.relation}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Kompetence-profil */}
          <div className="mt-6 pt-6 border-t border-[rgba(242,238,230,0.07)]">
            <p className="font-condensed font-black text-[11px] tracking-[.2em] uppercase text-yellow mb-4">
              Ønsker & kompetencer
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4 max-[700px]:grid-cols-1">
              <div>
                <label className={labelClass}>Ansættelsestype</label>
                <select className={inputClass + " cursor-pointer"}
                  value={employee.employmentType || ""}
                  onChange={(e) => update({ employmentType: e.target.value as Employee["employmentType"] })}>
                  <option value="">Ikke angivet</option>
                  <option value="fuldtid">Fuldtid (37 t/uge)</option>
                  <option value="deltid">Deltid</option>
                  <option value="begge">Begge — fleksibel</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tilgængelig fra</label>
                <input type="date" className={inputClass} value={employee.availableFrom || ""}
                  onChange={(e) => update({ availableFrom: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Timer/uge (ønsket)</label>
                <input type="number" min="1" max="60" className={inputClass} value={employee.hoursPerWeek || ""}
                  onChange={(e) => update({ hoursPerWeek: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <div>
                <label className={labelClass}>Forventet timeløn (kr)</label>
                <input type="number" min="100" className={inputClass} value={employee.salaryExpectation || ""}
                  onChange={(e) => update({ salaryExpectation: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Ønskede fagområder (komma-adskilt)</label>
              <input className={inputClass}
                value={(employee.desiredTrades || []).join(", ")}
                onChange={(e) => update({ desiredTrades: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Tømrer, Murer, Stillads..." />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Certifikater (komma-adskilt)</label>
              <input className={inputClass}
                value={(employee.certifications || []).join(", ")}
                onChange={(e) => update({ certifications: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Stilladscertifikat, Truckcertifikat..." />
            </div>
            <div className="mb-4">
              <label className={labelClass}>Foretrukne områder (komma-adskilt)</label>
              <input className={inputClass}
                value={(employee.preferredAreas || []).join(", ")}
                onChange={(e) => update({ preferredAreas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Indre by, Amager, Nordvest..." />
            </div>
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-cream">
                <input type="checkbox" checked={employee.driverLicense || false}
                  onChange={(e) => update({ driverLicense: e.target.checked })}
                  className="w-4 h-4 accent-yellow" />
                Har kørekort (B)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-cream">
                <input type="checkbox" checked={employee.ownTools || false}
                  onChange={(e) => update({ ownTools: e.target.checked })}
                  className="w-4 h-4 accent-yellow" />
                Har eget værktøj
              </label>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Bio (kort om medarbejderen)</label>
              <textarea className={inputClass + " min-h-[80px] resize-y"} maxLength={200}
                value={employee.bio || ""}
                onChange={(e) => update({ bio: e.target.value })}
                placeholder="F.eks. 5 års erfaring som tømrer, specialiseret i renovering..." />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
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
      </div>
    </div>
  );
}
