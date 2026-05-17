import Link from "next/link";
import Anthropic from "@anthropic-ai/sdk";
import {
  readEmployees,
  readShifts,
  readLeads,
  readRecentDailyStats,
  readFeedbackInsights,
} from "@/lib/db";
import { readAnalytics, aggregate } from "@/lib/analytics";
import {
  DEFAULT_FILTERS,
  FAGGRUPPE_CONFIG,
} from "@/lib/lead-finder/filters/filter-config";
import { ALL_FAGGRUPPER, KRITISKE_FAGGRUPPER } from "@/lib/lead-finder/types";

export const dynamic = "force-dynamic";

async function testAnthropicApi(): Promise<{ ok: boolean; detail: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, detail: "ANTHROPIC_API_KEY mangler — sæt den i Vercel dashboard" };
  }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "ping" }],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "ok";
    return { ok: true, detail: `API svarer korrekt (${res.model}) — svar: "${text.slice(0, 40)}"` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("credit")) {
      return { ok: false, detail: `Credits opbrugt — køb credits på console.anthropic.com` };
    }
    if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("auth")) {
      return { ok: false, detail: `Ugyldig API-nøgle — tjek ANTHROPIC_API_KEY i Vercel` };
    }
    return { ok: false, detail: `API fejl: ${msg.slice(0, 120)}` };
  }
}

export default async function DebugPage() {
  const [employees, shifts, views, leads, recentStats, feedback, anthropicTest] = await Promise.all([
    readEmployees(),
    readShifts(),
    readAnalytics(),
    readLeads().catch(() => []),
    readRecentDailyStats(7).catch(() => []),
    readFeedbackInsights().catch(() => null),
    testAnthropicApi(),
  ]);

  const testEmployee = employees.find((e) => e.id === "test0001");
  const testShift = shifts.find((s) => s.id === "testshift001");
  const agg = aggregate(views);

  // ── LeadBot v2: beregn lead-stats ─────────────────────────────────────────
  const leadStats = {
    total: leads.length,
    byStatus: {} as Record<string, number>,
    byType: { company: 0, private: 0, employee: 0 },
    withEmail: 0,
    withPhone: 0,
    emailOpened: 0,
    sentLast7Days: 0,
  };
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const lead of leads) {
    leadStats.byStatus[lead.status] = (leadStats.byStatus[lead.status] || 0) + 1;
    const lt = (lead.leadType || "company") as keyof typeof leadStats.byType;
    if (lt in leadStats.byType) leadStats.byType[lt]++;
    if (lead.email) leadStats.withEmail++;
    if (lead.phone) leadStats.withPhone++;
    if (lead.emailOpened) leadStats.emailOpened++;
    if (lead.sentAt && new Date(lead.sentAt).getTime() >= sevenDaysAgo) leadStats.sentLast7Days++;
  }

  // 7-dages totals fra daily-stats
  const sevenDayTotals = recentStats.reduce(
    (acc, d) => ({
      company: acc.company + d.company,
      private: acc.private + d.private,
      employee: acc.employee + d.employee,
    }),
    { company: 0, private: 0, employee: 0 },
  );
  const faggruppe7d: Record<string, number> = {};
  for (const day of recentStats) {
    for (const [fag, count] of Object.entries(day.faggrupper || {})) {
      faggruppe7d[fag] = (faggruppe7d[fag] || 0) + (count as number);
    }
  }
  const totalEmployee7d = sevenDayTotals.employee;

  // ── Eksisterende checks ──────────────────────────────────────────────────
  const checks: Array<{ label: string; ok: boolean; detail?: string }> = [
    {
      label: "Anthropic API (Council + Sarah AI)",
      ok: anthropicTest.ok,
      detail: anthropicTest.detail,
    },
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

  // ── LeadBot v2 helbreds-checks ───────────────────────────────────────────
  const leadbotChecks: Array<{ label: string; ok: boolean; warning?: boolean; detail?: string }> = [
    {
      label: "Anthropic API nøgle (Brain + AI-noter)",
      ok: !!process.env.ANTHROPIC_API_KEY,
      detail: process.env.ANTHROPIC_API_KEY
        ? "Konfigureret — Brain Layer + AI-noter virker"
        : "MANGLER — Brain falder tilbage til default-plan, AI-noter bliver fallback-bullets",
    },
    {
      label: "Upstash Redis (storage)",
      ok: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
      detail:
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
          ? "Konfigureret — daily-stats og feedback gemmes"
          : "MANGLER — LeadBot kan ikke gemme tilstand",
    },
    {
      label: "CVR API (cvr.ts + cvr-enkeltmands.ts)",
      ok: process.env.CVRAPI_ENABLED === "true",
      warning: process.env.CVRAPI_ENABLED !== "true",
      detail:
        process.env.CVRAPI_ENABLED === "true"
          ? "CVRAPI_ENABLED=true — CVR-baserede kilder kører"
          : "CVRAPI_ENABLED ikke sat — cvr.ts og cvr-enkeltmands.ts skipper (Vercel-IP blokeret). Sæt CVRAPI_ENABLED=true når abonnement er på plads.",
    },
    {
      label: "Google Places API",
      ok: !!process.env.GOOGLE_PLACES_API_KEY,
      detail: process.env.GOOGLE_PLACES_API_KEY
        ? "Konfigureret — geo-søgning kører"
        : "MANGLER — Google Places er primær firma-kilde, vigtig at have sat",
    },
    {
      label: "OIS/BBR (Datafordeler)",
      ok: !!process.env.DATAFORDELER_USER && !!process.env.DATAFORDELER_PASS,
      warning: !process.env.DATAFORDELER_USER || !process.env.DATAFORDELER_PASS,
      detail:
        process.env.DATAFORDELER_USER && process.env.DATAFORDELER_PASS
          ? "Konfigureret — byggetilladelses-leads (private) kører"
          : "Mangler — private-kategori henter kun fra Boligsiden/Tinglysning",
    },
    {
      label: "Cron secret (beskytter cron-routes)",
      ok: !!process.env.CRON_SECRET,
      detail: process.env.CRON_SECRET
        ? "CRON_SECRET sat — kun Vercel Cron kan kalde /api/cron/*"
        : "MANGLER — cron-routes er åbne for alle (sæt CRON_SECRET)",
    },
  ];

  const headerCard = (label: string, value: string | number, sub?: string) => (
    <div className="bg-gray border border-[rgba(242,238,230,0.07)] p-5 rounded-[2px]">
      <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-1">
        {label}
      </p>
      <p className="text-[36px] font-condensed font-black text-yellow leading-none">
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted mt-2">{sub}</p>}
    </div>
  );

  return (
    <main className="min-h-screen bg-black py-16 px-6">
      <div className="max-w-[1100px] mx-auto">
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
              Systemstatus, testdata, selvtest af formularer og analytics.
              LeadBot v2 diagnostik vises nederst.
            </p>
          </div>
          <Link
            href="/"
            className="text-[12px] font-condensed uppercase tracking-[.15em] text-muted hover:text-yellow transition-colors"
          >
            ← Forsiden
          </Link>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-4 mb-10 max-[700px]:grid-cols-1">
          {headerCard("Medarbejdere i DB", employees.length)}
          {headerCard("Vagter i DB", shifts.length)}
          {headerCard("Sidevisninger i alt", views.length)}
          {headerCard("Besøg denne uge", agg.weekCount)}
        </div>

        {/* Health checks (eksisterende) */}
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
                  <p className="text-[14px] text-cream font-semibold">{c.label}</p>
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

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* LEADBOT V2 SECTION                                                 */}
        {/* ────────────────────────────────────────────────────────────────── */}

        <div className="border-t border-[rgba(242,238,230,0.07)] mt-16 pt-12">
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-3">
            <h2 className="font-condensed font-black text-[32px] uppercase tracking-[-.01em] text-cream leading-none">
              LeadBot <span className="text-yellow">v2</span>
            </h2>
            <span className="text-[11px] font-condensed uppercase tracking-[.18em] text-muted">
              Brain · Filters · Gap-Filler · Feedback
            </span>
          </div>
          <p className="text-[13px] text-muted max-w-[640px] mb-8">
            Intelligent 20/20/20 engine. Brain beslutter dagens prioritet, scrapers henter,
            gap-filler retry&apos;er hvis vi rammer under målet, og ugentlig feedback-analyse
            justerer parametre.
          </p>

          {/* Top KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-10 max-[700px]:grid-cols-2">
            {headerCard(
              "Leads i DB",
              leadStats.total,
              `${leadStats.withEmail} med email · ${leadStats.withPhone} med tlf`,
            )}
            {headerCard(
              "Sendt sidste 7 dage",
              leadStats.sentLast7Days,
              `${leadStats.emailOpened} åbnet`,
            )}
            {headerCard(
              "Brain plan",
              feedback ? "Med feedback" : "Default",
              feedback
                ? `Sidst opdateret ${new Date(feedback.analyzedAt).toLocaleDateString("da-DK")}`
                : "Ingen feedback-data endnu",
            )}
            {headerCard(
              "Faggrupper aktive",
              Object.keys(faggruppe7d).length,
              `${KRITISKE_FAGGRUPPER.join(", ")} = kritiske`,
            )}
          </div>

          {/* LeadBot helbreds-checks */}
          <section className="mb-10">
            <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
              System helbred
            </h3>
            <ul className="flex flex-col gap-2">
              {leadbotChecks.map((c) => (
                <li
                  key={c.label}
                  className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-4 flex items-start gap-4"
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[14px] ${
                      c.ok
                        ? "bg-yellow text-black"
                        : c.warning
                        ? "bg-yellow/20 text-yellow border border-yellow/40"
                        : "bg-red-500/20 text-red-400 border border-red-400/40"
                    }`}
                    aria-label={c.ok ? "OK" : c.warning ? "Advarsel" : "Fejl"}
                  >
                    {c.ok ? "✓" : c.warning ? "⚠" : "!"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-cream font-semibold">{c.label}</p>
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

          {/* 7-dages trend */}
          <section className="mb-10">
            <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
              7-dages aktivitet (per dag)
            </h3>
            <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] overflow-hidden">
              {recentStats.length === 0 ? (
                <p className="text-[13px] text-muted p-5">
                  Ingen daily-stats endnu. Første kørsel skriver til{" "}
                  <code className="text-yellow font-mono">leadbot:daily-stats:YYYY-MM-DD</code>.
                </p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[rgba(242,238,230,0.07)] text-muted">
                      <th className="text-left px-5 py-3 font-condensed uppercase tracking-[.12em] text-[11px]">Dato</th>
                      <th className="text-right px-3 py-3 font-condensed uppercase tracking-[.12em] text-[11px]">🏢 Virk.</th>
                      <th className="text-right px-3 py-3 font-condensed uppercase tracking-[.12em] text-[11px]">🏠 Priv.</th>
                      <th className="text-right px-3 py-3 font-condensed uppercase tracking-[.12em] text-[11px]">👷 Medarb.</th>
                      <th className="text-right px-5 py-3 font-condensed uppercase tracking-[.12em] text-[11px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStats.map((d) => {
                      const total = d.company + d.private + d.employee;
                      const onTarget = total >= 60;
                      return (
                        <tr key={d.date} className="border-b border-[rgba(242,238,230,0.04)] last:border-b-0">
                          <td className="px-5 py-3 text-cream font-mono">{d.date}</td>
                          <td className="text-right px-3 py-3 text-cream">{d.company}</td>
                          <td className="text-right px-3 py-3 text-cream">{d.private}</td>
                          <td className="text-right px-3 py-3 text-cream">{d.employee}</td>
                          <td className={`text-right px-5 py-3 font-bold ${onTarget ? "text-yellow" : "text-muted"}`}>
                            {total} {onTarget ? "✓" : ""}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-black/40">
                      <td className="px-5 py-3 text-muted font-condensed uppercase tracking-[.1em] text-[11px]">
                        7-dages sum
                      </td>
                      <td className="text-right px-3 py-3 text-yellow font-bold">{sevenDayTotals.company}</td>
                      <td className="text-right px-3 py-3 text-yellow font-bold">{sevenDayTotals.private}</td>
                      <td className="text-right px-3 py-3 text-yellow font-bold">{sevenDayTotals.employee}</td>
                      <td className="text-right px-5 py-3 text-yellow font-bold">
                        {sevenDayTotals.company + sevenDayTotals.private + sevenDayTotals.employee}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Faggrupper */}
          <section className="mb-10">
            <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
              Faggruppe-fordeling (7 dage)
            </h3>
            <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
              <div className="grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
                {ALL_FAGGRUPPER.map((fag) => {
                  const count = faggruppe7d[fag] || 0;
                  const target = Math.ceil(20 / 9) * 7; // ~15 per faggruppe over 7 dage
                  const pct = Math.min(100, (count / target) * 100);
                  const isCritical = KRITISKE_FAGGRUPPER.includes(fag);
                  const cfg = FAGGRUPPE_CONFIG[fag];
                  return (
                    <div
                      key={fag}
                      className="bg-black/40 border border-[rgba(242,238,230,0.05)] rounded-[2px] p-3"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <p className="font-condensed font-bold text-[13px] uppercase tracking-[.05em] text-cream">
                          {fag} {isCritical && <span className="text-yellow text-[10px] ml-1">★ KRITISK</span>}
                        </p>
                        <p className="font-condensed font-black text-[18px] text-yellow leading-none">{count}</p>
                      </div>
                      <div className="h-[3px] bg-[rgba(242,238,230,0.08)] rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-yellow transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted font-mono">
                        CVR: {cfg.cvr.join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>
              {totalEmployee7d === 0 && (
                <p className="text-[12px] text-muted mt-4 italic">
                  Ingen medarbejder-leads registreret endnu. Kør LeadBot for at indsamle data.
                </p>
              )}
            </div>
          </section>

          {/* Feedback insights */}
          {feedback ? (
            <section className="mb-10">
              <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
                Ugentlig feedback (Brain læser dette næste morgen)
              </h3>
              <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
                <div className="grid grid-cols-3 gap-4 mb-5 max-[700px]:grid-cols-1">
                  <div>
                    <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-1">Periode</p>
                    <p className="text-[14px] text-cream font-mono">{feedback.periodFrom} → {feedback.periodTo}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-1">Sendt</p>
                    <p className="text-[22px] font-condensed font-black text-yellow leading-none">{feedback.totalSent}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-1">Open-rate</p>
                    <p className="text-[22px] font-condensed font-black text-yellow leading-none">
                      {(feedback.openRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-2">Insights</p>
                <p className="text-[14px] text-cream mb-5 leading-[1.7]">{feedback.insights}</p>

                {feedback.suggestedAdjustments && Object.keys(feedback.suggestedAdjustments).length > 0 && (
                  <>
                    <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-2">
                      Foreslåede justeringer
                    </p>
                    <pre className="text-[12px] text-yellow font-mono bg-black/40 p-3 rounded-[2px] overflow-x-auto">
                      {JSON.stringify(feedback.suggestedAdjustments, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            </section>
          ) : (
            <section className="mb-10">
              <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
                Ugentlig feedback
              </h3>
              <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5 text-[13px] text-muted">
                Endnu ingen feedback-analyse kørt. Cron kører hver mandag 05:00 (
                <code className="text-yellow font-mono">/api/cron/leadbot-feedback</code>
                ). Brain bruger heuristisk fallback indtil da.
              </div>
            </section>
          )}

          {/* Lead DB tilstand */}
          <section className="mb-10">
            <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
              Lead DB tilstand
            </h3>
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
              <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
                <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-3">
                  Per type
                </p>
                <ul className="space-y-2 text-[13px]">
                  <li className="flex justify-between">
                    <span className="text-cream">🏢 Virksomheder</span>
                    <span className="font-condensed font-bold text-yellow">{leadStats.byType.company}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-cream">🏠 Private</span>
                    <span className="font-condensed font-bold text-yellow">{leadStats.byType.private}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-cream">👷 Medarbejdere</span>
                    <span className="font-condensed font-bold text-yellow">{leadStats.byType.employee}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
                <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-muted mb-3">
                  Per status
                </p>
                <ul className="space-y-2 text-[13px]">
                  {Object.entries(leadStats.byStatus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <li key={status} className="flex justify-between">
                        <span className="text-cream">{status}</span>
                        <span className="font-condensed font-bold text-yellow">{count}</span>
                      </li>
                    ))}
                  {Object.keys(leadStats.byStatus).length === 0 && (
                    <li className="text-muted italic">Ingen leads endnu</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Score-tærskler & konfig */}
          <section className="mb-10">
            <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
              Aktuelle filter-defaults
            </h3>
            <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
              <div className="grid grid-cols-3 gap-5 max-[700px]:grid-cols-1">
                <div>
                  <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-yellow mb-3">
                    🏢 Virksomheder
                  </p>
                  <ul className="space-y-1 text-[12px] font-mono">
                    <li className="text-cream">Score ≥ <span className="text-yellow">{DEFAULT_FILTERS.virksomheder.scoreGrænse}</span></li>
                    <li className="text-cream">Ansatte: {DEFAULT_FILTERS.virksomheder.antalAnsatteMin}–{DEFAULT_FILTERS.virksomheder.antalAnsatteMax}</li>
                    <li className="text-cream">Postnr-zoner: {DEFAULT_FILTERS.virksomheder.postnrZoner.length}</li>
                    <li className="text-cream">Branchekoder: {DEFAULT_FILTERS.virksomheder.branchekoder.length}</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-yellow mb-3">
                    🏠 Private
                  </p>
                  <ul className="space-y-1 text-[12px] font-mono">
                    <li className="text-cream">Score ≥ <span className="text-yellow">{DEFAULT_FILTERS.private.scoreGrænse}</span></li>
                    <li className="text-cream">Signal: {DEFAULT_FILTERS.private.signalTyper.length} typer</li>
                    <li className="text-cream">Postnr-zoner: {DEFAULT_FILTERS.private.postnrZoner.length}</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-condensed uppercase tracking-[.15em] text-yellow mb-3">
                    👷 Medarbejdere
                  </p>
                  <ul className="space-y-1 text-[12px] font-mono">
                    <li className="text-cream">Score ≥ <span className="text-yellow">{DEFAULT_FILTERS.medarbejdere.scoreGrænse}</span></li>
                    <li className="text-cream">Mål/dag: {DEFAULT_FILTERS.medarbejdere.dagligtMål}</li>
                    <li className="text-cream">Geo: {DEFAULT_FILTERS.medarbejdere.geografiRadius}</li>
                    <li className="text-cream">Erfaring ≥ {DEFAULT_FILTERS.medarbejdere.erfaringMinimumAar} år</li>
                  </ul>
                </div>
              </div>
              <p className="text-[11px] text-muted mt-5 italic">
                Brain Layer kan justere disse runtime — værdier ovenfor er defaults der nulstilles ved hver kørsel.
              </p>
            </div>
          </section>

          {/* Cron schedule */}
          <section className="mb-10">
            <h3 className="font-condensed font-extrabold text-[18px] uppercase tracking-[.04em] text-cream mb-5">
              Vercel Cron-schedule
            </h3>
            <div className="bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] p-5">
              <ul className="space-y-2 text-[13px] font-mono">
                <li className="text-cream">
                  <span className="text-yellow">Mandag 05:00</span> · /api/cron/leadbot-feedback (ugentlig analyse)
                </li>
                <li className="text-cream">
                  <span className="text-yellow">Dagligt 06:00</span> · /api/cron/morning-report
                </li>
                <li className="text-cream">
                  <span className="text-yellow">Dagligt 07:00</span> · /api/cron/find-leads (Brain + 13 scrapers + gap-fill)
                </li>
                <li className="text-cream">
                  <span className="text-yellow">Dagligt 11:00</span> · /api/cron/auto-outreach
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* RESTERENDE EKSISTERENDE SEKTIONER                                  */}
        {/* ────────────────────────────────────────────────────────────────── */}

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
                    <p className="flex-1 text-[13px] text-cream truncate font-mono">{path}</p>
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
              <span className="text-yellow font-bold">1. Medarbejder-login:</span> Gå til{" "}
              <Link href="/medarbejder/login" className="text-yellow underline">/medarbejder/login</Link>{" "}
              og log ind med telefon <span className="font-mono text-yellow">11111111</span> og kode{" "}
              <span className="font-mono text-yellow">{testEmployee?.confirmationCode ?? "865801"}</span>.
            </p>
            <p className="mb-3">
              <span className="text-yellow font-bold">2. Se test-vagt:</span> Efter login kan medarbejderen se testvagten{" "}
              <span className="italic">&ldquo;{testShift?.title ?? "—"}&rdquo;</span> og tilmelde sig.
            </p>
            <p className="mb-3">
              <span className="text-yellow font-bold">3. Admin-login:</span> Gå til{" "}
              <Link href="/admin/login" className="text-yellow underline">/admin/login</Link>{" "}
              med admin-credentials. Dashboard viser besøgsstatistik, medarbejdere og vagter.
            </p>
            <p className="mb-3">
              <span className="text-yellow font-bold">4. Kontakt-formular:</span> Udfyld og send formularen på forsiden.
              {process.env.RESEND_API_KEY
                ? " Mail sendes til kontakt@krydsbyg.com."
                : " (RESEND_API_KEY ikke sat — formularen gemmer data men sender ikke mail endnu.)"}
            </p>
            <p>
              <span className="text-yellow font-bold">5. LeadBot manuel kørsel:</span> Log ind som admin og POST til{" "}
              <code className="text-yellow font-mono text-[12px]">/api/admin/run-leadbot</code>.
              Brain beslutter prioritet, 13 scrapers henter, gap-filler retry&apos;er.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
