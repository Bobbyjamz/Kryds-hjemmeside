"use client";

import { useState, FormEvent } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getCustomerContractPoints,
  CUSTOMER_CONTRACT_VERSION,
  CUSTOMER_ACCEPT_LABEL,
} from "@/lib/contract";

type FormState = "idle" | "submitting" | "success" | "error";

export default function Contact() {
  const ref = useReveal();
  const { t } = useLanguage();
  const [formState, setFormState] = useState<FormState>("idle");
  const [accepted, setAccepted] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const contractPoints = getCustomerContractPoints(customerName);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accepted) { setErrorMsg(t("contact_error_terms")); return; }
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
      beskrivelse: fd.get("beskrivelse"),
      acceptedTerms: accepted,
      contractVersion: CUSTOMER_CONTRACT_VERSION,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setFormState(res.ok ? "success" : "error");
    } catch {
      setFormState("error");
    }
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-[rgba(242,238,230,.2)]";

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
                <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[900px]:grid-cols-1">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      {t("contact_label_company")}
                    </label>
                    <input name="virksomhed" type="text" placeholder={t("contact_placeholder_company")} className={inputClass}
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
                    {["contact_task_1","contact_task_2","contact_task_3","contact_task_4","contact_task_5",
                      "contact_task_6","contact_task_7","contact_task_8","contact_task_9"].map((key) => (
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
                    {t("contact_label_desc")}
                  </label>
                  <textarea name="beskrivelse" placeholder={t("contact_placeholder_desc")} className={`${inputClass} resize-y min-h-[96px]`} />
                </div>

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
                </div>

                <button
                  type="submit"
                  disabled={formState === "submitting" || !accepted}
                  className="w-full bg-yellow text-black font-condensed font-extrabold text-[16px] tracking-[.12em] uppercase py-[18px] border-none rounded-[2px] cursor-pointer mt-[6px] transition-colors hover:bg-yellow2 disabled:opacity-40 disabled:cursor-not-allowed"
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
