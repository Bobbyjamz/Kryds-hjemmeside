"use client";

import { useState, FormEvent } from "react";
import { useReveal } from "@/hooks/useReveal";
import {
  getCustomerContractPoints,
  CUSTOMER_CONTRACT_VERSION,
  CUSTOMER_ACCEPT_LABEL,
} from "@/lib/contract";

type FormState = "idle" | "submitting" | "success" | "error";

export default function Contact() {
  const ref = useReveal();
  const [formState, setFormState] = useState<FormState>("idle");
  const [accepted, setAccepted] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const contractPoints = getCustomerContractPoints(customerName);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accepted) {
      setErrorMsg("Du skal acceptere kundevilkårene for at sende forespørgslen.");
      return;
    }
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
      if (res.ok) {
        setFormState("success");
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  };

  const inputClass =
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[16px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-[rgba(242,238,230,.2)]";

  return (
    <section id="contract" className="bg-black2 py-[100px] px-[52px] max-[900px]:py-[70px] max-[900px]:px-5" ref={ref}>
      <div className="eyebrow reveal flex items-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
        Kom i gang
      </div>
      <h2 className="reveal font-condensed font-black text-[clamp(38px,4.5vw,60px)] uppercase leading-[.95] tracking-[-.01em]">
        Sæt et <span className="text-yellow">kryds</span><br />i kalenderen
      </h2>
      <div className="reveal grid grid-cols-[1fr_1.1fr] gap-20 mt-16 items-start max-[900px]:grid-cols-1 max-[900px]:gap-10">
        {/* Info column */}
        <div>
          <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-[14px]">
            Hvad er inkluderet
          </h3>
          <ul className="list-none">
            {[
              "Personlig kontaktperson fra dag ét",
              "Skræddersyet bemandingsplan til projektet",
              "Kontrakt med klare vilkår og timepriser",
              "Ansvarsforsikret og screenet personale",
              "Fleksibel op- og nedskalering undervejs",
              "Samlet faktura pr. periode",
            ].map((item) => (
              <li key={item} className="text-[15px] leading-[1.7] text-muted py-[9px] border-b border-[rgba(242,238,230,0.07)] flex items-center gap-3">
                <span className="bx" />{item}
              </li>
            ))}
          </ul>

          <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-[14px] mt-10">
            Timepriser (vejledende)
          </h3>
          <ul className="list-none">
            {[
              "Byggehjælper / renovering — fra 170 kr/t",
              "Maling & spartling — fra 175 kr/t",
              "Havearbejde — fra 160 kr/t",
              "Montering — fra 180 kr/t",
              "Nedrivning & rydning — fra 165 kr/t",
              "Weekend- og aftentillæg gælder",
            ].map((item) => (
              <li key={item} className="text-[15px] leading-[1.7] text-muted py-[9px] border-b border-[rgba(242,238,230,0.07)] flex items-center gap-3">
                <span className="bx" />{item}
              </li>
            ))}
          </ul>

          <h3 className="font-condensed font-bold text-[13px] tracking-[.18em] uppercase text-yellow mb-[14px] mt-10">
            Kontakt os direkte
          </h3>
          <p className="text-[15px] leading-[1.72] text-muted mb-[6px]">
            <a href="mailto:Kontakt@KrydsByg.com" className="text-muted hover:text-cream transition-colors">Kontakt@KrydsByg.com</a>
          </p>
          <p className="text-[15px] leading-[1.72] text-muted mb-[6px]">+45 42 77 88 66</p>
          <p className="text-[15px] leading-[1.72] text-muted">København, Danmark</p>
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
                Tak for din forespørgsel
              </h3>
              <p className="text-[16px] text-muted">Vi vender tilbage inden for 2 timer.</p>
            </div>
          ) : (
            <>
              <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.04em] text-cream mb-7">
                Send en forespørgsel
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[900px]:grid-cols-1">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      Virksomhed / navn
                    </label>
                    <input
                      name="virksomhed"
                      type="text"
                      placeholder="Firma ApS eller dit navn"
                      className={inputClass}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      Kontaktperson
                    </label>
                    <input name="kontaktperson" type="text" placeholder="Fulde navn" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[900px]:grid-cols-1">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      Email
                    </label>
                    <input name="email" type="email" placeholder="din@mail.dk" className={inputClass} required />
                  </div>
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      Telefon
                    </label>
                    <input name="telefon" type="tel" placeholder="+45 00 00 00 00" className={inputClass} />
                  </div>
                </div>
                <div className="mb-[18px]">
                  <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                    Type af opgave
                  </label>
                  <select name="opgavetype" className={`${inputClass} cursor-pointer`} required>
                    <option value="">Vælg opgavetype...</option>
                    <option>Renovering</option>
                    <option>Maling &amp; spartling</option>
                    <option>Havearbejde</option>
                    <option>Montering</option>
                    <option>Byggepladsbehjælp</option>
                    <option>Flyttearbejde</option>
                    <option>Flise &amp; anlægsarbejde</option>
                    <option>Events &amp; sceneopbygning</option>
                    <option>Kombineret / andet</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-[14px] mb-[18px] max-[900px]:grid-cols-1">
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      Antal personer
                    </label>
                    <input name="antal" type="number" placeholder="f.eks. 3" min="1" className={inputClass} />
                  </div>
                  <div>
                    <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                      Startdato
                    </label>
                    <input name="startdato" type="date" className={inputClass} />
                  </div>
                </div>
                <div className="mb-[18px]">
                  <label className="block font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-muted mb-[7px]">
                    Beskriv projektet
                  </label>
                  <textarea
                    name="beskrivelse"
                    placeholder="Fortæl om opgaven — sted, omfang, varighed og eventuelle krav til erfaring eller udstyr..."
                    className={`${inputClass} resize-y min-h-[96px]`}
                  />
                </div>
                {/* Customer contract */}
                <div className="mt-6 mb-4">
                  <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-condensed font-extrabold text-[15px] uppercase tracking-[.08em] text-cream">
                      Kundevilkår — leje af vikar
                    </h4>
                    <span className="font-condensed text-[10px] tracking-[.18em] uppercase text-muted">
                      Version {CUSTOMER_CONTRACT_VERSION}
                    </span>
                  </div>
                  <div className="max-h-[240px] max-[900px]:max-h-[160px] overflow-y-auto bg-[rgba(242,238,230,.03)] border border-[rgba(242,238,230,.1)] rounded-[2px] p-4">
                    {contractPoints.map((p) => (
                      <div key={p.title} className="mb-3 last:mb-0">
                        <h5 className="font-condensed font-bold text-[12px] tracking-[.08em] uppercase text-[rgba(242,238,230,.6)] mb-1">
                          {p.title}
                        </h5>
                        <p className="text-[13px] leading-[1.55] text-cream/90">{p.body}</p>
                      </div>
                    ))}
                  </div>
                  <label
                    className={`mt-3 flex items-start gap-3 bg-[rgba(242,238,230,.04)] border rounded-[2px] p-3 cursor-pointer transition-colors ${
                      accepted ? "border-[rgba(242,238,230,.35)]" : "border-[rgba(242,238,230,.12)] hover:border-[rgba(242,238,230,.25)]"
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
                        accepted ? "bg-[rgba(242,238,230,.2)] border-[rgba(242,238,230,.5)]" : "bg-transparent border-[rgba(242,238,230,.3)]"
                      }`}
                      aria-hidden="true"
                    >
                      {accepted && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2EEE6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[13px] leading-[1.5] text-cream select-none">
                      {CUSTOMER_ACCEPT_LABEL}
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={formState === "submitting" || !accepted}
                  className="w-full bg-yellow text-black font-condensed font-extrabold text-[16px] tracking-[.12em] uppercase py-[18px] border-none rounded-[2px] cursor-pointer mt-[6px] transition-colors hover:bg-yellow2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {formState === "submitting" ? "Sender..." : "Sæt et kryds i kalenderen →"}
                </button>
                {errorMsg && (
                  <p className="text-red-400 text-[14px] mt-3 text-center">{errorMsg}</p>
                )}
                {formState === "error" && (
                  <p className="text-red-400 text-[14px] mt-3 text-center">
                    Noget gik galt. Prøv igen eller kontakt os direkte.
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
