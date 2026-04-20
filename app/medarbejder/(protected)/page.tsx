"use client";

import { useEffect, useState } from "react";
import { TRADES } from "@/lib/constants";
import type { Shift } from "@/lib/types";

interface Data {
  employee: { id: string; name: string; trade: string; status: string };
  open: Shift[];
  mine: Shift[];
}

interface FeedItem {
  id: string;
  title: string;
  body: string;
  priority: string;
  createdAt: string;
}

export default function MedarbejderDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/medarbejder/shifts");
    if (res.ok) {
      setData(await res.json());
    } else {
      setError("Kunne ikke hente vagter");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    fetch("/api/admin/feed")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setFeed(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const signup = async (shiftId: string, action: "signup" | "withdraw" = "signup") => {
    const res = await fetch("/api/medarbejder/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId, action }),
    });
    if (res.ok) load();
  };

  if (loading) return <p className="text-muted">Indlæser...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return null;

  const tradeLabel = TRADES[data.employee.trade as keyof typeof TRADES] || data.employee.trade;

  return (
    <div>
      <div className="mb-10">
        <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Dit dashboard</p>
        <h1 className="font-condensed font-black text-[44px] uppercase tracking-[-.01em] text-cream leading-none">Hej {data.employee.name.split(" ")[0]}</h1>
        <p className="text-[14px] text-muted mt-2">Dit fag: <span className="text-cream">{tradeLabel}</span></p>
      </div>

      {feed.length > 0 && (
        <section className="mb-10">
          <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-4">
            Beskeder fra Kryds
          </h2>
          <div className="space-y-3">
            {feed.slice(0, 5).map((msg) => (
              <div
                key={msg.id}
                className={`p-5 rounded-[2px] border ${
                  msg.priority === "urgent"
                    ? "border-yellow bg-[rgba(245,196,0,.06)]"
                    : "border-[var(--border)] bg-gray"
                }`}
              >
                {msg.priority === "urgent" && (
                  <span className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-yellow mb-2 block">
                    Vigtigt
                  </span>
                )}
                <h3 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.02em] text-cream mb-2">
                  {msg.title}
                </h3>
                <p className="text-[14px] text-muted leading-[1.6] whitespace-pre-wrap">{msg.body}</p>
                <p className="text-[11px] text-muted mt-3">
                  {new Date(msg.createdAt).toLocaleDateString("da-DK", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-12">
        <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-4">Mine vagter</h2>
        {data.mine.length === 0 ? (
          <p className="text-muted text-[14px]">Du har ikke budt ind på nogen vagter endnu.</p>
        ) : (
          <ul className="space-y-3">
            {data.mine.map((s) => (
              <li key={s.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5 flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.02em] text-cream">{s.title}</h3>
                    {s.assignedTo === data.employee.id && (
                      <span className="text-[10px] font-condensed uppercase tracking-[.12em] px-2 py-[2px] rounded-[2px] bg-yellow text-black">Tildelt dig</span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted font-condensed uppercase tracking-[.1em]">{s.location || "—"}</p>
                  <p className="text-[13px] text-cream mt-1">{new Date(s.startAt).toLocaleString("da-DK")} → {new Date(s.endAt).toLocaleString("da-DK")}</p>
                  {s.hourlyRate && <p className="text-[13px] text-yellow mt-1">{s.hourlyRate} kr/t</p>}
                  {s.description && <p className="text-[13px] text-muted mt-2 leading-[1.5]">{s.description}</p>}
                </div>
                {s.status === "OPEN" && s.assignedTo !== data.employee.id && (
                  <button
                    onClick={() => signup(s.id, "withdraw")}
                    className="font-condensed font-semibold text-[11px] tracking-[.15em] uppercase text-muted border border-[rgba(242,238,230,.1)] hover:text-red-400 hover:border-red-400 px-4 py-2 rounded-[2px] transition-colors"
                  >
                    Træk tilbage
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-4">Åbne vagter i dit fag</h2>
        {data.open.length === 0 ? (
          <p className="text-muted text-[14px]">Der er ingen åbne vagter lige nu. Tjek tilbage senere.</p>
        ) : (
          <ul className="space-y-3">
            {data.open.map((s) => {
              const alreadySignedUp = s.signups.includes(data.employee.id);
              return (
                <li key={s.id} className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5 flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-[260px]">
                    <h3 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.02em] text-cream mb-1">{s.title}</h3>
                    <p className="text-[12px] text-muted font-condensed uppercase tracking-[.1em]">{s.location || "—"}</p>
                    <p className="text-[13px] text-cream mt-1">{new Date(s.startAt).toLocaleString("da-DK")} → {new Date(s.endAt).toLocaleString("da-DK")}</p>
                    {s.hourlyRate && <p className="text-[13px] text-yellow mt-1">{s.hourlyRate} kr/t</p>}
                    {s.description && <p className="text-[13px] text-muted mt-2 leading-[1.5]">{s.description}</p>}
                  </div>
                  {alreadySignedUp ? (
                    <span className="font-condensed font-semibold text-[11px] tracking-[.15em] uppercase text-muted px-4 py-2">Du har budt ind</span>
                  ) : (
                    <button
                      onClick={() => signup(s.id)}
                      className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-5 py-3 rounded-[2px] hover:bg-yellow2 transition-colors"
                    >
                      Byd ind
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
