"use client";

import { useState, FormEvent } from "react";
import { useReveal } from "@/hooks/useReveal";

type FormState = "idle" | "submitting" | "success" | "error";

export default function Contact() {
  const ref = useReveal();
  const [formState, setFormState] = useState<FormState>("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[14px] font-light px-[15px] py-3 rounded-[2px] outline-none transition-colors focus:border-yellow appearance-none placeholder:text-[rgba(242,238,230,.2)]";

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
            <a href="mailto:info@kryds.dk" className="text-muted hover:text-cream transition-colors">info@kryds.dk</a>
          </p>
          <p className="text-[15px] leading-[1.72] text-muted mb-[6px]">+45 70 27 00 00</p>
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
                    <input name="virksomhed" type="text" placeholder="Firma ApS eller dit navn" className={inputClass} required />
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
                    <option>Nedrivning &amp; rydning</option>
                    <option>Flise &amp; anlægsarbejde</option>
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
                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="w-full bg-yellow text-black font-condensed font-extrabold text-[16px] tracking-[.12em] uppercase py-[18px] border-none rounded-[2px] cursor-pointer mt-[6px] transition-colors hover:bg-yellow2 disabled:opacity-60"
                >
                  {formState === "submitting" ? "Sender..." : "Sæt et kryds i kalenderen →"}
                </button>
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
