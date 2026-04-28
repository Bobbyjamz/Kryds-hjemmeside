"use client";

import { useState, FormEvent } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/Toast";
import {
  getCustomerContractPoints,
  CUSTOMER_CONTRACT_VERSION,
  CUSTOMER_ACCEPT_LABEL,
} from "@/lib/contract";

type FormState = "idle" | "submitting" | "success" | "error";

const DURATIONS = ["Dagsvagt", "1 uge", "2–4 uger", "1–3 måneder", "Længerevarende"];

export default function Contact() {
  const ref = useReveal();
  const { t } = useLanguage();
  const { show: showToast } = useToast();
  const [formState, setFormState] = useState<FormState>("idle");
  const [accepted, setAccepted] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState<"virksomhed" | "privat">("virksomhed");
  const [urgent, setUrgent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const contractPoints = getCustomerContractPoints(customerName);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accepted) { setErrorMsg(t("contact_error_terms")); return; }
    if (!acceptedPrivacy) { setErrorMsg("Du skal acceptere handelsbetingelser og privatlivspolitik."); return; }
    setErrorMsg(null);
    setFormState("submitting");

    const fd = new FormData(e.currentTarget);
    const data = {
      virksomhed: fd.get("virksomhed"),
      kontaktperson: fd.get("kontaktperson"),
      email: fd.get("email"),
      telefon: fd.get("telefon"),
      opgavetype: fd.get("opgavetype"),
      antal: fd.get("antal"),
      startdato: fd.get("startdato"),
      varighed: fd.get("varighed"),
      beskrivelse: fd.get("beskrivelse"),
      acceptedTerms: accepted,
      acceptedPrivacyPolicy: acceptedPrivacy,
      acceptedMarketing,
      contractVersion: CUSTOMER_CONTRACT_VERSION,
      type: customerType,
      urgent,
    };

    try {
      // Send til begge endpoints parallelt
      const [res] = await Promise.all([
        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
        fetch("/api/help-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(fd.get("kontaktperson") || fd.get("virksomhed") || ""),
            company: customerType === "virksomhed" ? String(fd.get("virksomhed") || "") : undefined,
            email: String(fd.get("email") || ""),
            phone: String(fd.get("telefon") || ""),
            trade: String(fd.get("opgavetype") || ""),
            workers: fd.get("antal") ? Number(fd.get("antal")) : undefined,
            startDate: String(fd.get("startdato") || ""),
            duration: String(fd.get("varighed") || ""),
            description: String(fd.get("beskrivelse") || ""),
            urgent,
            type: customerType,
          }),
        }).catch(() => null),
      ]);
      const ok = res.ok;
      setFormState(ok ? "success" : "error");
      if (ok) showToast("Forespørgsel sendt! Vi vender tilbage inden for 2 timer.", "success");
      else showToast("Noget gik galt. Prøv igen.", "error");
    } catch {
      setFormState("error");
      showToast("Noget gik galt. Prøv igen.", "error");
    }
  };

  const inputClass =
    "w-full bg-black border border-[var(--border)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-muted";

  return (
    <section id="contract" className="bg-black2 py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        {t("contact_eyebrow")}
      </div>
      <div className="reveal grid grid-cols-[1fr_1.1fr] gap-20 items-start max-[900px]:grid-cols-1 max-[900px]:gap-10">

        {/* Info column */}
        <div>
          <h2 className="font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em] mb-10">
            {t("contact_h2_1")} <span className="text-yellow">{t("contact_h2_yellow")}</span><br />
            {t("contact_h2_2")}
          </h2>

          <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-[14px]">
            {t("contact_included_title")}
          </h3>
          <ul className="list-none">
            {[
              t("contact_inc_1"), t("contact_inc_2"), t("contact_inc_3"),
              t("contact_inc_4"), t("contact_inc_5"), t("contact_inc_6"),
            ].map((item) => (
              <li key={item} className="text-[15px] leading-[1.7] text-muted py-[9px] border-b border-[rgba(242,238,230,0.07)] flex items-center gap-3">
                <span className="bx" />{item}
              </li>
            ))}
          </ul>

          <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-[14px] mt-10">
            {t("contact_prices_title")}
          </h3>
          <ul className="list-none">
            {[
              t("contact_price_1"), t("contact_price_2"), t("contact_price_3"),
              t("contact_price_4"), t("contact_price_5"), t("contact_price_6"),
            ].map((item) => (
              <li key={item} className="text-[15px] leading-[1.7] text-muted py-[9px] border-b border-[rgba(242,238,230,0.07)] flex items-center gap-3">
                <span className="bx" />{item}
              </li>
            ))}
          </ul>

          <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-[14px] mt-10">
            {t("contact_direct_title")}
          </h3>
          <p className="text-[15px] leading-[1.72] text-muted mb-[6px]">
            <a href="mailto:Kontakt@KrydsByg.com" className="text-muted hover:text-cream transition-colors">Kontakt@KrydsByg.com</a>
          </p>
          <p className="text-[15px] leading-[1.72] text-muted mb-[6px]">+45 42 77 88 66</p>
          <p className="text-[15px] leading-[1.72] text-muted">København, Danmark</p>

          <div className="mt-10 pt-8 border-t border-[rgba(242,238,230,0.07)]">
            <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-[14px]">
              {t("contact_legal_title")}
            </h3>
            <div className="flex flex-col gap-[8px]">
              {[
                { label: t("footer_leg_1"), href: "/handelsbetingelser" },
                { label: t("footer_leg_2"), href: "/privatpolitik" },
                { label: t("footer_leg_4"), href: "/cookie-politik" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="text-[14px] text-muted hover:text-yellow transition-colors flex items-center gap-2">
                  <span className="text-yellow opacity-50 text-[10px]">→</span> {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="form-card bg-gray p-11 border border-[rgba(242,238,230,0.07)] rounded-[2px] relative overflow-hidden">
          {formState === "success" ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-yellow mx-auto mb-6 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0C0C0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.04em] text-cream mb-3">
                {t("contact_success_title")}
              </h3>
              <p className="text-[16px] text-muted">{t("contact_success_desc")}</p>
            </div>
          ) : (
            <>
              <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.04em] text-cream mb-7">
                {t("contact_form_title")}
              </h3>
              <form onSubmit={handleSubmit}>
                {/* Type selector */}
                <div className="flex gap-2 mb-[18px]">
                  {(["virksomhed", "privat"] as const).map((tp) => (
                    <button key={tp} type="button" onClick={() => setCustomerType(tp)}
                      className={`flex-1 py-3 rounded-[2px] font-condensed font-bold text-[11px] tracking-[.12em] uppercase border transition-colors ${customerType === tp ? "bg-yellow text-black border-yellow" : "bg-transparent text-muted border-[rgba(242,238,230,.12)] hover:text-cream"}`}>
                      {tp === "virksomhed" ? "🏢 Virksomhed" : "👤 Privat"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[900px]:grid-cols-1">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      {customerType === "virksomhed" ? t("contact_label_company") : "Navn"}
                    </label>
                    <input name="virksomhed" type="text" placeholder={customerType === "virksomhed" ? t("contact_placeholder_company") : "Dit fulde navn"} className={inputClass}
                      value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      {t("contact_label_contact")}
                    </label>
                    <input name="kontaktperson" type="text" placeholder={t("contact_placeholder_contact")} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[900px]:grid-cols-1">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      {t("contact_label_email")}
                    </label>
                    <input name="email" type="email" placeholder="din@mail.dk" className={inputClass} required />
                  </div>
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      {t("contact_label_phone")}
                    </label>
                    <input name="telefon" type="tel" placeholder="+45 00 00 00 00" className={inputClass} />
                  </div>
                </div>
                <div className="mb-[18px]">
                  <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                    {t("contact_label_task")}
                  </label>
                  <select name="opgavetype" className={`${inputClass} cursor-pointer`} required>
                    <option value="">{t("contact_task_placeholder")}</option>
                    {["contact_task_1","contact_task_2","contact_task_3","contact_task_4",
                      "contact_task_5","contact_task_6","contact_task_7","contact_task_9","contact_task_8"].map((key) => (
                      <option key={key}>{t(key)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[900px]:grid-cols-1">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      {t("contact_label_antal")}
                    </label>
                    <input name="antal" type="number" placeholder="f.eks. 3" min="1" className={inputClass} />
                  </div>
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      {t("contact_label_startdato")}
                    </label>
                    <input name="startdato" type="date" className={inputClass} />
                  </div>
                </div>
                <div className="mb-[18px]">
                  <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                    Varighed
                  </label>
                  <select name="varighed" className={`${inputClass} cursor-pointer`}>
                    <option value="">Vælg varighed</option>
                    {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="mb-[18px]">
                  <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                    {t("contact_label_desc")}
                  </label>
                  <textarea name="beskrivelse" placeholder={t("contact_placeholder_desc")} className={`${inputClass} resize-y min-h-[96px]`} />
                </div>
                {/* Urgent checkbox */}
                <label className={`mb-[18px] flex items-start gap-3 border rounded-[2px] p-3 cursor-pointer transition-colors ${urgent ? "border-amber-400/50 bg-amber-400/5" : "border-[rgba(242,238,230,.1)] hover:border-[rgba(242,238,230,.2)]"}`}>
                  <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="sr-only" />
                  <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center mt-[2px] transition-colors ${urgent ? "bg-amber-400/30 border-amber-400" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden>
                    {urgent && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </span>
                  <span className="text-[13px] leading-[1.5] text-cream select-none">🚨 Det haster — jeg har brug for hjælp inden for 24 timer</span>
                </label>

                {/* Contract */}
                <div className="mt-6 mb-4">
                  <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-condensed font-extrabold text-[15px] uppercase tracking-[.08em] text-cream">
                      {t("contact_terms_title")}
                    </h4>
                    <span className="font-condensed text-[10px] tracking-[.18em] uppercase text-muted">
                      Version {CUSTOMER_CONTRACT_VERSION}
                    </span>
                  </div>
                  <div className="max-h-[240px] max-[900px]:max-h-[160px] overflow-y-auto bg-[rgba(242,238,230,.03)] border border-[rgba(242,238,230,.1)] rounded-[2px] p-4">
                    {contractPoints.map((p) => (
                      <div key={p.title} className="mb-3 last:mb-0">
                        <h5 className="font-condensed font-bold text-[12px] tracking-[.08em] uppercase text-[rgba(242,238,230,.6)] mb-1">{p.title}</h5>
                        <p className="text-[13px] leading-[1.55] text-cream/90">{p.body}</p>
                      </div>
                    ))}
                  </div>
                  <label className={`mt-3 flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${accepted ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"}`}>
                    <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); if (e.target.checked) setErrorMsg(null); }} className="sr-only" />
                    <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${accepted ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden="true">
                      {accepted && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[13px] leading-[1.5] text-cream select-none">{CUSTOMER_ACCEPT_LABEL}</span>
                  </label>

                  {/* Privatlivspolitik (required) */}
                  <label className={`mt-2 flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${acceptedPrivacy ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"}`}>
                    <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => { setAcceptedPrivacy(e.target.checked); if (e.target.checked) setErrorMsg(null); }} className="sr-only" />
                    <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${acceptedPrivacy ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden="true">
                      {acceptedPrivacy && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[13px] leading-[1.5] text-cream select-none">
                      Jeg har læst og accepterer{" "}
                      <a href="/handelsbetingelser" target="_blank" rel="noopener noreferrer" className="text-yellow underline" onClick={(e) => e.stopPropagation()}>handelsbetingelserne</a>
                      {" "}og{" "}
                      <a href="/privatpolitik" target="_blank" rel="noopener noreferrer" className="text-yellow underline" onClick={(e) => e.stopPropagation()}>privatlivspolitikken</a>.
                    </span>
                  </label>

                  {/* Marketing (optional) */}
                  <label className={`mt-2 flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${acceptedMarketing ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"}`}>
                    <input type="checkbox" checked={acceptedMarketing} onChange={(e) => setAcceptedMarketing(e.target.checked)} className="sr-only" />
                    <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${acceptedMarketing ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden="true">
                      {acceptedMarketing && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[13px] leading-[1.5] text-cream select-none">Ja tak — jeg vil gerne modtage tilbud og nyheder fra KrydsByg (kan til enhver tid afmeldes).</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={formState === "submitting" || !accepted || !acceptedPrivacy}
                  className="w-full bg-yellow text-black font-condensed font-extrabold text-[16px] tracking-[.08em] uppercase py-[18px] border-none rounded-none cursor-pointer mt-[6px] transition-colors hover:bg-yellow2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {formState === "submitting" ? t("contact_btn_sending") : t("contact_btn")}
                </button>
                {errorMsg && <p className="text-red-400 text-[14px] mt-3 text-center">{errorMsg}</p>}
                {formState === "error" && <p className="text-red-400 text-[14px] mt-3 text-center">{t("contact_error_general")}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
