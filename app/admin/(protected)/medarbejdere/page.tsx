"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TRADES } from "@/lib/constants";
import type { Employee } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  LEDIG: "Ledig",
  UDSENDT: "Udsendt",
  INAKTIV: "Inaktiv",
};

const TYPE_LABELS: Record<string, string> = {
  MEDARBEJDER: "Medarbejder",
  KOORDINATOR: "Koordinator",
};

export default function MedarbejdereListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/employees");
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.employees);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteOne = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne medarbejder?")) return;
    const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const filtered = employees.filter((e) => {
    if (tradeFilter !== "ALL" && e.trade !== tradeFilter) return false;
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.phone.includes(q)) return false;
    }
    return true;
  });

  const inputClass =
    "bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[14px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow placeholder:text-[rgba(242,238,230,.2)]";

  return (
    <div>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Oversigt</p>
          <h1 className="font-condensed font-black text-[44px] uppercase tracking-[-.01em] text-cream leading-none">Medarbejdere</h1>
        </div>
        <Link
          href="/tilmeld"
          target="_blank"
          className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] hover:bg-yellow2 transition-colors"
        >
          + Ny tilmelding
        </Link>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          className={inputClass + " w-[260px]"}
          placeholder="Søg navn eller telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass + " cursor-pointer"} value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)}>
          <option value="ALL">Alle fag</option>
          {Object.entries(TRADES).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select className={inputClass + " cursor-pointer"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Alle status</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(242,238,230,0.07)]">
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Navn</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Fag</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Type</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Status</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Telefon</th>
              <th className="p-4 text-[11px] font-condensed uppercase tracking-[.12em] text-muted">Oprettet</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-muted text-center">Indlæser...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-muted text-center">Ingen medarbejdere</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-b border-[rgba(242,238,230,0.04)] hover:bg-[rgba(245,196,0,.03)]">
                  <td className="p-4">
                    <Link href={`/admin/medarbejdere/${e.id}`} className="text-cream hover:text-yellow">
                      {e.name}
                    </Link>
                  </td>
                  <td className="p-4 text-muted text-[14px]">{TRADES[e.trade as keyof typeof TRADES] || e.trade}</td>
                  <td className="p-4 text-muted text-[14px]">{TYPE_LABELS[e.employeeType] || e.employeeType}</td>
                  <td className="p-4">
                    <span className={`text-[11px] font-condensed uppercase tracking-[.12em] px-2 py-1 rounded-[2px] ${
                      e.status === "LEDIG" ? "bg-yellow/20 text-yellow" :
                      e.status === "UDSENDT" ? "bg-cream/10 text-cream" :
                      "bg-muted/10 text-muted"
                    }`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="p-4 text-muted text-[14px]">{e.phone}</td>
                  <td className="p-4 text-muted text-[13px]">{new Date(e.createdAt).toLocaleDateString("da-DK")}</td>
                  <td className="p-4">
                    <button
                      onClick={() => deleteOne(e.id)}
                      className="text-[11px] font-condensed uppercase tracking-[.12em] text-muted hover:text-red-400"
                    >
                      Slet
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
