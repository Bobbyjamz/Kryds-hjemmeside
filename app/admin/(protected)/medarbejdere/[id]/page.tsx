"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TRADES } from "@/lib/constants";
import type { Employee } from "@/lib/types";

const STATUSES = ["LEDIG", "UDSENDT", "INAKTIV"] as const;
const TYPES = ["MEDARBEJDER", "KOORDINATOR"] as const;

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
