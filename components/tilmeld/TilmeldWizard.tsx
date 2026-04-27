"use client";

import { useState } from "react";
import { TRADES, SKILL_SUGGESTIONS } from "@/lib/constants";
import ContractBox from "./ContractBox";
import { useLanguage } from "@/contexts/LanguageContext";

type Ref = { name: string; phone: string; company: string; relation: string };

const inputClass =
  "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-[rgba(242,238,230,.2)]";

const labelClass = "block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]";

export default function TilmeldWizard() {
  const { t } = useLanguage();

  const steps = [
    t("tw_step_1"),
    t("tw_step_2"),
    t("tw_step_3"),
    t("tw_step_4"),
  ];

  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  // Photo stored as base64 data URL + metadata (no server-side path)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Step 2 — default kategori = Handyman
  const [trade, setTrade] = useState("HANDYMAN");
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [experience, setExperience] = useState("");

  // Step 3 — CV stored as base64 data URL + metadata
  const [cvDataUrl, setCvDataUrl] = useState<string | null>(null);
  const [cvName, setCvName] = useState<string | null>(null);
  const [cvType, setCvType] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  // Ansøgning (motivated letter / application) — base64 data URL + metadata
  const [ansogningDataUrl, setAnsogningDataUrl] = useState<string | null>(null);
  const [ansogningName, setAnsogningName] = useState<string | null>(null);
  const [ansogningType, setAnsogningType] = useState<string | null>(null);
  const [ansogningUploading, setAnsogningUploading] = useState(false);
  const [references, setReferences] = useState<Ref[]>([{ name: "", phone: "", company: "", relation: "" }]);
  const [notes, setNotes] = useState("");
  // Step 2 (refs/notes) — vilkårs-accept til medarbejder
  const [acceptedMedarbejderVilkaar, setAcceptedMedarbejderVilkaar] = useState(false);
  const [acceptedGdpr, setAcceptedGdpr] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);

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

  /** Upload a file to /api/upload which returns a base64 data URL — no server-side filesystem writes. */
  const uploadFile = async (file: File, kind: "photo" | "cv" | "ansogning"): Promise<{ dataUrl: string; name: string; type: string } | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("tw_err_upload"));
      return null;
    }
    return { dataUrl: data.dataUrl as string, name: data.name as string, type: data.type as string };
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPhotoUploading(true);
    const result = await uploadFile(file, "photo");
    if (result) {
      setPhotoDataUrl(result.dataUrl);
      setPhotoName(result.name);
      setPhotoType(result.type);
    }
    setPhotoUploading(false);
  };

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCvUploading(true);
    const result = await uploadFile(file, "cv");
    if (result) {
      setCvDataUrl(result.dataUrl);
      setCvName(result.name);
      setCvType(result.type);
    }
    setCvUploading(false);
  };

  const handleAnsogningChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAnsogningUploading(true);
    const result = await uploadFile(file, "ansogning");
    if (result) {
      setAnsogningDataUrl(result.dataUrl);
      setAnsogningName(result.name);
      setAnsogningType(result.type);
    }
    setAnsogningUploading(false);
  };

  const canContinue = (): boolean => {
    if (step === 0) return !!(name.trim() && phone.trim() && birthDate.trim());
    if (step === 1) return !!trade;
    if (step === 2) return acceptedMedarbejderVilkaar && acceptedGdpr;
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
          // Base64 file attachments — sent to server and emailed as attachments
          photoFile: photoDataUrl,
          photoName,
          photoType,
          cvFile: cvDataUrl,
          cvName,
          cvType,
          ansogningFile: ansogningDataUrl,
          ansogningName,
          ansogningType,
          references: references.filter((r) => r.name.trim()),
          acceptedMedarbejderVilkaar,
          acceptedGdpr,
          confirmedAge,
          acceptedTerms: accepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("tw_err_generic"));
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("tw_err_connection"));
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
          {t("tw_success_h3")}
        </h3>
        <p className="text-[16px] text-muted mb-2 leading-[1.6]">
          {t("tw_success_p1")}
        </p>
        <p className="text-[14px] text-muted">
          {t("tw_success_p2_1")} <a href="/medarbejder/login" className="text-yellow hover:underline">/medarbejder/login</a> {t("tw_success_p2_2")}
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
              {t("tw_s1_h2")}
            </h2>
            <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[700px]:grid-cols-1">
              <div>
                <label className={labelClass}>{t("tw_s1_name_label")}</label>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("tw_s1_name_ph")} />
              </div>
              <div>
                <label className={labelClass}>{t("tw_s1_phone_label")}</label>
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("tw_s1_phone_ph")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[700px]:grid-cols-1">
              <div>
                <label className={labelClass}>{t("tw_s1_email_label")}</label>
                <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tw_s1_email_ph")} />
              </div>
              <div>
                <label className={labelClass}>{t("tw_s1_birth_label")}</label>
                <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                <p className="mt-1 text-[11px] text-muted">{t("tw_s1_birth_hint")}</p>
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("tw_s1_photo_label")}</label>
              <div className="flex items-center gap-4 flex-wrap">
                {photoDataUrl && (
                  <img src={photoDataUrl} alt={t("tw_s1_photo_registered")} className="w-16 h-16 object-cover rounded-[2px] border border-[rgba(242,238,230,.1)]" />
                )}
                <label className="cursor-pointer inline-block">
                  <span className="inline-block bg-[rgba(245,196,0,.1)] border border-yellow text-yellow font-condensed font-semibold text-[12px] tracking-[.15em] uppercase px-5 py-3 rounded-[2px] hover:bg-[rgba(245,196,0,.2)] transition-colors">
                    {photoUploading ? t("tw_s1_photo_uploading") : photoDataUrl ? t("tw_s1_photo_change") : t("tw_s1_photo_upload")}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
                </label>
                {photoDataUrl && (
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-[9px] rounded-[2px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[13px] text-green-400 font-condensed font-semibold tracking-[.05em]">{t("tw_s1_photo_registered")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream mb-6">
              {t("tw_s2_h2")}
            </h2>
            <div className="mb-[22px]">
              <label className={labelClass}>{t("tw_s2_trade_label")}</label>
              <select className={`${inputClass} cursor-pointer`} value={trade} onChange={(e) => setTrade(e.target.value)}>
                {Object.entries(TRADES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted">{t("tw_s2_trade_hint")}</p>
            </div>
            <div className="mb-[22px]">
              <label className={labelClass}>{t("tw_s2_skills_label")}</label>
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
                        aria-label={`${t("tw_s2_remove_aria")} ${s}`}
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
                  placeholder={t("tw_s2_custom_ph")}
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 rounded-[2px] hover:bg-yellow2 transition-colors whitespace-nowrap"
                >
                  {t("tw_s2_custom_btn")}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("tw_s2_exp_label")}</label>
              <textarea
                className={`${inputClass} resize-y min-h-[120px]`}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder={t("tw_s2_exp_ph")}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream mb-6">
              {t("tw_s3_h2")}
            </h2>
            <div className="mb-[22px]">
              <label className={labelClass}>{t("tw_s3_cv_label")}</label>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer inline-block">
                  <span className="inline-block bg-[rgba(245,196,0,.1)] border border-yellow text-yellow font-condensed font-semibold text-[12px] tracking-[.15em] uppercase px-5 py-3 rounded-[2px] hover:bg-[rgba(245,196,0,.2)] transition-colors">
                    {cvUploading ? t("tw_s3_cv_uploading") : cvDataUrl ? t("tw_s3_cv_change") : t("tw_s3_cv_upload")}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.jpg,.jpeg,.png,.webp,.heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,application/rtf,text/plain,image/*"
                    className="hidden"
                    onChange={handleCvChange}
                    disabled={cvUploading}
                  />
                </label>
                {cvDataUrl && (
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-[9px] rounded-[2px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[13px] text-green-400 font-condensed font-semibold tracking-[.05em]">{t("tw_s3_cv_registered")}</span>
                    <a href={cvDataUrl} target="_blank" rel="noopener noreferrer" className="text-yellow hover:underline text-[12px] font-condensed tracking-[.08em] uppercase ml-2">
                      {t("tw_s3_cv_view")}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-[22px]">
              <label className={labelClass}>Ansøgning / motiveret brev (valgfri)</label>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer inline-block">
                  <span className="inline-block bg-[rgba(245,196,0,.1)] border border-yellow text-yellow font-condensed font-semibold text-[12px] tracking-[.15em] uppercase px-5 py-3 rounded-[2px] hover:bg-[rgba(245,196,0,.2)] transition-colors">
                    {ansogningUploading ? "Uploader..." : ansogningDataUrl ? "Skift ansøgning" : "Upload ansøgning"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                    className="hidden"
                    onChange={handleAnsogningChange}
                    disabled={ansogningUploading}
                  />
                </label>
                {ansogningDataUrl && (
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-[9px] rounded-[2px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[13px] text-green-400 font-condensed font-semibold tracking-[.05em]">Ansøgning registreret</span>
                    <a href={ansogningDataUrl} target="_blank" rel="noopener noreferrer" className="text-yellow hover:underline text-[12px] font-condensed tracking-[.08em] uppercase ml-2">
                      Se
                    </a>
                  </div>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted">PDF, Word eller billede. Sendes med din profil til KrydsByg.</p>
            </div>
            <div className="mb-[22px]">
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass + " mb-0"}>{t("tw_s3_refs_label")}</label>
                <button
                  type="button"
                  onClick={addRef}
                  className="font-condensed font-semibold text-[11px] tracking-[.12em] uppercase text-yellow hover:underline"
                >
                  {t("tw_s3_ref_add")}
                </button>
              </div>
              {references.map((r, i) => (
                <div key={i} className="border border-[rgba(242,238,230,.08)] rounded-[2px] p-4 mb-3 bg-[rgba(12,12,10,.3)]">
                  <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
                    <input className={inputClass} placeholder={t("tw_s3_ref_name_ph")} value={r.name} onChange={(e) => updateRef(i, "name", e.target.value)} />
                    <input className={inputClass} placeholder={t("tw_s3_ref_phone_ph")} value={r.phone} onChange={(e) => updateRef(i, "phone", e.target.value)} />
                    <input className={inputClass} placeholder={t("tw_s3_ref_company_ph")} value={r.company} onChange={(e) => updateRef(i, "company", e.target.value)} />
                    <input className={inputClass} placeholder={t("tw_s3_ref_relation_ph")} value={r.relation} onChange={(e) => updateRef(i, "relation", e.target.value)} />
                  </div>
                  {references.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRef(i)}
                      className="mt-2 text-[11px] text-muted hover:text-red-400 uppercase tracking-[.12em] font-condensed font-semibold"
                    >
                      {t("tw_s3_ref_remove")}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-[22px]">
              <label className={labelClass}>{t("tw_s3_notes_label")}</label>
              <textarea
                className={`${inputClass} resize-y min-h-[100px]`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("tw_s3_notes_ph")}
              />
            </div>

            {/* Vilkårs-accept (medarbejder + GDPR + alder) */}
            <div className="space-y-2">
              <label className={`flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${acceptedMedarbejderVilkaar ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"}`}>
                <input type="checkbox" checked={acceptedMedarbejderVilkaar} onChange={(e) => setAcceptedMedarbejderVilkaar(e.target.checked)} className="sr-only" />
                <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${acceptedMedarbejderVilkaar ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden>
                  {acceptedMedarbejderVilkaar && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span className="text-[13px] leading-[1.5] text-cream select-none">
                  Jeg har læst og accepterer{" "}
                  <a href="/medarbejder-vilkaar" target="_blank" rel="noopener noreferrer" className="text-yellow underline" onClick={(e) => e.stopPropagation()}>medarbejdervilkårene</a>.
                </span>
              </label>

              <label className={`flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${acceptedGdpr ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"}`}>
                <input type="checkbox" checked={acceptedGdpr} onChange={(e) => setAcceptedGdpr(e.target.checked)} className="sr-only" />
                <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${acceptedGdpr ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden>
                  {acceptedGdpr && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span className="text-[13px] leading-[1.5] text-cream select-none">
                  Jeg samtykker til behandling af mine persondata jf.{" "}
                  <a href="/medarbejder-privatpolitik" target="_blank" rel="noopener noreferrer" className="text-yellow underline" onClick={(e) => e.stopPropagation()}>medarbejder-privatlivspolitikken</a>.
                </span>
              </label>

              <label className={`flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${confirmedAge ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"}`}>
                <input type="checkbox" checked={confirmedAge} onChange={(e) => setConfirmedAge(e.target.checked)} className="sr-only" />
                <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${confirmedAge ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden>
                  {confirmedAge && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span className="text-[13px] leading-[1.5] text-cream select-none">Jeg bekræfter at jeg er fyldt 18 år (valgfri).</span>
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream mb-6">
              {t("tw_s4_h2")}
            </h2>
            <p className="text-[14px] text-muted mb-6 leading-[1.6]">
              {t("tw_s4_intro")}
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
            {t("tw_btn_back")}
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue()}
              className="bg-yellow text-black font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase px-7 py-3 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("tw_btn_next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canContinue() || submitting}
              className="bg-yellow text-black font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase px-7 py-3 rounded-[2px] hover:bg-yellow2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? t("tw_btn_sending") : t("tw_btn_submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
