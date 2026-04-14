"use client";

import { useState, FormEvent, useRef } from "react";
import { useReveal } from "@/hooks/useReveal";
import {
  getCustomerContractPoints,
  CUSTOMER_CONTRACT_VERSION,
  CUSTOMER_ACCEPT_LABEL,
} from "@/lib/contract";

const CATEGORIES = [
  {
    id: "bygge",
    num: "01",
    title: "Byggeprojekter",
    desc: "Håndværkere og hjælpere til alle typer byggeopgaver — renovering, nybyg, fliser og anlæg.",
    types: ["Murerhjælper", "Tømrer", "Maler / spartler", "Flisemontør", "Stilladsfolk", "Renovering", "Byggepladshjælper"],
    opgavetype: "Byggeprojekter",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80",
  },
  {
    id: "flytte",
    num: "02",
    title: "Flytte & montere",
    desc: "Erfarne folk til flytninger, køkken- og møbelmontage og tunge løft.",
    types: ["Flyttefolk", "Køkkenmontage", "Møbelmontage", "Inventarmontage", "Badeværelse", "Tunge løft"],
    opgavetype: "Flytte & montere",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  },
  {
    id: "events",
    num: "03",
    title: "Events & scener",
    desc: "Opsætning og nedtagning af scener, telte, borde og alt til dit event.",
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
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setPriceType(null);
    setSelectedTypes([]);
    setAntal(1);
    setFormState("idle");
    setAccepted(false);
    setErrorMsg(null);
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  function toggleType(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepted) {
      setErrorMsg("Du skal acceptere kundevilkårene.");
      return;
    }
    setErrorMsg(null);
    setFormState("submitting");

    const fd = new FormData(e.currentTarget);
    const typeLabel =
      selectedTypes.length > 0 ? selectedTypes.join(", ") : "Ikke angivet";

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
    <section
      id="services"
      className="bg-black2 py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5"
      ref={revealRef}
    >
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        Find bemanding
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        Hyr det <span className="text-yellow">rette hold</span>
      </h2>
      <p className="reveal mt-5 text-[16px] leading-[1.72] text-[rgba(242,238,230,.5)] max-w-[520px]">
        Vælg din opgavetype og bestil personale — til timepris eller få et
        tilbud inden for 24 timer.
      </p>

      {/* 3 category image cards */}
      <div className="reveal grid grid-cols-3 gap-4 mt-[60px] max-[900px]:grid-cols-1">
        {CATEGORIES.map((cat) => {
          const isOpen = openId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => openCategory(cat.id)}
              className={`relative overflow-hidden rounded-[2px] h-[400px] text-left group transition-all focus:outline-none max-[900px]:h-[300px] ${
                isOpen ? "ring-2 ring-yellow ring-offset-0" : ""
              }`}
            >
              {/* Background image */}
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              {/* Dark gradient overlay */}
              <div
                className={`absolute inset-0 transition-all duration-300 ${
                  isOpen
                    ? "bg-gradient-to-t from-black/90 via-black/60 to-black/30"
                    : "bg-gradient-to-t from-black/85 via-black/50 to-black/20 group-hover:from-black/75 group-hover:via-black/40"
                }`}
              />
              {/* Yellow top accent when open */}
              {isOpen && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow" />
              )}
              {/* Content */}
              <div className="relative z-10 flex flex-col justify-between h-full p-8 max-[900px]:p-6">
                <div>
                  <span className="font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow block mb-3">
                    — {cat.num}
                  </span>
                  <h3 className="font-condensed font-extrabold text-[30px] uppercase tracking-[.02em] text-cream leading-[1.05] drop-shadow-lg">
                    {cat.title}
                  </h3>
                </div>
                <div>
                  <p className="text-[14px] leading-[1.7] text-[rgba(242,238,230,.8)] mb-5 drop-shadow">
                    {cat.desc}
                  </p>
                  <span
                    className={`inline-block font-condensed font-bold text-[11px] tracking-[.12em] uppercase px-[14px] py-[7px] rounded-[1px] border transition-all duration-200 ${
                      isOpen
                        ? "bg-yellow text-black border-yellow"
                        : "bg-[rgba(245,196,0,.15)] border-[rgba(245,196,0,.5)] text-yellow group-hover:bg-[rgba(245,196,0,.25)] group-hover:border-yellow"
                    }`}
                  >
                    {isOpen ? "Luk ↑" : "Vælg →"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Booking panel */}
      {openId && activeCategory && (
        <div
          ref={panelRef}
          className="mt-[2px] border border-[rgba(242,238,230,0.1)] bg-[#111110] p-10 max-[900px]:p-6"
        >
          {formState === "success" ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-yellow mx-auto mb-6 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0C0C0A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-condensed font-extrabold text-[30px] uppercase tracking-[.04em] text-cream mb-3">
                {priceType === "tilbud"
                  ? "Vi sender dig et tilbud"
                  : "Tak — vi kontakter dig"}
              </h3>
              <p className="text-[16px] text-[rgba(242,238,230,.5)]">
                {priceType === "tilbud"
                  ? "Forvent svar inden for 24 timer på hverdage."
                  : "Vi ringer tilbage hurtigst muligt."}
              </p>
              <button
                onClick={() => {
                  setOpenId(null);
                  setFormState("idle");
                }}
                className="mt-8 font-condensed font-bold text-[12px] tracking-[.15em] uppercase text-yellow border border-[rgba(245,196,0,.3)] px-6 py-3 hover:border-yellow transition-colors"
              >
                Luk
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                <div>
                  <span className="font-condensed font-semibold text-[11px] tracking-[.18em] text-yellow block mb-1">
                    — {activeCategory.num}
                  </span>
                  <h3 className="font-condensed font-extrabold text-[28px] uppercase tracking-[.02em] text-cream">
                    {activeCategory.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-[rgba(242,238,230,.4)] hover:text-cream border border-[rgba(242,238,230,.1)] px-4 py-2 transition-colors"
                >
                  Luk ✕
                </button>
              </div>

              <div className="grid grid-cols-[1fr_1fr] gap-10 max-[900px]:grid-cols-1">
                {/* Left column — choices */}
                <div>
                  {/* Employee type pills */}
                  <div className="mb-7">
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                      Type personale (vælg én eller flere)
                    </label>
                    <div className="flex flex-wrap gap-[6px]">
                      {activeCategory.types.map((t) => {
                        const sel = selectedTypes.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleType(t)}
                            className={`font-condensed font-bold text-[11px] tracking-[.1em] uppercase px-[12px] py-[6px] rounded-[1px] border transition-colors ${
                              sel
                                ? "bg-yellow text-black border-yellow"
                                : "bg-[rgba(245,196,0,.06)] border-[rgba(245,196,0,.18)] text-yellow hover:border-[rgba(245,196,0,.4)]"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Antal + dato */}
                  <div className="grid grid-cols-2 gap-4 mb-7">
                    <div>
                      <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                        Antal personale
                      </label>
                      <div className="flex items-center border border-[rgba(242,238,230,.1)] rounded-[2px] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setAntal((n) => Math.max(1, n - 1))}
                          className="w-10 h-11 bg-[rgba(12,12,10,.5)] text-cream text-lg flex items-center justify-center hover:bg-[rgba(245,196,0,.1)] transition-colors flex-shrink-0"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center font-condensed font-bold text-[18px] text-cream bg-[rgba(12,12,10,.5)] h-11 flex items-center justify-center">
                          {antal}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAntal((n) => Math.min(50, n + 1))}
                          className="w-10 h-11 bg-[rgba(12,12,10,.5)] text-cream text-lg flex items-center justify-center hover:bg-[rgba(245,196,0,.1)] transition-colors flex-shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                        Startdato
                      </label>
                      <input
                        name="startdato"
                        type="date"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Price type */}
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-3">
                      Hvad passer bedst?
                    </label>
                    <div className="grid grid-cols-2 gap-[6px]">
                      <button
                        type="button"
                        onClick={() => setPriceType("timepris")}
                        className={`p-4 border rounded-[2px] text-left transition-all ${
                          priceType === "timepris"
                            ? "border-yellow bg-[rgba(245,196,0,.08)]"
                            : "border-[rgba(242,238,230,.1)] hover:border-[rgba(245,196,0,.3)]"
                        }`}
                      >
                        <div
                          className={`font-condensed font-extrabold text-[14px] uppercase tracking-[.05em] mb-1 ${
                            priceType === "timepris" ? "text-yellow" : "text-cream"
                          }`}
                        >
                          Timepris
                        </div>
                        <div className="text-[12px] text-[rgba(242,238,230,.4)] leading-[1.5]">
                          Hurtig haste-løsning
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceType("tilbud")}
                        className={`p-4 border rounded-[2px] text-left transition-all ${
                          priceType === "tilbud"
                            ? "border-yellow bg-[rgba(245,196,0,.08)]"
                            : "border-[rgba(242,238,230,.1)] hover:border-[rgba(245,196,0,.3)]"
                        }`}
                      >
                        <div
                          className={`font-condensed font-extrabold text-[14px] uppercase tracking-[.05em] mb-1 ${
                            priceType === "tilbud" ? "text-yellow" : "text-cream"
                          }`}
                        >
                          Få et tilbud
                        </div>
                        <div className="text-[12px] text-[rgba(242,238,230,.4)] leading-[1.5]">
                          Svar inden for 24 timer
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right column — contact form */}
                <div>
                  {priceType ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4 max-[640px]:grid-cols-1">
                        <div>
                          <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                            {priceType === "tilbud"
                              ? "Virksomhed / navn"
                              : "Dit navn"}
                          </label>
                          <input
                            name="virksomhed"
                            type="text"
                            placeholder={
                              priceType === "tilbud"
                                ? "Firma ApS / dit navn"
                                : "Dit fulde navn"
                            }
                            className={inputClass}
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                            Telefon
                          </label>
                          <input
                            name="telefon"
                            type="tel"
                            placeholder="+45 00 00 00 00"
                            className={inputClass}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                          Email
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="din@mail.dk"
                          className={inputClass}
                          required
                        />
                      </div>

                      {priceType === "tilbud" && (
                        <div className="mb-4">
                          <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-[rgba(242,238,230,.5)] mb-[7px]">
                            Beskriv projektet
                          </label>
                          <textarea
                            name="beskrivelse"
                            placeholder="Opgavens omfang, lokation, varighed og eventuelle krav..."
                            className={`${inputClass} resize-y min-h-[80px]`}
                          />
                        </div>
                      )}

                      {/* Terms */}
                      <div className="mt-4 mb-4">
                        <div className="max-h-[130px] overflow-y-auto bg-[rgba(242,238,230,.04)] border border-[rgba(242,238,230,.1)] rounded-[2px] p-3 mb-3">
                          {contractPoints.map((p) => (
                            <div key={p.title} className="mb-2 last:mb-0">
                              <h5 className="font-condensed font-bold text-[11px] tracking-[.08em] uppercase text-[rgba(242,238,230,.6)] mb-[2px]">
                                {p.title}
                              </h5>
                              <p className="text-[12px] leading-[1.5] text-cream/80">
                                {p.body}
                              </p>
                            </div>
                          ))}
                        </div>
                        <label
                          className={`flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${
                            accepted
                              ? "border-[rgba(242,238,230,.35)]"
                              : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"
                          }`}
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
                            className={`flex-shrink-0 w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${
                              accepted
                                ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]"
                                : "bg-transparent border-[rgba(242,238,230,.3)]"
                            }`}
                            aria-hidden="true"
                          >
                            {accepted && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#F2EEE6"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="text-[12px] leading-[1.5] text-cream select-none">
                            {CUSTOMER_ACCEPT_LABEL}
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={formState === "submitting" || !accepted}
                        className="w-full bg-yellow text-black font-condensed font-extrabold text-[15px] tracking-[.1em] uppercase py-[16px] border-none rounded-[2px] cursor-pointer transition-colors hover:bg-yellow2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {formState === "submitting"
                          ? "Sender..."
                          : priceType === "tilbud"
                          ? "Anmod om tilbud →"
                          : "Book til timepris →"}
                      </button>

                      {errorMsg && (
                        <p className="text-red-400 text-[13px] mt-3">
                          {errorMsg}
                        </p>
                      )}
                      {formState === "error" && (
                        <p className="text-red-400 text-[13px] mt-3">
                          Noget gik galt. Ring til os direkte: +45 42 77 88 66
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center py-12 text-center">
                      <div>
                        <div className="w-12 h-12 border border-[rgba(245,196,0,.25)] rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#F5C400"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                          </svg>
                        </div>
                        <p className="font-condensed font-semibold text-[12px] tracking-[.15em] uppercase text-[rgba(242,238,230,.3)]">
                          Vælg timepris eller tilbud
                          <br />
                          for at udfylde formularen
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
