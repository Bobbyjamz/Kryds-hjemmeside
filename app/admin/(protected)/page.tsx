import Link from "next/link";
import { readEmployees, readShifts } from "@/lib/db";
import { readAnalytics, aggregate, last7Days } from "@/lib/analytics";
import HealthStatus from "./HealthStatus";

export default async function AdminDashboardPage() {
  const [employees, shifts, views] = await Promise.all([
    readEmployees(),
    readShifts(),
    readAnalytics(),
  ]);

  const ledige = employees.filter((e) => e.status === "LEDIG").length;
  const udsendte = employees.filter((e) => e.status === "UDSENDT").length;
  const openShifts = shifts.filter((s) => s.status === "OPEN").length;
  const totalSignups = shifts.reduce((acc, s) => acc + s.signups.length, 0);
  const latest = [...employees]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const stats = aggregate(views);
  const maxDaily = Math.max(...stats.daily.map((d) => d.count), 1);

  function fmtSeconds(s: number) {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  function shortDate(iso: string) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("da-DK", { weekday: "short", day: "numeric" });
  }

  return (
    <div>
      <div className="mb-8 max-[700px]:mb-6">
        <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Oversigt</p>
        <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[32px] uppercase tracking-[-.01em] text-cream leading-none">Dashboard</h1>
      </div>

      <HealthStatus />

      {/* ── Medarbejder stats ───────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-10 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
        {[
          { label: "Medarbejdere", value: employees.length },
          { label: "Ledige", value: ledige },
          { label: "Udsendte", value: udsendte },
          { label: "Åbne vagter", value: openShifts },
        ].map((s) => (
          <div key={s.label} className="bg-gray border-l-4 border-l-yellow border border-[rgba(242,238,230,0.07)] p-5 rounded-[2px]">
            <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-1">{s.label}</p>
            <p className="text-[36px] font-condensed font-black text-cream leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Analytics ──────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream">
            Hjemmeside trafik
          </h2>
          <span className="font-condensed text-[11px] tracking-[.12em] uppercase text-muted">Seneste 7 dage</span>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 max-[700px]:grid-cols-1">
          {[
            { label: "Besøg i dag", value: stats.todayCount },
            { label: "Besøg denne uge", value: stats.weekCount },
            { label: "Gns. tid på siden", value: fmtSeconds(stats.avgDuration) },
          ].map((s) => (
            <div key={s.label} className="bg-gray border border-[rgba(242,238,230,0.07)] p-5 rounded-[2px]">
              <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-1">{s.label}</p>
              <p className="text-[32px] font-condensed font-black text-yellow leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Daily sparkline */}
        <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-6 max-[500px]:p-4 mb-6">
          <p className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-muted mb-4">Daglige besøg</p>
          <div className="flex items-end gap-[6px] max-[500px]:gap-[3px] h-[88px] max-[500px]:h-[72px]">
            {stats.daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-[6px] group">
                <span className="font-condensed text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.count}
                </span>
                <div
                  className="w-full rounded-t-[2px] bg-yellow transition-all duration-300 group-hover:bg-yellow2 min-h-[4px]"
                  style={{ height: `${Math.max(4, (d.count / maxDaily) * 56)}px` }}
                  title={`${shortDate(d.date)}: ${d.count} besøg`}
                />
                <span className="font-condensed text-[9px] tracking-[.05em] text-muted text-center leading-tight">
                  {shortDate(d.date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top pages + countries */}
        <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          {/* Top pages */}
          <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
            <p className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-muted mb-4">Mest besøgte sider</p>
            {stats.topPages.length === 0 ? (
              <p className="text-[13px] text-muted">Ingen data endnu.</p>
            ) : (
              <ul className="flex flex-col gap-[10px]">
                {stats.topPages.map(({ path, count }) => (
                  <li key={path} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-cream truncate font-mono">{path}</p>
                      <div className="mt-1 h-[3px] rounded-full bg-[rgba(242,238,230,.08)] overflow-hidden">
                        <div
                          className="h-full bg-yellow rounded-full"
                          style={{ width: `${(count / (stats.topPages[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-condensed font-black text-[16px] text-yellow flex-shrink-0 w-8 text-right">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Countries */}
          <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
            <p className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-muted mb-4">Besøgende regioner</p>
            {stats.topCountries.length === 0 ? (
              <p className="text-[13px] text-muted">Ingen data endnu.</p>
            ) : (
              <ul className="flex flex-col gap-[10px]">
                {stats.topCountries.map(({ country, count }) => (
                  <li key={country} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-cream">{country}</p>
                      <div className="mt-1 h-[3px] rounded-full bg-[rgba(242,238,230,.08)] overflow-hidden">
                        <div
                          className="h-full bg-[rgba(245,196,0,.6)] rounded-full"
                          style={{ width: `${(count / (stats.topCountries[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-condensed font-black text-[16px] text-yellow flex-shrink-0 w-8 text-right">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Medarbejdere + vagter ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
        <div className="bg-gray p-6 border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream">Seneste tilmeldinger</h2>
            <Link href="/admin/medarbejdere" className="text-[11px] font-condensed uppercase tracking-[.12em] text-yellow hover:underline">Se alle →</Link>
          </div>
          {latest.length === 0 ? (
            <p className="text-muted text-[14px]">Ingen tilmeldinger endnu.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {latest.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/admin/medarbejdere/${e.id}`}
                    className="flex items-center justify-between px-3 py-3 border border-[rgba(242,238,230,0.05)] rounded-[2px] hover:border-yellow transition-colors"
                  >
                    <div>
                      <p className="text-[14px] text-cream">{e.name}</p>
                      <p className="text-[11px] text-muted uppercase tracking-[.1em] font-condensed">{e.trade}</p>
                    </div>
                    <span className="text-[11px] text-muted">{new Date(e.createdAt).toLocaleDateString("da-DK")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-gray p-6 border border-[rgba(242,238,230,0.07)] rounded-[2px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream">Vagter</h2>
            <Link href="/admin/vagter" className="text-[11px] font-condensed uppercase tracking-[.12em] text-yellow hover:underline">Håndter →</Link>
          </div>
          <p className="text-[14px] text-cream mb-1">{openShifts} åbne vagter</p>
          <p className="text-[13px] text-muted">{totalSignups} samlede tilmeldinger</p>
        </div>
      </div>

      {/* ── System & Værktøjer ──────────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream">
            System & Værktøjer
          </h2>
          <span className="font-condensed text-[11px] tracking-[.12em] uppercase text-muted">Diagnostik</span>
        </div>

        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
          {/* Debug */}
          <Link
            href="/admin/debug"
            className="group bg-gray border border-[rgba(242,238,230,0.07)] hover:border-yellow rounded-[2px] p-5 transition-colors flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[26px] leading-none">🔧</span>
              <span className="text-[10px] font-condensed uppercase tracking-[.15em] text-muted group-hover:text-yellow transition-colors">Åbn →</span>
            </div>
            <div>
              <p className="font-condensed font-extrabold text-[16px] uppercase tracking-[.04em] text-cream leading-tight">Debug</p>
              <p className="text-[12px] text-muted mt-1 leading-snug">Live status på miljøvariabler, API-keys og system-helbred.</p>
            </div>
          </Link>

          {/* Helbred */}
          <Link
            href="/admin/helbred"
            className="group bg-gray border border-[rgba(242,238,230,0.07)] hover:border-yellow rounded-[2px] p-5 transition-colors flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[26px] leading-none">♥</span>
              <span className="text-[10px] font-condensed uppercase tracking-[.15em] text-muted group-hover:text-yellow transition-colors">Åbn →</span>
            </div>
            <div>
              <p className="font-condensed font-extrabold text-[16px] uppercase tracking-[.04em] text-cream leading-tight">Helbred</p>
              <p className="text-[12px] text-muted mt-1 leading-snug">Sarah Helbred — træning, kost, tilskud og Google Kalender.</p>
            </div>
          </Link>

          {/* Council */}
          <Link
            href="/admin/council"
            className="group bg-gray border border-[rgba(242,238,230,0.07)] hover:border-yellow rounded-[2px] p-5 transition-colors flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[26px] leading-none">▲</span>
              <span className="text-[10px] font-condensed uppercase tracking-[.15em] text-muted group-hover:text-yellow transition-colors">Åbn →</span>
            </div>
            <div>
              <p className="font-condensed font-extrabold text-[16px] uppercase tracking-[.04em] text-cream leading-tight">Council</p>
              <p className="text-[12px] text-muted mt-1 leading-snug">AI rådgivere — economy, marketing, operations og risk.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
