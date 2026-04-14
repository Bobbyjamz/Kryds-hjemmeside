"use client";

import { useState } from "react";
import { TRADES, SKILL_SUGGESTIONS } from "@/lib/constants";
import ContractBox from "./ContractBox";

type Ref = { name: string; phone: string; company: string; relation: string };

const inputClass =
  "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-[rgba(242,238,230,.2)]";

const labelClass = "block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]";

const steps = ["Dine oplysninger", "Kompetencer", "CV & referencer", "Kontrakt & indsend"];

export default function TilmeldWizard() {
  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Step 2 — default kategori = Handyman
  const [trade, setTrade] = useState("HANDYMAN");
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [experience, setExperience] = useState("");

  // Step 3
  const [cvPath, setCvPath] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [references, setReferences] = useState<Ref[]>([{ name: "", phone: "", company: "", relation: "" }]);
  const [notes, setNotes] = useState("");

  // Step 4
  const [accepted, setAccepted] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setCustomSkill("");
    }
  };

  const updateRef = (i: number, field: keyof Ref, value: string) => {
    setReferences((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const addRef = () => setReferences([...references, { name: "", phone: "", company: "", relation: "" }]);
  const removeRef = (i: number) => setReferences(references.filter((_, idx) => idx !== i));

  const uploadFile = async (file: File, kind: "photo" | "cv"): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload fejlede");
      return null;
    }
    return data.path as string;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPhotoUploading(true);
    const path = await uploadFile(file, "photo");
    if (path) setPhotoPath(path);
    setPhotoUploading(false);
  };

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCvUploading(true);
    const path = await uploadFile(file, "cv");
    if (path) setCvPath(path);
    setCvUploading(false);
  };

  const canContinue = (): boolean => {
    if (step === 0) return !!(name.trim() && phone.trim() && birthDate.trim());
    if (step === 1) return !!trade;
    if (step === 2) return true;
    if (step === 3) return accepted;
    return false;
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          birthDate,
          trade,
          skills,
          experience,
          notes,
          photoPath,
          cvPath,
          references: references.filter((r) => r.name.trim()),
          acceptedTerms: accepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Noget gik galt");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Kunne ikke forbinde til serveren");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-[720px] mx-auto bg-gray p-12 border border-[rgba(242,238,230,0.07)] rounded-[2px] text-center">
        <div className="w-20 h-20 rounded-full bg-yellow mx-auto mb-6 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0C0C0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-condensed font-extrabold text-[36px] uppercase tracking-[.02em] text-cream mb-4">
          Tak for din tilmelding
        </h3>
        <p className="text-[16px] text-muted mb-2 leading-[1.6]">
          Vi har modtaget dine oplysninger og vender tilbage hurtigst muligt.
        </p>
        <p className="text-[14px] text-muted">
          Du kan nu logge ind på <a href="/medarbejder/login" className="text-yellow hover:underline">/medarbejder/login</a> med dit telefonnummer og fødselsdato for at se åbne vagter.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[820px] mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-10 max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-3">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3 flex-1 max-[700px]:w-full">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-condensed font-extrabold text-[14px] ${
                i <= step ? "bg-yellow text-black" : "bg-gray2 text-muted"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`font-condensed font-semibold text-[11px] tracking-[.15em] uppercase ${
                i === step ? "text-cream" : "text-muted"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[1px] bg-[rgba(242,238,230,0.1)] max-[700px]:hidden" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray p-8 md:p-10 border border-[rgba(242,238,230,0.07)] rounded-[2px]">
        {step === 0 && (
          <div>
            <h2 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream mb-6">
              Hvem er du?
            </h2>
            <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[700px]:grid-cols-1">
              <div>
                <label className={labelClass}>Fulde navn *</label>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Fornavn Efternavn" />
              </div>
              <div>
                <label className={labelClass}>Telefon *</label>
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+45 00 00 00 00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[700px]:grid-cols-1">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@mail.dk" />
              </div>
              <div>
                <label className={labelClass}>Fødselsdato *</label>
                <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                <p className="mt-1 text-[11px] text-muted">Bruges som adgang til dit medarbejder-dashboard.</p>
              </div>
            </div>
            <div>
              <label className={labelClass}>Profilbillede (valgfrit)</label>
              <div className="flex items-center gap-4 flex-wrap">
                {photoPath && (
                  <img src={photoPath} alt="Foto" className="w-16 h-16 object-cover rounded-[2px] border border-[rgba(242,238,230,.1)]" />
                )}
                <label className="cursor-pointer inline-block">
                  <span className="inline-block bg-[rgba(245,196,0,.1)] border border-yellow text-yellow font-condensed font-semibold text-[12px] tracking-[.15em] uppercase px-5 py-3 rounded-[2px] hover:bg-[rgba(245,196,0,.2)] transition-colors">
                    {photoUploading ? "Uploader..." : photoPath ? "Skift billede" : "Upload billede"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
                </label>
                {photoPath && (
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-[9px] rounded-[2px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[13px] text-green-400 font-condensed font-semibold tracking-[.05em]">Billede registreret</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream mb-6">
              Dine kompetencer
            </h2>
            <div className="mb-[22px]">
              <label className={labelClass}>Primært fag *</label>
              <select className={`${inputClass} cursor-pointer`} value={trade} onChange={(e) => setTrade(e.target.value)}>
                {Object.entries(TRADES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted">Kan du lidt af det hele? Vælg Handyman — standardkategori.</p>
            </div>
            <div className="mb-[22px]">
              <label className={labelClass}>Vælg dine kompetencer</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {SKILL_SUGGESTIONS.map((s) => {
                  const active = skills.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      className={`font-condensed font-semibold text-[12px] tracking-[.08em] uppercase px-4 py-2 rounded-[2px] border transition-colors ${
                        active
                          ? "bg-yellow text-black border-yellow"
                          : "bg-transparent text-cream border-[rgba(242,238,230,.15)] hover:border-yellow"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
                {/* Custom tilføjede kompetencer — vises som ekstra chips med × til at fjerne */}
                {skills
                  .filter((s) => !SKILL_SUGGESTIONS.includes(s))
                  .map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-2 bg-yellow text-black font-condensed font-semibold text-[12px] tracking-[.08em] uppercase px-4 py-2 rounded-[2px] border border-yellow"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => toggleSkill(s)}
                        aria-label={`Fjern ${s}`}
                        className="hover:text-red-700 leading-none text-[14px] font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                  placeholder="Tilføj egen kompetence..."
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 rounded-[2px] hover:bg-yellow2 transition-colors whitespace-nowrap"
                >
                  Tilføj
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Erfaring (år, steder, projekter)</label>
              <textarea
                className={`${inputClass} resize-y min-h-[120px]`}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="F.eks. 5 års erfaring som tømrer hos XYZ, tagarbejde på kontorbyggeri i København..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream mb-6">
              CV & referencer
            </h2>
            <div className="mb-[22px]">
              <label className={labelClass}>CV (PDF eller billede)</label>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer inline-block">
                  <span className="inline-block bg-[rgba(245,196,0,.1)] border border-yellow text-yellow font-condensed font-semibold text-[12px] tracking-[.15em] uppercase px-5 py-3 rounded-[2px] hover:bg-[rgba(245,196,0,.2)] transition-colors">
                    {cvUploading ? "Uploader..." : cvPath ? "Skift CV" : "Upload CV"}
                  </span>
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleCvChange} disabled={cvUploading} />
                </label>
                {cvPath && (
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-[9px] rounded-[2px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[13px] text-green-400 font-condensed font-semibold tracking-[.05em]">CV registreret</span>
                    <a href={cvPath} target="_blank" rel="noopener noreferrer" className="text-yellow hover:underline text-[12px] font-condensed tracking-[.08em] uppercase ml-2">
                      Vis
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-[22px]">
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass + " mb-0"}>Referencer</label>
                <button
                  type="button"
                  onClick={addRef}
                  className="font-condensed font-semibold text-[11px] tracking-[.12em] uppercase text-yellow hover:underline"
                >
                  + tilføj reference
                </button>
              </div>
              {references.map((r, i) => (
                <div key={i} className="border border-[rgba(242,238,230,.08)] rounded-[2px] p-4 mb-3 bg-[rgba(12,12,10,.3)]">
                  <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
                    <input className={inputClass} placeholder="Navn" value={r.name} onChange={(e) => updateRef(i, "name", e.target.value)} />
                    <input className={inputClass} placeholder="Telefon" value={r.phone} onChange={(e) => updateRef(i, "phone", e.target.value)} />
                    <input className={inputClass} placeholder="Virksomhed" value={r.company} onChange={(e) => updateRef(i, "company", e.target.value)} />
                    <input className={inputClass} placeholder="Relation (f.eks. tidligere chef)" value={r.relation} onChange={(e) => updateRef(i, "relation", e.target.value)} />
                  </div>
                  {references.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRef(i)}
                      className="mt-2 text-[11px] text-muted hover:text-red-400 uppercase tracking-[.12em] font-condensed font-semibold"
                    >
                      Fjern reference
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className={labelClass}>Noter til Kryds (valgfrit)</label>
              <textarea
                className={`${inputClass} resize-y min-h-[100px]`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Særlige bemærkninger, tilgængelighed, kørekort, egen bil osv."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream mb-6">
              Accepter kontrakten
            </h2>
            <p className="text-[14px] text-muted mb-6 leading-[1.6]">
              Læs kontrakten omhyggeligt. Ved at sætte flueben accepterer du vilkårene for dit ansættelsesforhold med Kryds ApS. Du er ikke bundet til Kryds udover de vagter, du selv accepterer.
            </p>
            <ContractBox employeeName={name} accepted={accepted} onAcceptChange={setAccepted} />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-[14px] mt-5 text-center">{error}</p>
        )}

        <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-[rgba(242,238,230,0.07)]">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="font-condensed font-semibold text-[12px] tracking-[.15em] uppercase text-muted px-5 py-3 rounded-[2px] border border-[rgba(242,238,230,.1)] hover:text-cream hover:border-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Tilbage
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue()}
              className="bg-yellow text-black font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase px-7 py-3 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Næste →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canContinue() || submitting}
              className="bg-yellow text-black font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase px-7 py-3 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Sender..." : "Send tilmelding"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
