"use client";

import { useState, FormEvent, useRef } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getCustomerContractPoints,
  CUSTOMER_CONTRACT_VERSION,
  CUSTOMER_ACCEPT_LABEL,
} from "@/lib/contract";

const CATEGORIES = [
  {
    id: "bygge",
    num: "01",
    titleKey: "branch_1_name",
    descKey: "svc_1_desc",
    types: ["Murerhjælper", "Tømrer", "Maler / spartler", "Flisemontør", "Stilladsfolk", "Renovering", "Byggepladshjælper"],
    opgavetype: "Byggeprojekter",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80",
  },
  {
    id: "flytte",
    num: "02",
    titleKey: "branch_3_name",
    descKey: "svc_4_desc",
    types: ["Flyttefolk", "Køkkenmontage", "Møbelmontage", "Inventarmontage", "Badeværelse", "Tunge løft"],
    opgavetype: "Flytte & montere",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  },
  {
    id: "events",
    num: "03",
    titleKey: "branch_5_name",
    descKey: "svc_8_desc",
    types: ["Sceneopbygning", "Teltopsætning", "Eventhjælpere", "Lys & lyd support", "Nedtagning", "Transport"],
    opgavetype: "Events & scener",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];
type PriceType = "timepris" | "tilbud" | null;
type FormState = "idle" | "submitting" | "success" | "error";

export default function Services() {
  const revealRef = useReveal();
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const [openId, setOpenId] = useState<CategoryId | null>(null);
  const [priceType, setPriceType] = useState<PriceType>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [antal, setAntal] = useState(1);
  const [formState, setFormState] = useState<FormState>("idle");
  const [accepted, setAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeCategory = CATEGORIES.find((c) => c.id === openId) ?? null;
  const contractPoints = getCustomerContractPoints("");

  function openCategory(id: CategoryId) {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    setPriceType(null);
    setSelectedTypes([]);
    setAntal(1);
    setFormState("idle");
    setAccepted(false);
    setErrorMsg(null);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
  }

  function toggleType(tp: string) {
    setSelectedTypes((prev) => prev.includes(tp) ? prev.filter((x) => x !== tp) : [...prev, tp]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepted) { setErrorMsg(t("mob_svc_error_terms")); return; }
    setErrorMsg(null);
    setFormState("submitting");

    const fd = new FormData(e.currentTarget);
    const typeLabel = selectedTypes.length > 0 ? selectedTypes.join(", ") : "Ikke angivet";
    const data = {
      virksomhed: fd.get("virksomhed"),
      kontaktperson: fd.get("virksomhed"),
      email: fd.get("email"),
      telefon: fd.get("telefon"),
      opgavetype: `${activeCategory?.opgavetype} — ${typeLabel}`,
      antal: String(antal),
      startdato: fd.get("startdato"),
      beskrivelse:
        priceType === "tilbud"
          ? `[Tilbud ønsket — svar inden 24 timer]\n\n${fd.get("beskrivelse") ?? ""}`
          : `[Timepris — hurtig haste-løsning]\n\nAntal: ${antal}, Type: ${typeLabel}`,
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
  }

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[15px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-[rgba(242,238,230,.2)]";

  return (
    <section id="services" className="bg-black2 py-[70px] px-5" ref={revealRef}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        {t("mob_svc_eyebrow")}
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        {t("mob_svc_h2")} <span className="text-yellow">{t("mob_svc_h2_yellow")}</span>
      </h2>
      <p className="reveal mt-5 text-[16px] leading-[1.72] text-[rgba(242,238,230,.5)]">
        {t("mob_svc_desc")}
      </p>

      {/* 3 category image cards */}
      <div className="reveal grid grid-cols-1 gap-4 mt-[60px]">
        {CATEGORIES.map((cat) => {
          const isOpen = openId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => openCategory(cat.id)}
              className={`relative overflow-hidden rounded-[2px] h-[300px] text-left group transition-all focus:outline-none ${
                isOpen ? "ring-2 ring-yellow ring-offset-0" : ""
              }`}
            >
              <img
                src={cat.image}
                alt={t(cat.titleKey)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className={`absolute inset-0 transition-all duration-300 ${
                isOpen
                  ? "bg-gradient-to-t from-black/90 via-black/60 to-black/30"
                  : "bg-gradient-to-t from-black/85 via-black/50 to-black/20 group-hover:from-black/75 group-hover:via-black/40"
              }`} />
              {isOpen && <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow" />}
              <div className="relative z-10 flex flex-col justify-between h-full p-6">
                <div>
                  <span className="font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow block mb-3">— {cat.num}</span>
                  <h3 className="font-condensed font-extrabold text-[30px] uppercase tracking-[.02em] text-cream leading-[1.05] drop-shadow-lg">
                    {t(cat.titleKey)}
                  </h3>
                </div>
                <div>
                  <p className="text-[14px] leading-[1.7] text-[rgba(242,238,230,.8)] mb-5 drop-shadow">
                    {t(cat.descKey)}
                  </p>
                  <span className={`inline-block font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-[14px] py-[7px] rounded-[1px] border transition-all duration-200 ${
                    isOpen
                      ? "bg-yellow text-black border-yellow"
                      : "bg-[rgba(245,196,0,.15)] border-[rgba(245,196,0,.5)] text-yellow group-hover:bg-[rgba(245,196,0,.25)] group-hover:border-yellow"
                  }`}>
                    {isOpen ? t("mob_svc_close") : t("mob_svc_open")}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Booking panel */}
      {openId && activeCategory && (
        <div ref={panelRef} className="mt-[2px] border border-[rgba(242,238,230,0.1)] bg-[#111110] p-6">
          {formState === "success" ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-yellow mx-auto mb-6 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0C0C0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-condensed font-extrabold text-[30px] uppercase tracking-[.04em] text-cream mb-3">
                {priceType === "tilbud" ? t("mob_svc_success_offer") : t("mob_svc_success_time")}
              </h3>
              <p className="text-[16px] text-[rgba(242,238,230,.5)]">
                {priceType === "tilbud" ? t("mob_svc_success_offer_desc") : t("mob_svc_success_time_desc")}
              </p>
              <button
                onClick={() => { setOpenId(null); setFormState("idle"); }}
                className="mt-8 font-condensed font-bold text-[12px] tracking-[.15em] uppercase text-yellow border border-[rgba(245,196,0,.3)] px-6 py-3 hover:border-yellow transition-colors"
              >
                {t("mob_svc_close_btn")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                <div>
                  <span className="font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow block mb-1">— {activeCategory.num}</span>
                  <h3 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream">
                    {t(activeCategory.titleKey)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-[rgba(242,238,230,.4)] hover:text-cream border border-[rgba(242,238,230,.1)] px-4 py-2 transition-colors"
                >
                  {t("mob_svc_close_btn")} ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Staff type */}
                <div className="mb-7">
                  <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                    {t("mob_svc_type_label")}
                  </label>
                  <div className="flex flex-wrap gap-[6px]">
                    {activeCategory.types.map((tp) => {
                      const sel = selectedTypes.includes(tp);
                      return (
                        <button
                          key={tp}
                          type="button"
                          onClick={() => toggleType(tp)}
                          className={`font-condensed font-bold text-[11px] tracking-[.1em] uppercase px-[12px] py-[6px] rounded-[1px] border transition-colors ${
                            sel
                              ? "bg-yellow text-black border-yellow"
                              : "bg-[rgba(245,196,0,.06)] border-[rgba(245,196,0,.18)] text-yellow hover:border-[rgba(245,196,0,.4)]"
                          }`}
                        >
                          {tp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Antal + dato */}
                <div className="grid grid-cols-2 gap-4 mb-7">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                      {t("mob_svc_antal_label")}
                    </label>
                    <div className="flex items-center border border-[rgba(242,238,230,.1)] rounded-[2px] overflow-hidden">
                      <button type="button" onClick={() => setAntal((n) => Math.max(1, n - 1))} className="w-10 h-11 bg-[rgba(12,12,10,.5)] text-cream text-lg flex items-center justify-center hover:bg-[rgba(245,196,0,.1)] transition-colors flex-shrink-0">−</button>
                      <span className="flex-1 text-center font-condensed font-bold text-[18px] text-cream bg-[rgba(12,12,10,.5)] h-11 flex items-center justify-center">{antal}</span>
                      <button type="button" onClick={() => setAntal((n) => Math.min(50, n + 1))} className="w-10 h-11 bg-[rgba(12,12,10,.5)] text-cream text-lg flex items-center justify-center hover:bg-[rgba(245,196,0,.1)] transition-colors flex-shrink-0">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                      {t("mob_svc_startdato_label")}
                    </label>
                    <input name="startdato" type="date" className={inputClass} />
                  </div>
                </div>

                {/* Price type */}
                <div>
                  <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                    {t("mob_svc_price_label")}
                  </label>
                  <div className="grid grid-cols-2 gap-[6px]">
                    {(["timepris", "tilbud"] as const).map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setPriceType(pt)}
                        className={`p-4 border rounded-[2px] text-left transition-all ${
                          priceType === pt
                            ? "border-yellow bg-[rgba(245,196,0,.08)]"
                            : "border-[rgba(242,238,230,.1)] hover:border-[rgba(245,196,0,.3)]"
                        }`}
                      >
                        <div className={`font-condensed font-extrabold text-[14px] uppercase tracking-[.05em] mb-1 ${priceType === pt ? "text-yellow" : "text-cream"}`}>
                          {t(pt === "timepris" ? "mob_svc_timepris" : "mob_svc_tilbud")}
                        </div>
                        <div className="text-[12px] text-[rgba(242,238,230,.4)] leading-[1.5]">
                          {t(pt === "timepris" ? "mob_svc_timepris_desc" : "mob_svc_tilbud_desc")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact form */}
                {priceType ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4 max-[640px]:grid-cols-1">
                      <div>
                        <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                          {priceType === "tilbud" ? t("mob_svc_company_label") : t("mob_svc_company_name")}
                        </label>
                        <input
                          name="virksomhed"
                          type="text"
                          placeholder={priceType === "tilbud" ? t("mob_svc_company_ph_offer") : t("mob_svc_company_ph_time")}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                          {t("mob_svc_phone_label")}
                        </label>
                        <input name="telefon" type="tel" placeholder="+45 00 00 00 00" className={inputClass} required />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                        {t("mob_svc_email_label")}
                      </label>
                      <input name="email" type="email" placeholder="din@mail.dk" className={inputClass} required />
                    </div>
                    {priceType === "tilbud" && (
                      <div className="mb-4">
                        <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                          {t("mob_svc_project_label")}
                        </label>
                        <textarea name="beskrivelse" placeholder={t("mob_svc_project_ph")} className={`${inputClass} resize-y min-h-[80px]`} />
                      </div>
                    )}
                    {/* Terms */}
                    <div className="mt-4 mb-4">
                      <div className="max-h-[130px] overflow-y-auto bg-[rgba(242,238,230,.04)] border border-[rgba(242,238,230,.1)] rounded-[2px] p-3 mb-3">
                        {contractPoints.map((p) => (
                          <div key={p.title} className="mb-2 last:mb-0">
                            <h5 className="font-condensed font-bold text-[11px] tracking-[.08em] uppercase text-[rgba(242,238,230,.6)] mb-[2px]">{p.title}</h5>
                            <p className="text-[12px] leading-[1.5] text-cream/80">{p.body}</p>
                          </div>
                        ))}
                      </div>
                      <label className={`flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${accepted ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"}`}>
                        <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); if (e.target.checked) setErrorMsg(null); }} className="sr-only" />
                        <span className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${accepted ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"}`} aria-hidden="true">
                          {accepted && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="text-[12px] leading-[1.5] text-cream select-none">{CUSTOMER_ACCEPT_LABEL}</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={formState === "submitting" || !accepted}
                      className="w-full bg-yellow text-black font-condensed font-extrabold text-[15px] tracking-[.1em] uppercase py-[16px] border-none rounded-[2px] cursor-pointer transition-colors hover:bg-yellow2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {formState === "submitting" ? t("mob_svc_sending") : priceType === "tilbud" ? t("mob_svc_btn_offer") : t("mob_svc_btn_time")}
                    </button>
                    {errorMsg && <p className="text-red-400 text-[13px] mt-3">{errorMsg}</p>}
                    {formState === "error" && <p className="text-red-400 text-[13px] mt-3">{t("mob_svc_error_general")}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-center">
                    <p className="font-condensed font-semibold text-[12px] tracking-[.15em] uppercase text-[rgba(242,238,230,.3)] whitespace-pre-line">
                      {t("mob_svc_choose_price")}
                    </p>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
