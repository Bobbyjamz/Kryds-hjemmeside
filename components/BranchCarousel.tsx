"use client";

import { useRef, useEffect, useState, FormEvent } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getCustomerContractPoints,
  CUSTOMER_CONTRACT_VERSION,
  CUSTOMER_ACCEPT_LABEL,
} from "@/lib/contract";

type Branch = {
  num: string;
  nameKey: string;
  subKey: string;
  img: string;
  crossImages?: string[];
};

const BRANCHES: Branch[] = [
  { num: "01", nameKey: "branch_1_name", subKey: "branch_1_sub", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80" },
  { num: "02", nameKey: "branch_2_name", subKey: "branch_2_sub", img: "/gallery/flyttearbejde.webp" },
  { num: "03", nameKey: "branch_3_name", subKey: "branch_3_sub", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80" },
  { num: "04", nameKey: "branch_4_name", subKey: "branch_4_sub", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80" },
  { num: "05", nameKey: "branch_5_name", subKey: "branch_5_sub", img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80" },
  { num: "06", nameKey: "branch_6_name", subKey: "branch_6_sub", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80" },
  { num: "07", nameKey: "branch_7_name", subKey: "branch_7_sub", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80" },
  { num: "08", nameKey: "branch_9_name", subKey: "branch_9_sub", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80" },
  {
    num: "09",
    nameKey: "branch_8_name",
    subKey: "branch_8_sub",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80",
    crossImages: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=450&q=80",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=450&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=450&q=80",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=450&q=80",
    ],
  },
];

// Double for seamless loop
const TILES = [...BRANCHES, ...BRANCHES];

type FormState = "idle" | "submitting" | "success" | "error";
type Billing = "hourly" | "fixed";
type CustomerType = "company" | "private";
type Scope = "small" | "medium" | "large";

const SCOPE_HOURS: Record<string, Record<Scope, number>> = {
  "01": { small: 16, medium: 60, large: 180 },
  "02": { small: 12, medium: 40, large: 120 },
  "03": { small: 8,  medium: 24, large: 80  },
  "04": { small: 4,  medium: 16, large: 48  },
  "05": { small: 10, medium: 32, large: 100 },
  "06": { small: 14, medium: 48, large: 140 },
  "07": { small: 20, medium: 80, large: 240 },
  "08": { small: 8,  medium: 24, large: 72  },
  "09": { small: 20, medium: 60, large: 180 },
};

function estimateDuration(branchNum: string, scope: Scope, people: number) {
  const hours = SCOPE_HOURS[branchNum]?.[scope] ?? 24;
  const workers = Math.max(1, people);
  const perWorkerHours = hours / workers;
  const days = Math.max(1, Math.ceil(perWorkerHours / 8));
  return { hours, days, perWorker: Math.ceil(perWorkerHours) };
}

function addBusinessDays(startIso: string, days: number): string {
  if (!startIso) return "";
  const d = new Date(startIso);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

export default function BranchCarousel() {
  const { t, lang } = useLanguage();
  const revealRef = useReveal();
  const viewRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);

  const [openBranch, setOpenBranch] = useState<Branch | null>(null);
  const [customerType, setCustomerType] = useState<CustomerType>("company");
  const [billing, setBilling] = useState<Billing>("hourly");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [antal, setAntal] = useState("");
  const [startdato, setStartdato] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [scope, setScope] = useState<Scope>("medium");
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

  // Scroll panel into view when branch opens
  useEffect(() => {
    if (openBranch) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
    }
  }, [openBranch]);

  // Pause carousel when booking form is open (prevents visual flicker)
  useEffect(() => {
    pausedRef.current = openBranch !== null;
  }, [openBranch]);

  // Reset form when branch changes
  useEffect(() => {
    setFormState("idle");
    setErrorMsg(null);
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAntal("");
    setStartdato("");
    setBeskrivelse("");
    setScope("medium");
    setAccepted(false);
    setCustomerType("company");
    setBilling("hourly");
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
    const billingLabel = billing === "hourly"
      ? (lang === "da" ? "Timelønnet" : "Hourly")
      : (lang === "da" ? "Færdigt arbejde / fast pris" : "Fixed price / finished work");
    const customerLabel = isCompany
      ? (lang === "da" ? "Virksomhed" : "Company")
      : (lang === "da" ? "Privatperson" : "Private");

    const peopleNum = parseInt(antal || "1", 10) || 1;
    const est = estimateDuration(openBranch.num, scope, peopleNum);
    const endDate = startdato ? addBusinessDays(startdato, est.days) : "";
    const scopeLabel = scope === "small"
      ? (lang === "da" ? "Lille opgave" : "Small task")
      : scope === "medium"
        ? (lang === "da" ? "Mellem opgave" : "Medium task")
        : (lang === "da" ? "Stor opgave" : "Large task");
    const estimateLine = lang === "da"
      ? `Estimeret omfang: ${scopeLabel} · ~${est.hours} timer total · ~${est.days} arbejdsdage med ${peopleNum} person${peopleNum > 1 ? "er" : ""}${endDate ? ` · forventet færdig ${endDate}` : ""}`
      : `Estimated scope: ${scopeLabel} · ~${est.hours} total hours · ~${est.days} working days with ${peopleNum} worker${peopleNum > 1 ? "s" : ""}${endDate ? ` · expected finish ${endDate}` : ""}`;

    const payload = {
      virksomhed: companyName,
      kontaktperson: contactPerson,
      email,
      telefon: phone,
      opgavetype: t(openBranch.nameKey),
      antal,
      startdato,
      beskrivelse: `[${customerLabel}] [${billingLabel}] [${scopeLabel}]\n${estimateLine}\n\n${beskrivelse}`,
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

  const inputClass =
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

      {/* Scrollable carousel */}
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
          {TILES.map((branch, i) => {
            const isActive = openBranch?.num === branch.num;
            return (
              <button
                key={i}
                type="button"
                className="branch-tile flex-shrink-0 relative overflow-hidden rounded-[3px] cursor-pointer group"
                style={{
                  width: 360,
                  height: 240,
                  background: "var(--color-black2)",
                  border: isActive ? "2px solid #F5C400" : "1px solid var(--border)",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  pausedRef.current = true;
                  centerTile(e.currentTarget);
                }}
                onClick={() => setOpenBranch(isActive ? null : branch)}
                aria-label={`${lang === "da" ? "Book" : "Book"} — ${t(branch.nameKey)}`}
              >
                {/* Background: cross (08) or single image */}
                {branch.crossImages ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "3px",
                      background: "#F5C400",
                    }}
                  >
                    {branch.crossImages.map((src, idx) => (
                      <div
                        key={idx}
                        className="bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${src}')`,
                          filter: "grayscale(30%) brightness(0.58) saturate(0.9)",
                          transition: "filter 0.5s",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="branch-tile-img absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${branch.img}')`,
                      filter: "grayscale(30%) brightness(0.58) saturate(0.9)",
                      transform: "scale(1.0)",
                      transition: "filter 0.5s, transform 0.6s ease",
                    }}
                  />
                )}

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 z-[1]"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(12,12,10,.72) 0%, rgba(12,12,10,.25) 60%, transparent 100%)",
                  }}
                />

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow z-[3]" />
                )}

                {/* Book-now chip */}
                <span
                  className="absolute top-[16px] right-[16px] z-[3] font-condensed font-bold text-[10px] tracking-[.16em] uppercase bg-yellow text-black px-3 py-[5px] rounded-full opacity-0 translate-y-[-6px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  {isActive ? (lang === "da" ? "Luk ↑" : "Close ↑") : (lang === "da" ? "Book nu →" : "Book now →")}
                </span>

                {/* Number */}
                <span className="absolute top-[18px] left-[20px] z-[2] font-condensed font-bold text-[11px] tracking-[.18em]" style={{ color: "rgba(242,238,230,.85)" }}>
                  — {branch.num}
                </span>

                {/* Title */}
                <div className="absolute left-0 right-0 bottom-0 z-[2] flex items-end justify-between gap-3 p-6 text-left">
                  <div>
                    <h4 className="font-condensed font-extrabold text-[24px] tracking-[.04em] uppercase leading-[1.05]" style={{ color: "#F2EEE6", textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
                      {t(branch.nameKey)}
                    </h4>
                    <small className="block font-condensed font-semibold text-[11px] tracking-[.18em] uppercase mt-[6px]" style={{ color: "#F5C400", textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>
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
            );
          })}
        </div>
      </div>

      {/* ── INLINE BOOKING PANEL ── */}
      {openBranch && (
        <div
          ref={panelRef}
          className="mx-[52px] mt-[32px] rounded-[4px] overflow-hidden max-[700px]:mx-4"
          style={{
            background: "var(--color-black2)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 40px rgba(0,0,0,.35)",
          }}
        >
          {/* Yellow top accent */}
          <div className="h-[3px] bg-yellow" />

          {/* Panel header with branch image strip */}
          <div
            className="relative h-[100px] bg-cover bg-center"
            style={{
              backgroundImage: `url('${openBranch.crossImages ? openBranch.crossImages[0] : openBranch.img}')`,
              filter: "brightness(.45) saturate(.9)",
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              marginTop: "3px",
              height: "103px",
              background: "linear-gradient(to bottom, transparent 0%, var(--color-black2) 100%)",
              position: "relative",
              marginBottom: "-100px",
            }}
          />

          <div className="px-8 pt-6 pb-8 max-[700px]:px-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-condensed font-semibold text-[10px] tracking-[.22em] uppercase text-yellow mb-[4px]">
                  — {openBranch.num} · {lang === "da" ? "Book hurtigt" : "Quick booking"}
                </p>
                <h3 className="font-condensed font-black text-[28px] uppercase tracking-[-.01em] text-cream leading-[.95]">
                  {t(openBranch.nameKey)}
                </h3>
                <p className="text-[13px] text-muted mt-1">{t(openBranch.subKey)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenBranch(null)}
                className="flex-shrink-0 w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-cream hover:text-yellow hover:border-yellow transition-colors mt-1"
                aria-label={lang === "da" ? "Luk" : "Close"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {formState === "success" ? (
              <div className="text-center py-10">
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
                  className="font-condensed font-extrabold text-[12px] tracking-[.08em] uppercase bg-yellow text-black px-6 py-[10px] rounded-none hover:bg-yellow2 transition-colors"
                >
                  {lang === "da" ? "Luk" : "Close"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-x-10 gap-y-0 max-[700px]:grid-cols-1">

                  {/* LEFT COLUMN */}
                  <div>
                    {/* Customer type */}
                    <p className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-muted mb-[8px]">
                      {lang === "da" ? "Hvem er du?" : "Who are you?"}
                    </p>
                    <div className="grid grid-cols-2 gap-[8px] mb-[16px]">
                      {(["company", "private"] as CustomerType[]).map((key) => {
                        const active = customerType === key;
                        const label = key === "company"
                          ? (lang === "da" ? "Virksomhed" : "Company")
                          : (lang === "da" ? "Privatperson" : "Private");
                        const sub = key === "company"
                          ? (lang === "da" ? "ApS, byggefirma, etc." : "Ltd, contractor, etc.")
                          : (lang === "da" ? "Hjem, privat projekt" : "Home, private project");
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCustomerType(key)}
                            className={`text-left p-[10px] rounded-[3px] border-2 transition-colors ${active ? "border-yellow bg-[rgba(245,196,0,.08)]" : "border-[var(--border)] hover:border-[rgba(245,196,0,.4)]"}`}
                          >
                            <span className="font-condensed font-extrabold text-[13px] tracking-[.04em] uppercase text-cream block">{label}</span>
                            <span className="text-[10px] text-muted">{sub}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Billing type */}
                    <p className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-muted mb-[8px]">
                      {lang === "da" ? "Betaling" : "Payment"}
                    </p>
                    <div className="grid grid-cols-2 gap-[8px] mb-[16px]">
                      {(["hourly", "fixed"] as Billing[]).map((key) => {
                        const active = billing === key;
                        const label = key === "hourly"
                          ? (lang === "da" ? "Timelønnet" : "Hourly")
                          : (lang === "da" ? "Færdigt arbejde" : "Fixed price");
                        const sub = key === "hourly"
                          ? (lang === "da" ? "Pr. time" : "Per hour")
                          : (lang === "da" ? "Fast pris" : "Flat rate");
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setBilling(key)}
                            className={`text-left p-[10px] rounded-[3px] border-2 transition-colors ${active ? "border-yellow bg-[rgba(245,196,0,.08)]" : "border-[var(--border)] hover:border-[rgba(245,196,0,.4)]"}`}
                          >
                            <span className="font-condensed font-extrabold text-[13px] tracking-[.04em] uppercase text-cream block">{label}</span>
                            <span className="text-[10px] text-muted">{sub}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Contact fields */}
                    <div className="grid grid-cols-2 gap-[8px] mb-[8px]">
                      <input
                        type="text"
                        required
                        placeholder={customerType === "company"
                          ? (lang === "da" ? "Virksomhedsnavn" : "Company name")
                          : (lang === "da" ? "Dit fulde navn" : "Your full name")}
                        className={inputClass}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder={lang === "da" ? "Kontaktperson" : "Contact person"}
                        className={inputClass}
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-[8px] mb-[8px]">
                      <input
                        type="email"
                        required
                        placeholder="din@mail.dk"
                        className={inputClass}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <input
                        type="tel"
                        placeholder="+45 00 00 00 00"
                        className={inputClass}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-[8px] mb-[8px]">
                      <input
                        type="number"
                        min="1"
                        placeholder={lang === "da" ? "Antal personer" : "Number of people"}
                        className={inputClass}
                        value={antal}
                        onChange={(e) => setAntal(e.target.value)}
                      />
                      <input
                        type="date"
                        className={inputClass}
                        value={startdato}
                        onChange={(e) => setStartdato(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div>
                    {/* Scope */}
                    <p className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-muted mb-[8px]">
                      {lang === "da" ? "Omfang af opgaven" : "Scope of task"}
                    </p>
                    <div className="grid grid-cols-3 gap-[6px] mb-[12px]">
                      {(["small", "medium", "large"] as Scope[]).map((key) => {
                        const active = scope === key;
                        const label = key === "small"
                          ? (lang === "da" ? "Lille" : "Small")
                          : key === "medium"
                            ? (lang === "da" ? "Mellem" : "Medium")
                            : (lang === "da" ? "Stor" : "Large");
                        const sub = key === "small"
                          ? (lang === "da" ? "1–2 dage" : "1–2 days")
                          : key === "medium"
                            ? (lang === "da" ? "3–10 dage" : "3–10 days")
                            : (lang === "da" ? "2+ uger" : "2+ weeks");
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setScope(key)}
                            className={`text-center py-[10px] px-[4px] rounded-[3px] border-2 transition-colors ${active ? "border-yellow bg-[rgba(245,196,0,.08)]" : "border-[var(--border)] hover:border-[rgba(245,196,0,.4)]"}`}
                          >
                            <span className="font-condensed font-extrabold text-[12px] tracking-[.04em] uppercase text-cream block">{label}</span>
                            <span className="text-[10px] text-muted">{sub}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Duration estimate */}
                    {(() => {
                      const peopleNum = parseInt(antal || "1", 10) || 1;
                      const est = estimateDuration(openBranch.num, scope, peopleNum);
                      const endDate = startdato ? addBusinessDays(startdato, est.days) : "";
                      return (
                        <div
                          className="mb-[12px] p-[12px] rounded-[3px] border flex items-center gap-[10px]"
                          style={{ background: "rgba(245,196,0,.06)", borderColor: "rgba(245,196,0,.25)" }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="font-condensed font-bold text-[10px] tracking-[.18em] uppercase text-yellow">
                              {lang === "da" ? "Estimeret varighed" : "Estimated duration"}
                            </p>
                            <p className="text-[13px] text-cream leading-[1.35] mt-[2px]">
                              <strong>~{est.days}</strong> {lang === "da" ? "arbejdsdage" : "working days"}
                              <span className="text-muted"> · ~{est.hours} {lang === "da" ? "timer" : "hours"}</span>
                            </p>
                            {endDate && (
                              <p className="text-[11px] text-muted mt-[2px]">
                                {lang === "da" ? "Forventet færdig" : "Expected finish"}: <span className="text-cream">{endDate}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <textarea
                      placeholder={lang === "da" ? "Kort beskrivelse af opgaven..." : "Short description of the task..."}
                      className={`${inputClass} resize-y min-h-[72px] mb-[10px]`}
                      value={beskrivelse}
                      onChange={(e) => setBeskrivelse(e.target.value)}
                    />

                    {/* Terms */}
                    <label
                      className={`flex items-start gap-3 p-[10px] border rounded-[2px] cursor-pointer transition-colors mb-[10px] ${accepted ? "border-[rgba(242,238,230,.3)]" : "border-[var(--border)] hover:border-[rgba(242,238,230,.2)]"}`}
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
                        className={`flex-shrink-0 w-[18px] h-[18px] rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[1px] ${accepted ? "bg-[rgba(242,238,230,.15)] border-[rgba(242,238,230,.4)]" : "border-[rgba(242,238,230,.3)]"}`}
                      >
                        {accepted && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[12px] leading-[1.45] text-cream select-none">
                        {CUSTOMER_ACCEPT_LABEL}{" "}
                        <span className="text-muted">— v{CUSTOMER_CONTRACT_VERSION}, {contractPoints.length} {lang === "da" ? "punkter" : "points"}</span>
                      </span>
                    </label>

                    {errorMsg && <p className="text-red-400 text-[13px] mb-[8px]">{errorMsg}</p>}
                    {formState === "error" && (
                      <p className="text-red-400 text-[13px] mb-[8px]">{t("contact_error_general")}</p>
                    )}

                    <button
                      type="submit"
                      disabled={formState === "submitting" || !accepted}
                      className="w-full bg-yellow text-black font-condensed font-extrabold text-[14px] tracking-[.08em] uppercase py-[14px] rounded-none hover:bg-yellow2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {formState === "submitting"
                        ? t("contact_btn_sending")
                        : lang === "da"
                          ? "Send forespørgsel →"
                          : "Send request →"}
                    </button>
                    <p className="text-[11px] text-muted text-center mt-2">
                      {lang === "da" ? "Vi svarer typisk inden for 2 timer." : "We usually reply within 2 hours."}
                    </p>
                  </div>

                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
