"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lead, SalgStatus } from "@/lib/types";
import { mandagDenneUge, ringIDag, ugetal } from "@/lib/salg/beregn";
import { fornavnAf, lavMail } from "@/lib/salg/skabelon";
import { parseIndsatteRaekker, type SalgRaekke } from "@/lib/salg/import";

const STATUS_TEKST: Record<SalgStatus, string> = {
  ny: "Ny",
  mail_sendt: "Mail sendt",
  ringet: "Ringet",
  samtale: "Samtale",
  tilbud: "Tilbud",
  vundet: "Vundet",
  tabt: "Tabt",
};
const STATUS_FARVE: Record<SalgStatus, string> = {
  ny: "bg-white/10 text-cream/70",
  mail_sendt: "bg-blue-500/20 text-blue-300",
  ringet: "bg-purple-500/20 text-purple-300",
  samtale: "bg-[rgba(245,196,0,.15)] text-yellow",
  tilbud: "bg-orange-500/20 text-orange-300",
  vundet: "bg-green-500/20 text-green-300",
  tabt: "bg-red-500/20 text-red-300",
};
const STATUSSER = Object.keys(STATUS_TEKST) as SalgStatus[];
const TOM_FORM: SalgRaekke = { firma: "", kontaktnavn: "", email: "", telefon: "" };
const JSON_HEADERS = { "Content-Type": "application/json" };

const kort = "bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px]";
const knap = "font-condensed font-semibold text-[11px] tracking-[.12em] uppercase px-3 py-2 rounded-[2px] transition-colors disabled:opacity-40";
const gulKnap = `${knap} bg-yellow text-black hover:opacity-90`;
const stilleKnap = `${knap} border border-[rgba(242,238,230,.15)] text-muted hover:text-cream`;
const felt = "w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow";
const overskrift = "font-condensed font-black text-[18px] uppercase text-cream";

type Preview = { lead: Lead; subject: string; body: string };

export default function SalgPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [indlaeser, setIndlaeser] = useState(true);
  const [fejl, setFejl] = useState<string | null>(null);
  const [besked, setBesked] = useState<string | null>(null);
  const [filter, setFilter] = useState<SalgStatus | "alle">("alle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [arbejder, setArbejder] = useState(false);
  const [form, setForm] = useState<SalgRaekke>(TOM_FORM);
  const [indsat, setIndsat] = useState("");

  const kald = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    if (res.status === 401) {
      setFejl("Din session er udløbet. Du sendes til login.");
      setTimeout(() => { window.location.href = "/admin/login"; }, 2000);
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      setFejl(data.error ?? "Ukendt fejl");
      return null;
    }
    return data;
  }, []);

  const hent = useCallback(async () => {
    const data = await kald("/api/admin/salg");
    if (data) setLeads(data.leads);
    setIndlaeser(false);
  }, [kald]);

  useEffect(() => { hent(); }, [hent]);

  const erstat = (opdateret: Lead) =>
    setLeads((alle) => alle.map((l) => (l.id === opdateret.id ? opdateret : l)));

  const patch = async (payload: Record<string, unknown>) => {
    setFejl(null);
    const data = await kald("/api/admin/salg", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(payload) });
    if (data) erstat(data.lead);
  };

  const vaelgStatus = (lead: Lead, status: SalgStatus) => {
    if (status !== "vundet") return patch({ id: lead.id, status });
    const svar = window.prompt("Beløb ekskl. moms (kr.)", String(lead.salg?.beloeb ?? 6000));
    if (svar === null) return;
    const beloeb = Number(svar.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(beloeb) || beloeb < 0) {
      setFejl("Ugyldigt beløb");
      return;
    }
    return patch({ id: lead.id, status, beloeb });
  };

  const gemNote = (lead: Lead, note: string) => {
    if (note !== (lead.salg?.note ?? "")) patch({ id: lead.id, note });
  };

  const tilfoej = async (rows: SalgRaekke[]) => {
    setFejl(null);
    setBesked(null);
    setArbejder(true);
    const data = await kald("/api/admin/salg", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ rows }) });
    setArbejder(false);
    if (!data) return false;
    const sprunget = data.sprunget.length ? ` · sprunget over: ${data.sprunget.join(", ")}` : "";
    setBesked(`${data.tilfoejet} tilføjet${sprunget}`);
    await hent();
    return true;
  };

  const aabnPreview = (lead: Lead) => {
    const mail = lavMail({ fornavn: fornavnAf(lead.contactName), firma: lead.companyName }, new Date());
    setPreview({ lead, ...mail });
  };

  const send = async () => {
    if (!preview) return;
    setFejl(null);
    setArbejder(true);
    const data = await kald("/api/admin/salg/send", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ id: preview.lead.id, subject: preview.subject, body: preview.body }),
    });
    setArbejder(false);
    if (!data) return;
    erstat(data.lead);
    setBesked(`Mail sendt til ${preview.lead.companyName} — kopi ligger i din indbakke`);
    setPreview(null);
  };

  const tal = useMemo(() => ugetal(leads, mandagDenneUge(new Date())), [leads]);
  const ringListe = useMemo(() => ringIDag(leads, new Date()), [leads]);
  const viste = useMemo(
    () =>
      leads
        .filter((l) => filter === "alle" || l.salg?.status === filter)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [leads, filter],
  );
  const tal4: [string, string | number][] = [
    ["Samtaler", tal.samtaler],
    ["Tilbud sendt", tal.tilbud],
    ["Opgaver solgt", tal.solgt],
    ["Faktureret", `${tal.faktureret.toLocaleString("da-DK")} kr`],
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-yellow mb-2">Salg</p>
        <h1 className="font-condensed font-black text-[40px] uppercase tracking-[-.01em] text-cream leading-none">Salgsliste</h1>
        <p className="text-muted text-[14px] mt-2">Tilføj → send mail → ring → samtale → tilbud → vundet.</p>
      </div>

      {fejl && <p className={`${kort} p-3 text-[13px] text-red-400`}>{fejl}</p>}
      {besked && <p className={`${kort} p-3 text-[13px] text-green-300`}>{besked}</p>}

      <section className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2">
        {tal4.map(([label, vaerdi]) => (
          <div key={label} className={`${kort} p-4`}>
            <p className="text-[11px] uppercase tracking-[.15em] text-muted">{label} · denne uge</p>
            <p className="font-condensed font-black text-[32px] text-cream leading-none mt-2">{vaerdi}</p>
          </div>
        ))}
      </section>

      <section className={`${kort} p-4`}>
        <h2 className="font-condensed font-black text-[20px] uppercase text-yellow">Ring i dag ({ringListe.length})</h2>
        {ringListe.length === 0 ? (
          <p className="text-[13px] text-muted mt-2">Ingen at ringe til lige nu.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[rgba(242,238,230,0.07)]">
            {ringListe.map((lead) => (
              <li key={lead.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-cream text-[14px] font-medium">{lead.companyName}</p>
                  <p className="text-muted text-[12px]">
                    {lead.contactName ?? "Ukendt kontakt"} · {lead.salg ? STATUS_TEKST[lead.salg.status] : ""}
                  </p>
                </div>
                {lead.phone ? (
                  <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className={gulKnap}>Ring {lead.phone}</a>
                ) : (
                  <span className="text-[12px] text-muted">Intet telefonnummer</span>
                )}
                <button className={stilleKnap} onClick={() => vaelgStatus(lead, "ringet")}>Ingen svar</button>
                <button className={stilleKnap} onClick={() => vaelgStatus(lead, "samtale")}>Samtale</button>
                <button className={stilleKnap} onClick={() => vaelgStatus(lead, "tabt")}>Tabt</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${kort} p-4 grid grid-cols-2 gap-6 max-[900px]:grid-cols-1`}>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await tilfoej([form])) setForm(TOM_FORM);
          }}
        >
          <h2 className={overskrift}>Tilføj kontakt</h2>
          <input className={felt} placeholder="Firma *" required value={form.firma} onChange={(e) => setForm({ ...form, firma: e.target.value })} />
          <input className={felt} placeholder="Kontaktperson" value={form.kontaktnavn ?? ""} onChange={(e) => setForm({ ...form, kontaktnavn: e.target.value })} />
          <input className={felt} placeholder="E-mail" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={felt} placeholder="Telefon" type="tel" value={form.telefon ?? ""} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
          <button type="submit" className={gulKnap} disabled={arbejder}>Tilføj</button>
        </form>
        <div className="space-y-2">
          <h2 className={overskrift}>Indsæt fra Excel</h2>
          <p className="text-[12px] text-muted">Kopiér rækker med kolonnerne Firma · Kontaktperson · E-mail · Telefon og indsæt her.</p>
          <textarea className={felt} rows={6} value={indsat} onChange={(e) => setIndsat(e.target.value)} />
          <button
            className={gulKnap}
            disabled={arbejder || !indsat.trim()}
            onClick={async () => {
              if (await tilfoej(parseIndsatteRaekker(indsat))) setIndsat("");
            }}
          >
            Tilføj rækker
          </button>
        </div>
      </section>

      <section className={`${kort} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={overskrift}>Alle kontakter ({viste.length})</h2>
          <select className={`${felt} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as SalgStatus | "alle")}>
            <option value="alle">Alle</option>
            {STATUSSER.map((s) => <option key={s} value={s}>{STATUS_TEKST[s]}</option>)}
          </select>
        </div>
        {indlaeser ? (
          <p className="text-[13px] text-muted mt-3">Indlæser…</p>
        ) : viste.length === 0 ? (
          <p className="text-[13px] text-muted mt-3">Ingen kontakter endnu. Tilføj den første ovenfor.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[rgba(242,238,230,0.07)]">
            {viste.map((lead) => (
              <li key={lead.id} className="py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-cream text-[14px] font-medium">{lead.companyName}</p>
                    <p className="text-muted text-[12px]">
                      {[lead.contactName, lead.email || "ingen e-mail", lead.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {lead.salg && (
                    <span className={`text-[11px] px-2 py-1 rounded-[2px] ${STATUS_FARVE[lead.salg.status]}`}>
                      {STATUS_TEKST[lead.salg.status]}
                      {lead.salg.status === "vundet" && lead.salg.beloeb ? ` · ${lead.salg.beloeb.toLocaleString("da-DK")} kr` : ""}
                    </span>
                  )}
                  <button className={gulKnap} disabled={!lead.email} onClick={() => aabnPreview(lead)}>Send mail</button>
                  <select
                    className={`${felt} w-auto`}
                    value={lead.salg?.status}
                    onChange={(e) => vaelgStatus(lead, e.target.value as SalgStatus)}
                  >
                    {STATUSSER.map((s) => <option key={s} value={s}>{STATUS_TEKST[s]}</option>)}
                  </select>
                </div>
                <input
                  className={felt}
                  placeholder="Note"
                  defaultValue={lead.salg?.note ?? ""}
                  onBlur={(e) => gemNote(lead, e.target.value)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className={`${kort} bg-black2 w-full max-w-[640px] p-5 space-y-3`}>
            <p className="font-condensed font-black text-[20px] uppercase text-cream">Mail til {preview.lead.companyName}</p>
            <p className="text-[12px] text-muted">Til: {preview.lead.email} · kopi til din indbakke</p>
            <input className={felt} value={preview.subject} onChange={(e) => setPreview({ ...preview, subject: e.target.value })} />
            <textarea className={felt} rows={12} value={preview.body} onChange={(e) => setPreview({ ...preview, body: e.target.value })} />
            <p className="text-[11px] text-muted">Signatur (Krystian Balasz) og afmeldingslink tilføjes automatisk.</p>
            <div className="flex gap-2 justify-end">
              <button className={stilleKnap} onClick={() => setPreview(null)} disabled={arbejder}>Annullér</button>
              <button className={gulKnap} onClick={send} disabled={arbejder}>{arbejder ? "Sender…" : "Send"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
