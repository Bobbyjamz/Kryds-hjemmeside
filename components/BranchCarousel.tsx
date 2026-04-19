"use client";

import { useRef, useEffect, useState, FormEvent } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getCustomerContractPoints,
  CUSTOMER_CONTRACT_VERSION,
  CUSTOMER_ACCEPT_LABEL,
} from "@/lib/contract";

const BRANCHES = [
  { num: "01", nameKey: "branch_1_name", subKey: "branch_1_sub", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80" },
  { num: "02", nameKey: "branch_2_name", subKey: "branch_2_sub", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80" },
  { num: "03", nameKey: "branch_3_name", subKey: "branch_3_sub", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80" },
  { num: "04", nameKey: "branch_4_name", subKey: "branch_4_sub", img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80" },
  { num: "05", nameKey: "branch_5_name", subKey: "branch_5_sub", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80" },
  { num: "06", nameKey: "branch_6_name", subKey: "branch_6_sub", img: "https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=900&q=80" },
  { num: "07", nameKey: "branch_7_name", subKey: "branch_7_sub", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80" },
];

// Double for seamless loop
const TILES = [...BRANCHES, ...BRANCHES];

type FormState = "idle" | "submitting" | "success" | "error";
type Billing = "hourly" | "fixed";
type CustomerType = "company" | "private";

export default function BranchCarousel() {
  const { t, lang } = useLanguage();
  const revealRef = useReveal();
  const viewRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);

  // Quick-book popover state
  const [openBranch, setOpenBranch] = useState<typeof BRANCHES[number] | null>(null);
  const [customerType, setCustomerType] = useState<CustomerType>("company");
  const [billing, setBilling] = useState<Billing>("hourly");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [antal, setAntal] = useState("");
  const [startdato, setStartdato] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    function tick() {
      if (view && !pausedRef.current) {
        const half = view.scrollWidth / 2;
        if (half > 0) {
          view.scrollLeft += 0.9;
          if (view.scrollLeft >= half) {
            view.scrollLeft -= half;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Close popover on Escape
  useEffect(() => {
    if (!openBranch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenBranch(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openBranch]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!openBranch) {
      setFormState("idle");
      setErrorMsg(null);
    }
  }, [openBranch]);

  function centerTile(tileEl: HTMLElement) {
    const view = viewRef.current;
    if (!view) return;
    const viewRect = view.getBoundingClientRect();
    const tileRect = tileEl.getBoundingClientRect();
    const currentScroll = view.scrollLeft;
    const tileCenter = tileRect.left - viewRect.left + currentScroll + tileRect.width / 2;
    const target = tileCenter - viewRect.width / 2;
    view.scrollTo({ left: target, behavior: "smooth" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!openBranch) return;
    if (!accepted) {
      setErrorMsg(t("contact_error_terms"));
      return;
    }
    setErrorMsg(null);
    setFormState("submitting");

    const isCompany = customerType === "company";
    const billingLabel = billing === "hourly" ? (lang === "da" ? "Timelønnet" : "Hourly") : (lang === "da" ? "Færdigt arbejde / fast pris" : "Fixed price / finished work");
    const customerLabel = isCompany ? (lang === "da" ? "Virksomhed" : "Company") : (lang === "da" ? "Privatperson" : "Private");

    const payload = {
      virksomhed: companyName,
      kontaktperson: contactPerson,
      email,
      telefon: phone,
      opgavetype: t(openBranch.nameKey),
      antal,
      startdato,
      beskrivelse: `[${customerLabel}] [${billingLabel}]\n\n${beskrivelse}`,
      acceptedTerms: accepted,
      contractVersion: CUSTOMER_CONTRACT_VERSION,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setFormState(res.ok ? "success" : "error");
    } catch {
      setFormState("error");
    }
  }

  const contractPoints = getCustomerContractPoints(companyName || contactPerson);

  const popoverInputClass =
    "w-full bg-black border border-[var(--border)] text-cream font-sans text-[15px] font-light px-[14px] py-[10px] rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-muted";

  return (
    <section className="bg-gray py-[100px] overflow-hidden" ref={revealRef}>
      {/* Header */}
      <div className="px-[52px] mb-[56px]">
        <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
          {t("branches_eyebrow")}
        </div>
        <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
          {t("branches_h2")} <span className="text-yellow">{t("branches_h2_yellow")}</span>
        </h2>
        <p className="reveal mt-4 text-[15px] leading-[1.7] text-muted max-w-[560px]">
          {t("branches_subtitle")}
        </p>
      </div>

      {/* Scrollable viewport */}
      <div className="relative">
        <div
          className="absolute top-0 bottom-0 left-0 w-[120px] z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--color-gray) 10%, transparent)" }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-[120px] z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--color-gray) 10%, transparent)" }}
        />

        <div
          ref={viewRef}
          className="branch-carousel-viewport flex gap-[18px] overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingLeft: "52px",
            paddingRight: "52px",
          }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {TILES.map((branch, i) => (
            <button
              key={i}
              type="button"
              className="branch-tile flex-shrink-0 relative overflow-hidden rounded-[3px] cursor-pointer group"
              style={{
                width: 360,
                height: 240,
                background: "var(--color-black2)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                pausedRef.current = true;
                centerTile(e.currentTarget);
              }}
              onClick={() => setOpenBranch(branch)}
              aria-label={`${lang === "da" ? "Book" : "Book"} — ${t(branch.nameKey)}`}
            >
              {/* Background image */}
              <div
                className="branch-tile-img absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${branch.img}')`,
                  filter: "grayscale(30%) brightness(0.58) saturate(0.9)",
                  transform: "scale(1.0)",
                  transition: "filter 0.5s, transform 0.6s ease",
                }}
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 z-[1]"
                style={{
                  background:
                    "linear-gradient(to top, rgba(12,12,10,.88) 0%, rgba(12,12,10,.25) 60%, transparent 100%)",
                }}
              />
              {/* Book-now chip (shows on hover) */}
              <span
                className="absolute top-[16px] right-[16px] z-[3] font-condensed font-bold text-[10px] tracking-[.16em] uppercase bg-yellow text-black px-3 py-[5px] rounded-full opacity-0 translate-y-[-6px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
              >
                {lang === "da" ? "Book nu →" : "Book now →"}
              </span>
              {/* Number */}
              <span className="absolute top-[18px] left-[20px] z-[2] font-condensed font-bold text-[11px] tracking-[.18em] text-[rgba(242,238,230,.55)]">
                — {branch.num}
              </span>
              {/* Content */}
              <div className="absolute left-0 right-0 bottom-0 z-[2] flex items-end justify-between gap-3 p-6 text-left">
                <div>
                  <h4 className="font-condensed font-extrabold text-[24px] tracking-[.04em] uppercase text-cream leading-[1.05]">
                    {t(branch.nameKey)}
                  </h4>
                  <small className="block font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow uppercase mt-[6px]">
                    {t(branch.subKey)}
                  </small>
                </div>
                <div
                  className="branch-tile-arrow w-[40px] h-[40px] flex-shrink-0 rounded-full flex items-center justify-center border border-[rgba(245,196,0,.35)] transition-all duration-300"
                  style={{ background: "transparent" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── QUICK-BOOK MODAL ── */}
      {openBranch && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-5 overflow-y-auto"
          style={{ background: "color-mix(in srgb, var(--color-black) 80%, rgba(0,0,0,.6))", backdropFilter: "blur(6px)" }}
          onClick={() => setOpenBranch(null)}
        >
          <div
            className="relative w-full max-w-[620px] my-auto rounded-[4px] overflow-hidden"
            style={{ background: "var(--color-gray)", border: "1px solid var(--border)", boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Yellow top accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow z-10" />

            {/* Close button */}
            <button
              onClick={() => setOpenBranch(null)}
              className="absolute top-[14px] right-[14px] z-20 w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-cream hover:text-yellow hover:border-yellow transition-colors"
              aria-label={lang === "da" ? "Luk" : "Close"}
              style={{ background: "color-mix(in srgb, var(--color-black) 50%, transparent)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Hero / header image strip */}
            <div
              className="relative h-[130px] bg-cover bg-center"
              style={{
                backgroundImage: `url('${openBranch.img}')`,
                filter: "brightness(.55) saturate(.95)",
              }}
            />
            <div
              className="absolute top-0 left-0 right-0 h-[130px] pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(12,12,10,.15) 0%, var(--color-gray) 100%)" }}
            />

            {/* Body */}
            <div className="relative px-7 pt-5 pb-7 max-h-[80vh] overflow-y-auto">
              <p className="font-condensed font-semibold text-[10px] tracking-[.22em] uppercase text-yellow mb-[6px]">
                — {openBranch.num} · {lang === "da" ? "Book hurtigt" : "Quick booking"}
              </p>
              <h3 className="font-condensed font-black text-[28px] uppercase tracking-[-.01em] text-cream leading-[.95] mb-[6px]">
                {t(openBranch.nameKey)}
              </h3>
              <p className="text-[14px] text-muted mb-6 leading-[1.55]">
                {t(openBranch.subKey)}
              </p>

              {formState === "success" ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-yellow mx-auto mb-4 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0C0C0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-2">
                    {t("contact_success_title")}
                  </h4>
                  <p className="text-[14px] text-muted mb-5">{t("contact_success_desc")}</p>
                  <button
                    onClick={() => setOpenBranch(null)}
                    className="font-condensed font-bold text-[12px] tracking-[.14em] uppercase bg-yellow text-black px-6 py-[10px] rounded-[2px] hover:bg-yellow2 transition-colors"
                  >
                    {lang === "da" ? "Luk" : "Close"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Customer type */}
                  <p className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-muted mb-[8px]">
                    {lang === "da" ? "Hvem er du?" : "Who are you?"}
                  </p>
                  <div className="grid grid-cols-2 gap-[10px] mb-[18px]">
                    {(["company", "private"] as CustomerType[]).map((key) => {
                      const active = customerType === key;
                      const label =
                        key === "company"
                          ? (lang === "da" ? "Virksomhed" : "Company")
                          : (lang === "da" ? "Privatperson" : "Private");
                      const sub =
                        key === "company"
                          ? (lang === "da" ? "ApS, byggefirma, etc." : "Ltd, contractor, etc.")
                          : (lang === "da" ? "Hjem, privat projekt" : "Home, private project");
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCustomerType(key)}
                          className={`text-left p-[12px] rounded-[3px] border-2 transition-colors ${
                            active
                              ? "border-yellow bg-[rgba(245,196,0,.08)]"
                              : "border-[var(--border)] hover:border-[rgba(245,196,0,.4)]"
                          }`}
                        >
                          <span className="font-condensed font-extrabold text-[14px] tracking-[.04em] uppercase text-cream block">{label}</span>
                          <span className="text-[11px] text-muted">{sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Billing type */}
                  <p className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-muted mb-[8px]">
                    {lang === "da" ? "Hvordan vil du betale?" : "How do you want to pay?"}
                  </p>
                  <div className="grid grid-cols-2 gap-[10px] mb-[18px]">
                    {(["hourly", "fixed"] as Billing[]).map((key) => {
                      const active = billing === key;
                      const label =
                        key === "hourly"
                          ? (lang === "da" ? "Timelønnet" : "Hourly")
                          : (lang === "da" ? "Færdigt arbejde" : "Fixed price");
                      const sub =
                        key === "hourly"
                          ? (lang === "da" ? "Du betaler pr. time" : "Pay per hour")
                          : (lang === "da" ? "Fast pris for opgaven" : "Flat rate for the task");
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setBilling(key)}
                          className={`text-left p-[12px] rounded-[3px] border-2 transition-colors ${
                            active
                              ? "border-yellow bg-[rgba(245,196,0,.08)]"
                              : "border-[var(--border)] hover:border-[rgba(245,196,0,.4)]"
                          }`}
                        >
                          <span className="font-condensed font-extrabold text-[14px] tracking-[.04em] uppercase text-cream block">{label}</span>
                          <span className="text-[11px] text-muted">{sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Contact fields */}
                  <div className="grid grid-cols-2 gap-[10px] mb-[10px] max-[600px]:grid-cols-1">
                    <input
                      type="text"
                      required
                      placeholder={customerType === "company" ? (lang === "da" ? "Virksomhedsnavn" : "Company name") : (lang === "da" ? "Dit fulde navn" : "Your full name")}
                      className={popoverInputClass}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder={lang === "da" ? "Kontaktperson" : "Contact person"}
                      className={popoverInputClass}
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-[10px] mb-[10px] max-[600px]:grid-cols-1">
                    <input
                      type="email"
                      required
                      placeholder="din@mail.dk"
                      className={popoverInputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="+45 00 00 00 00"
                      className={popoverInputClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-[10px] mb-[10px] max-[600px]:grid-cols-1">
                    <input
                      type="number"
                      min="1"
                      placeholder={lang === "da" ? "Antal personer" : "Number of people"}
                      className={popoverInputClass}
                      value={antal}
                      onChange={(e) => setAntal(e.target.value)}
                    />
                    <input
                      type="date"
                      className={popoverInputClass}
                      value={startdato}
                      onChange={(e) => setStartdato(e.target.value)}
                    />
                  </div>
                  <textarea
                    placeholder={lang === "da" ? "Kort beskrivelse af opgaven..." : "Short description of the task..."}
                    className={`${popoverInputClass} resize-y min-h-[80px] mb-[10px]`}
                    value={beskrivelse}
                    onChange={(e) => setBeskrivelse(e.target.value)}
                  />

                  {/* Terms mini */}
                  <label
                    className={`flex items-start gap-3 p-[10px] border rounded-[2px] cursor-pointer transition-colors mb-[12px] ${
                      accepted ? "border-[rgba(242,238,230,.3)]" : "border-[var(--border)] hover:border-[rgba(242,238,230,.2)]"
                    }`}
                    style={{ background: "rgba(242,238,230,.03)" }}
                  >
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => {
                        setAccepted(e.target.checked);
                        if (e.target.checked) setErrorMsg(null);
                      }}
                      className="sr-only"
                    />
                    <span
                      className={`flex-shrink-0 w-[18px] h-[18px] rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[1px] ${
                        accepted ? "bg-[rgba(242,238,230,.15)] border-[rgba(242,238,230,.4)]" : "border-[rgba(242,238,230,.3)]"
                      }`}
                    >
                      {accepted && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[12px] leading-[1.45] text-cream select-none">
                      {CUSTOMER_ACCEPT_LABEL}{" "}
                      <span className="text-muted">
                        — v{CUSTOMER_CONTRACT_VERSION}, {contractPoints.length} {lang === "da" ? "punkter" : "points"}
                      </span>
                    </span>
                  </label>

                  {errorMsg && <p className="text-red-400 text-[13px] mb-[10px] text-center">{errorMsg}</p>}
                  {formState === "error" && (
                    <p className="text-red-400 text-[13px] mb-[10px] text-center">{t("contact_error_general")}</p>
                  )}

                  <button
                    type="submit"
                    disabled={formState === "submitting" || !accepted}
                    className="w-full bg-yellow text-black font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase py-[14px] rounded-[2px] hover:bg-yellow2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {formState === "submitting"
                      ? t("contact_btn_sending")
                      : lang === "da"
                        ? "Send forespørgsel →"
                        : "Send request →"}
                  </button>
                  <p className="text-[11px] text-muted text-center mt-3">
                    {lang === "da" ? "Vi svarer typisk inden for 2 timer." : "We usually reply within 2 hours."}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
