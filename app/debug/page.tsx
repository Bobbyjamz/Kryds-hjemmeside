import Link from "next/link";
import { readEmployees, readShifts } from "@/lib/db";
import { readAnalytics, aggregate } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const [employees, shifts, views] = await Promise.all([
    readEmployees(),
    readShifts(),
    readAnalytics(),
  ]);

  const testEmployee = employees.find((e) => e.id === "test0001");
  const testShift = shifts.find((s) => s.id === "testshift001");
  const agg = aggregate(views);

  const checks: Array<{ label: string; ok: boolean; detail?: string }> = [
    {
      label: "Test-medarbejder eksisterer (test0001)",
      ok: !!testEmployee,
      detail: testEmployee
        ? `${testEmployee.name} · ${testEmployee.trade} · status=${testEmployee.status} · tlf ${testEmployee.phone} · kode ${testEmployee.confirmationCode ?? "—"}`
        : "Mangler i data/employees.json",
    },
    {
      label: "Test-vagt eksisterer (testshift001)",
      ok: !!testShift,
      detail: testShift
        ? `${testShift.title} · ${new Date(testShift.startAt).toLocaleString("da-DK")} → ${new Date(testShift.endAt).toLocaleString("da-DK")} · status=${testShift.status}`
        : "Mangler i data/shifts.json",
    },
    {
      label: "Analytics skriver sidevisninger",
      ok: views.length > 0,
      detail: `${views.length} besøg registreret · ${agg.weekCount} i denne uge · ${agg.todayCount} i dag`,
    },
    {
      label: "Contact-email: RESEND_TO eller default",
      ok: true,
      detail: `Sender til ${process.env.RESEND_TO || "kontakt@krydsbyg.com (default)"}`,
    },
    {
      label: "Resend API nøgle sat",
      ok: !!process.env.RESEND_API_KEY,
      detail: process.env.RESEND_API_KEY
        ? "RESEND_API_KEY er konfigureret — mails sendes"
        : "RESEND_API_KEY ikke sat — formularer gemmes men mails sendes IKKE",
    },
    {
      label: "Admin JWT secret sat",
      ok: !!process.env.JWT_SECRET,
      detail: process.env.JWT_SECRET
        ? "JWT_SECRET konfigureret"
        : "JWT_SECRET ikke sat — admin login virker ikke",
    },
  ];

  return (
    <main className="min-h-screen bg-black py-16 px-6">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">
              Diagnostik
            </p>
            <h1 className="font-condensed font-black text-[44px] uppercase tracking-[-.01em] text-cream leading-none">
              /debug
            </h1>
            <p className="text-[14px] text-muted mt-3 max-w-[560px]">
              Systemstatus, testdata og selvtest af formularer og analytics.
              Sikker at vise offentligt — ingen hemmeligheder eksponeres.
            </p>
          </div>
          <Link
            href="/"
            className="text-[12px] font-condensed uppercase tracking-[.15em] text-muted hover:text-yellow transition-colors"
          >
            ← Forsiden
          </Link>
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-2 gap-4 mb-10 max-[700px]:grid-cols-1">
          {[
            { label: "Medarbejdere i DB", value: employees.length },
            { label: "Vagter i DB", value: shifts.length },
            { label: "Sidevisninger i alt", value: views.length },
            { label: "Besøg denne uge", value: agg.weekCount },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-gray border border-[rgba(242,238,230,0.07)] p-5 rounded-[2px]"
            >
              <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-1">
                {s.label}
              </p>
              <p className="text-[36px] font-condensed font-black text-yellow leading-none">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Health checks */}
        <section className="mb-10">
          <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-5">
            Systemtjek
          </h2>
          <ul className="flex flex-col gap-2">
            {checks.map((c) => (
              <li
                key={c.label}
                className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4 flex items-start gap-4"
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[14px] ${
                    c.ok
                      ? "bg-yellow text-black"
                      : "bg-red-500/20 text-red-400 border border-red-400/40"
                  }`}
                  aria-label={c.ok ? "OK" : "Fejl"}
                >
                  {c.ok ? "✓" : "!"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-cream font-semibold">
                    {c.label}
                  </p>
                  {c.detail && (
                    <p className="text-[12px] text-muted mt-1 font-mono break-words">
                      {c.detail}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Top pages */}
        <section className="mb-10">
          <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-5">
            Mest besøgte sider (denne uge)
          </h2>
          <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
            {agg.topPages.length === 0 ? (
              <p className="text-[13px] text-muted">Ingen data endnu.</p>
            ) : (
              <ul className="flex flex-col gap-[10px]">
                {agg.topPages.map(({ path, count }) => (
                  <li key={path} className="flex items-center gap-3">
                    <p className="flex-1 text-[13px] text-cream truncate font-mono">
                      {path}
                    </p>
                    <span className="font-condensed font-black text-[16px] text-yellow flex-shrink-0 w-10 text-right">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Legend / info */}
        <section className="mb-10">
          <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-5">
            Sådan tester du i praksis
          </h2>
          <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-6 text-[14px] text-cream leading-[1.7]">
            <p className="mb-3">
              <span className="text-yellow font-bold">1. Medarbejder-login:</span>{" "}
              Gå til{" "}
              <Link href="/medarbejder/login" className="text-yellow underline">
                /medarbejder/login
              </Link>{" "}
              og log ind med telefon{" "}
              <span className="font-mono text-yellow">11111111</span> og kode{" "}
              <span className="font-mono text-yellow">
                {testEmployee?.confirmationCode ?? "865801"}
              </span>
              .
            </p>
            <p className="mb-3">
              <span className="text-yellow font-bold">2. Se test-vagt:</span>{" "}
              Efter login kan medarbejderen se testvagten{" "}
              <span className="italic">&ldquo;{testShift?.title ?? "—"}&rdquo;</span>{" "}
              og tilmelde sig.
            </p>
            <p className="mb-3">
              <span className="text-yellow font-bold">3. Admin-login:</span>{" "}
              Gå til{" "}
              <Link href="/admin/login" className="text-yellow underline">
                /admin/login
              </Link>{" "}
              med admin-credentials. Dashboard viser besøgsstatistik,
              medarbejdere og vagter.
            </p>
            <p className="mb-3">
              <span className="text-yellow font-bold">4. Kontakt-formular:</span>{" "}
              Udfyld og send formularen på forsiden.
              {process.env.RESEND_API_KEY
                ? " Mail sendes til kontakt@krydsbyg.com."
                : " (RESEND_API_KEY ikke sat — formularen gemmer data men sender ikke mail endnu.)"}
            </p>
            <p>
              <span className="text-yellow font-bold">5. Analytics:</span>{" "}
              Hvert sidebesøg registreres automatisk af{" "}
              <code className="text-yellow font-mono text-[12px]">
                &lt;PageTracker /&gt;
              </code>{" "}
              i{" "}
              <code className="text-yellow font-mono text-[12px]">
                app/layout.tsx
              </code>
              . Admin-dashboardet viser dagligt/ugentligt antal.
            </p>
          </div>
        </section>

        {/* Theme toggle helper */}
        <section>
          <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-5">
            Tema
          </h2>
          <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5 text-[13px] text-muted">
            Brug theme-toggleren i top-navigationen for at skifte mellem lys
            og mørk tilstand. Light mode er default. Denne side skal være
            læselig i begge tilstande.
          </div>
        </section>
      </div>
    </main>
  );
}
