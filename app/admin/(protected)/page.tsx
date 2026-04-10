import Link from "next/link";
import { readEmployees, readShifts } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [employees, shifts] = await Promise.all([readEmployees(), readShifts()]);

  const ledige = employees.filter((e) => e.status === "LEDIG").length;
  const udsendte = employees.filter((e) => e.status === "UDSENDT").length;
  const openShifts = shifts.filter((s) => s.status === "OPEN").length;
  const totalSignups = shifts.reduce((acc, s) => acc + s.signups.length, 0);

  const latest = [...employees].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div>
      <div className="mb-10">
        <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Oversigt</p>
        <h1 className="font-condensed font-black text-[44px] uppercase tracking-[-.01em] text-cream leading-none">Dashboard</h1>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-10 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
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
    </div>
  );
}
