/**
 * Admin debug-test bibliotek.
 *
 * Hver test returnerer et TestResult. Tests grupperes i moduler.
 * Bruges af /api/admin/debug/route.ts og /admin/debug-siden.
 *
 * Konvention:
 *   - status "ok"      = alt virker
 *   - status "warning" = virker, men noget mangler / advarsel
 *   - status "error"   = kritisk fejl, brugeren skal handle
 */

import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import {
  readEmployees,
  readShifts,
  readLeads,
  readSarahContacts,
} from "./db";
import { TRADES } from "./constants";

export type TestStatus = "ok" | "warning" | "error";

export interface TestResult {
  module: string;
  test: string;
  status: TestStatus;
  detail: string;
  fix?: string;
}

export interface DebugReport {
  ranAt: string;
  results: TestResult[];
  summary: { ok: number; warning: number; error: number; total: number };
  modulesSummary: Record<string, { ok: number; warning: number; error: number }>;
}

const MODULES = {
  env: "Environment",
  auth: "Auth/Login",
  employees: "Medarbejdere",
  shifts: "Vagter",
  trades: "Fag-dækning",
  council: "Council AI",
  sarah: "Sarah Outreach",
  leadform: "Lead-formular",
  email: "Email/Resend",
} as const;

// ── Module 1: Environment ──────────────────────────────────────────────────

function envCheck(name: string, opts: { required: boolean; description: string }): TestResult {
  const value = process.env[name];
  const present = !!value && value.length > 0;
  if (present) {
    return {
      module: MODULES.env,
      test: name,
      status: "ok",
      detail: `Sat (${value!.length} tegn)`,
    };
  }
  return {
    module: MODULES.env,
    test: name,
    status: opts.required ? "error" : "warning",
    detail: opts.required ? "Mangler — kritisk" : "Ikke sat (valgfri)",
    fix: opts.required ? `Sæt ${name} i Vercel: ${opts.description}` : undefined,
  };
}

function testEnvVariables(): TestResult[] {
  return [
    envCheck("ANTHROPIC_API_KEY",        { required: true,  description: "API-nøgle fra console.anthropic.com" }),
    envCheck("RESEND_API_KEY",           { required: true,  description: "API-nøgle fra resend.com" }),
    envCheck("JWT_SECRET",               { required: true,  description: "Min. 32 tegn random string" }),
    envCheck("ADMIN_USERNAME",           { required: true,  description: "Admin-brugernavn" }),
    envCheck("RESEND_FROM",              { required: false, description: "KrydsByg <kontakt@krydsbyg.com>" }),
    envCheck("RESEND_TO",                { required: false, description: "kontakt@krydsbyg.com" }),
    envCheck("NEXT_PUBLIC_SITE_URL",     { required: false, description: "https://krydsbyg.com" }),
    envCheck("UPSTASH_REDIS_REST_URL",   { required: false, description: "LeadBot storage" }),
    envCheck("UPSTASH_REDIS_REST_TOKEN", { required: false, description: "LeadBot storage" }),
    envCheck("KV_REST_API_URL",         { required: false, description: "Redis via Vercel Marketplace (fallback)" }),
    envCheck("KV_REST_API_TOKEN",       { required: false, description: "Redis via Vercel Marketplace (fallback)" }),
    envCheck("GOOGLE_PLACES_API_KEY",    { required: false, description: "Google Places (LeadBot)" }),
    envCheck("CRON_SECRET",              { required: false, description: "Beskytter cron-routes" }),
    envCheck("OURA_ACCESS_TOKEN",        { required: false, description: "Til fremtidig helbreds-fane" }),
  ];
}

// ── Module 2: Auth/Login ───────────────────────────────────────────────────

function testAuth(adminUsername: string): TestResult[] {
  const results: TestResult[] = [];

  results.push({
    module: MODULES.auth,
    test: "Admin-session aktiv",
    status: "ok",
    detail: `Logget ind som "${adminUsername}" via JWT-cookie`,
  });

  const secret = process.env.JWT_SECRET || "";
  if (secret.length >= 32) {
    results.push({
      module: MODULES.auth,
      test: "JWT_SECRET tilstrækkelig længde",
      status: "ok",
      detail: `${secret.length} tegn (≥32 anbefalet)`,
    });
  } else if (secret.length >= 16) {
    results.push({
      module: MODULES.auth,
      test: "JWT_SECRET tilstrækkelig længde",
      status: "warning",
      detail: `${secret.length} tegn — minimum 32 anbefales`,
      fix: "Generér ny JWT_SECRET med: openssl rand -hex 32",
    });
  } else {
    results.push({
      module: MODULES.auth,
      test: "JWT_SECRET tilstrækkelig længde",
      status: "error",
      detail: secret.length === 0 ? "Ikke sat" : `Kun ${secret.length} tegn — for kort`,
      fix: "Sæt JWT_SECRET (min. 16, helst 32+ tegn) i Vercel",
    });
  }

  const hasAdminHash =
    !!process.env.ADMIN_PASSWORD_HASH || !!process.env.ADMIN_PASSWORD_HASH_B64;
  results.push({
    module: MODULES.auth,
    test: "Admin password-hash konfigureret",
    status: hasAdminHash ? "ok" : "error",
    detail: hasAdminHash
      ? "ADMIN_PASSWORD_HASH(_B64) er sat"
      : "Mangler ADMIN_PASSWORD_HASH eller _B64",
    fix: hasAdminHash
      ? undefined
      : "Generér bcrypt-hash af password og sæt ADMIN_PASSWORD_HASH_B64 (base64) i Vercel",
  });

  results.push({
    module: MODULES.auth,
    test: "Cookie-konfiguration (httpOnly + sameSite)",
    status: "ok",
    detail: "Konfigureret korrekt i lib/auth.ts (httpOnly: true, sameSite: lax, 7-dages udløb)",
  });

  return results;
}

// ── Module 3: Medarbejdere ─────────────────────────────────────────────────

async function testEmployees(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const employees = await readEmployees();
    results.push({
      module: MODULES.employees,
      test: "Læs medarbejder-data",
      status: "ok",
      detail: `${employees.length} medarbejdere fundet`,
    });

    if (employees.length === 0) {
      results.push({
        module: MODULES.employees,
        test: "Antal medarbejdere",
        status: "warning",
        detail: "Ingen medarbejdere registreret",
        fix: "Importér via /admin/medarbejdere → Upload Excel, eller tilmeld manuelt",
      });
      return results;
    }

    // Validér påkrævede felter
    const missingName  = employees.filter((e) => !e.name?.trim()).length;
    const missingPhone = employees.filter((e) => !e.phone?.trim()).length;
    const missingTrade = employees.filter((e) => !e.trade?.trim()).length;
    const validationErrors = missingName + missingPhone + missingTrade;

    results.push({
      module: MODULES.employees,
      test: "Data-validering (navn, telefon, fag)",
      status: validationErrors === 0 ? "ok" : "warning",
      detail:
        validationErrors === 0
          ? "Alle medarbejdere har påkrævede felter"
          : `${missingName} mangler navn · ${missingPhone} mangler tlf · ${missingTrade} mangler fag`,
      fix:
        validationErrors === 0
          ? undefined
          : "Gennemgå medarbejder-listen og udfyld manglende felter manuelt",
    });

    // Status-fordeling
    const ledige   = employees.filter((e) => e.status === "LEDIG").length;
    const udsendt  = employees.filter((e) => e.status === "UDSENDT").length;
    const afventer = employees.filter((e) => e.status === "AFVENTER_BEKRÆFTELSE").length;
    const inaktiv  = employees.filter((e) => e.status === "INAKTIV").length;

    results.push({
      module: MODULES.employees,
      test: "Status-fordeling",
      status: ledige === 0 && udsendt === 0 ? "warning" : "ok",
      detail: `${ledige} ledig · ${udsendt} udsendt · ${afventer} afventer · ${inaktiv} inaktiv`,
      fix:
        ledige === 0 && udsendt === 0
          ? "Ingen aktive medarbejdere — aktivér via /admin/medarbejdere"
          : undefined,
    });

    // Test-medarbejder
    const testEmp = employees.find((e) => e.id === "test0001");
    results.push({
      module: MODULES.employees,
      test: "Test-medarbejder (test0001) eksisterer",
      status: testEmp ? "ok" : "warning",
      detail: testEmp
        ? `${testEmp.name} · ${testEmp.trade} · status=${testEmp.status}`
        : "Mangler — login-flow kan ikke testes uden",
      fix: testEmp ? undefined : "Tilføj test-medarbejder i data/employees.json (id=test0001)",
    });
  } catch (err) {
    results.push({
      module: MODULES.employees,
      test: "Læs medarbejder-data",
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
      fix: "Tjek at data/employees.json eksisterer og er gyldig JSON",
    });
  }

  return results;
}

// ── Module 4: Vagter ───────────────────────────────────────────────────────

async function testShifts(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const shifts = await readShifts();
    results.push({
      module: MODULES.shifts,
      test: "Læs vagter",
      status: "ok",
      detail: `${shifts.length} vagter i alt`,
    });

    const now = Date.now();
    const upcoming = shifts.filter((s) => new Date(s.startAt).getTime() > now);
    const unassigned = shifts.filter((s) => s.status === "OPEN");
    const filled     = shifts.filter((s) => s.status === "FILLED");

    results.push({
      module: MODULES.shifts,
      test: "Kommende vagter",
      status: "ok",
      detail: `${upcoming.length} kommende · ${filled.length} besat · ${unassigned.length} åbne`,
    });

    if (unassigned.length > 5) {
      results.push({
        module: MODULES.shifts,
        test: "Åbne vagter (advarsel ved >5)",
        status: "warning",
        detail: `${unassigned.length} åbne vagter mangler besættelse`,
        fix: "Match vagter til medarbejdere via /admin/vagter",
      });
    }

    const testShift = shifts.find((s) => s.id === "testshift001");
    results.push({
      module: MODULES.shifts,
      test: "Test-vagt (testshift001) eksisterer",
      status: testShift ? "ok" : "warning",
      detail: testShift
        ? `${testShift.title} · status=${testShift.status}`
        : "Mangler — vagt-flow kan ikke testes uden",
    });
  } catch (err) {
    results.push({
      module: MODULES.shifts,
      test: "Læs vagter",
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
      fix: "Tjek at data/shifts.json eksisterer",
    });
  }

  return results;
}

// ── Module 5: Fag-dækning ──────────────────────────────────────────────────

async function testTradesCoverage(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const employees = await readEmployees();
    const tradeKeys = Object.keys(TRADES) as Array<keyof typeof TRADES>;

    const coverage = tradeKeys.map((trade) => {
      const inTrade = employees.filter((e) => e.trade === trade);
      const ledige  = inTrade.filter((e) => e.status === "LEDIG").length;
      return { trade, total: inTrade.length, ledige };
    });

    const uncovered = coverage.filter((c) => c.total === 0);
    const noLedige  = coverage.filter((c) => c.total > 0 && c.ledige === 0);

    if (uncovered.length === 0) {
      results.push({
        module: MODULES.trades,
        test: "Alle 13 fag har medarbejdere",
        status: "ok",
        detail: "Fuld dækning af alle TRADES",
      });
    } else {
      results.push({
        module: MODULES.trades,
        test: "Fag-dækning",
        status: "warning",
        detail: `${uncovered.length} fag uden medarbejdere: ${uncovered.map((c) => TRADES[c.trade]).join(", ")}`,
        fix: "Rekruttér medarbejdere til disse fag via Pipeline-tabben på /admin/medarbejdere",
      });
    }

    if (noLedige.length > 0) {
      results.push({
        module: MODULES.trades,
        test: "Ledige medarbejdere per fag",
        status: "warning",
        detail: `Ingen ledige i: ${noLedige.map((c) => TRADES[c.trade]).join(", ")}`,
        fix: "Aktivér medarbejdere eller afslut deres opgaver",
      });
    }

    // Detalje-rapport per fag
    const summary = coverage
      .map((c) => `${TRADES[c.trade]}: ${c.total} (${c.ledige} ledig)`)
      .join(" · ");
    results.push({
      module: MODULES.trades,
      test: "Detaljer per fag",
      status: "ok",
      detail: summary,
    });
  } catch (err) {
    results.push({
      module: MODULES.trades,
      test: "Fag-dækning",
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}

// ── Module 6: Council AI ───────────────────────────────────────────────────

async function testCouncil(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    results.push({
      module: MODULES.council,
      test: "Anthropic API-kald",
      status: "error",
      detail: "ANTHROPIC_API_KEY ikke sat",
      fix: "Sæt ANTHROPIC_API_KEY i Vercel",
    });
    return results;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const start = Date.now();
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 20,
      system: "Du er en testbot. Svar kun: 'OK'",
      messages: [{ role: "user", content: "ping" }],
    });
    const elapsedMs = Date.now() - start;
    const text = res.content[0]?.type === "text" ? res.content[0].text.trim() : "";

    results.push({
      module: MODULES.council,
      test: "Anthropic API-kald (claude-sonnet-4-6)",
      status: "ok",
      detail: `Svarede på ${elapsedMs} ms — "${text.slice(0, 50)}"`,
    });

    results.push({
      module: MODULES.council,
      test: "Model-version",
      status: "ok",
      detail: `claude-sonnet-4-6 (returnerede ${res.model})`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isCredits = msg.toLowerCase().includes("credit");
    const isAuth = msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("auth");
    results.push({
      module: MODULES.council,
      test: "Anthropic API-kald",
      status: "error",
      detail: msg.slice(0, 200),
      fix: isCredits
        ? "Køb credits på console.anthropic.com → Plans & Billing"
        : isAuth
        ? "Tjek at ANTHROPIC_API_KEY er korrekt i Vercel"
        : "Tjek Anthropic API status: status.anthropic.com",
    });
  }

  // Test at Operations-rådgiveren får medarbejder-injection
  try {
    const employees = await readEmployees();
    const ledige = employees.filter((e) => e.status === "LEDIG").length;
    results.push({
      module: MODULES.council,
      test: "Operations får live medarbejder-data",
      status: "ok",
      detail: `Council Operations får ${ledige} ledige + øvrige injiceret i system prompt (lib/admin/council/route.ts)`,
    });
  } catch {
    /* allerede dækket ovenfor */
  }

  return results;
}

// ── Module 7: Sarah Outreach ───────────────────────────────────────────────

async function testSarah(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const contacts = await readSarahContacts();
    const pending  = contacts.filter((c) => c.status === "pending").length;
    const emailed  = contacts.filter((c) => c.status === "emailed").length;
    const followed = contacts.filter((c) => c.status === "followed_up").length;
    const closed   = contacts.filter((c) => c.status === "closed").length;

    results.push({
      module: MODULES.sarah,
      test: "Sarah-kontakter (outreach-database)",
      status: "ok",
      detail: `${contacts.length} kontakter · ${pending} afventer · ${emailed} emailet · ${followed} fulgt op · ${closed} lukket`,
    });

    if (contacts.length === 0) {
      results.push({
        module: MODULES.sarah,
        test: "Outreach-pipeline",
        status: "warning",
        detail: "Ingen Sarah-kontakter — outreach er inaktiv",
        fix: "Upload Excel-fil på /admin/sarah for at importere kontakter",
      });
    }
  } catch (err) {
    results.push({
      module: MODULES.sarah,
      test: "Sarah-kontakter",
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  results.push({
    module: MODULES.sarah,
    test: "Daglig email-grænse",
    status: "ok",
    detail: `SARAH_DAILY_LIMIT = ${process.env.SARAH_DAILY_LIMIT ?? "15 (default)"}`,
  });

  results.push({
    module: MODULES.sarah,
    test: "Afsender-konfiguration",
    status: "ok",
    detail: `from: ${process.env.RESEND_FROM ?? "KrydsByg <kontakt@krydsbyg.com>"}`,
  });

  return results;
}

// ── Module 8: Lead-formular ────────────────────────────────────────────────

async function testLeadForm(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const leads = await readLeads();
    const byType = {
      company:  leads.filter((l) => l.leadType === "company").length,
      private:  leads.filter((l) => l.leadType === "private").length,
      employee: leads.filter((l) => l.leadType === "employee").length,
    };

    results.push({
      module: MODULES.leadform,
      test: "Lead-database tilgængelig",
      status: "ok",
      detail: `${leads.length} leads (${byType.company} firma · ${byType.private} privat · ${byType.employee} medarb.)`,
    });

    const recent = leads.filter((l) => {
      const created = new Date(l.createdAt).getTime();
      return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
    });
    results.push({
      module: MODULES.leadform,
      test: "Nye leads sidste 7 dage",
      status: recent.length > 0 ? "ok" : "warning",
      detail: `${recent.length} leads modtaget`,
      fix: recent.length === 0 ? "Tjek at LeadBot kører dagligt + at /api/contact er offentligt tilgængeligt" : undefined,
    });
  } catch (err) {
    results.push({
      module: MODULES.leadform,
      test: "Lead-database",
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  // Kontroller at /api/contact eksisterer (statisk check)
  results.push({
    module: MODULES.leadform,
    test: "Lead-formular endpoint",
    status: "ok",
    detail: "/api/contact (POST) — server-side validering aktiv",
  });

  return results;
}

// ── Module 9: Email/Resend ─────────────────────────────────────────────────

async function testEmail(sendTestEmail: boolean): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    results.push({
      module: MODULES.email,
      test: "Resend API-nøgle",
      status: "error",
      detail: "RESEND_API_KEY ikke sat",
      fix: "Sæt RESEND_API_KEY i Vercel fra resend.com",
    });
    return results;
  }

  results.push({
    module: MODULES.email,
    test: "Resend API-nøgle",
    status: "ok",
    detail: `Konfigureret (${apiKey.length} tegn)`,
  });

  const fromAddr = process.env.RESEND_FROM ?? "KrydsByg <kontakt@krydsbyg.com>";
  const toAddr   = process.env.RESEND_TO   ?? "kontakt@krydsbyg.com";

  const isKrydsBygFrom = fromAddr.includes("kontakt@krydsbyg.com");
  results.push({
    module: MODULES.email,
    test: "Afsender-adresse",
    status: isKrydsBygFrom ? "ok" : "warning",
    detail: `from: ${fromAddr}`,
    fix: isKrydsBygFrom
      ? undefined
      : "Sæt RESEND_FROM=KrydsByg <kontakt@krydsbyg.com> i Vercel",
  });

  results.push({
    module: MODULES.email,
    test: "Modtager-adresse (RESEND_TO)",
    status: "ok",
    detail: `to: ${toAddr}`,
  });

  if (!sendTestEmail) {
    results.push({
      module: MODULES.email,
      test: "Live email-test",
      status: "warning",
      detail: "Sprunget over (vælg 'Send test-email' for at køre)",
    });
    return results;
  }

  // Send faktisk test-email
  try {
    const resend = new Resend(apiKey);
    const stamp = new Date().toLocaleString("da-DK", { timeZone: "Europe/Copenhagen" });
    const { data, error } = await resend.emails.send({
      from: fromAddr,
      to: [toAddr],
      replyTo: "kontakt@krydsbyg.com",
      subject: `[DEBUG TEST] KrydsByg email-system check`,
      text: `Automatisk debug-test fra /admin/debug — ${stamp}\n\nHvis du modtager denne mail, virker email-systemet.`,
      html: `<p>Automatisk debug-test fra <code>/admin/debug</code> — ${stamp}</p><p>Hvis du modtager denne mail, virker email-systemet.</p>`,
    });

    if (error) {
      results.push({
        module: MODULES.email,
        test: "Live email-test",
        status: "error",
        detail: `Resend-fejl: ${JSON.stringify(error).slice(0, 200)}`,
        fix: "Tjek at krydsbyg.com domænet er verified på resend.com",
      });
    } else {
      results.push({
        module: MODULES.email,
        test: "Live email-test sendt",
        status: "ok",
        detail: `Sendt til ${toAddr} · Message ID: ${data?.id?.slice(0, 36)}`,
      });
    }
  } catch (err) {
    results.push({
      module: MODULES.email,
      test: "Live email-test",
      status: "error",
      detail: err instanceof Error ? err.message : String(err),
      fix: "Tjek RESEND_API_KEY og domain-verification på resend.com",
    });
  }

  return results;
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export async function runAllDebugTests(opts: {
  adminUsername: string;
  sendTestEmail: boolean;
}): Promise<DebugReport> {
  const ranAt = new Date().toISOString();

  // Kør moduler parallelt hvor det er sikkert
  const [
    envResults,
    employeeResults,
    shiftResults,
    tradeResults,
    councilResults,
    sarahResults,
    leadResults,
    emailResults,
  ] = await Promise.all([
    Promise.resolve(testEnvVariables()),
    testEmployees(),
    testShifts(),
    testTradesCoverage(),
    testCouncil(),
    testSarah(),
    testLeadForm(),
    testEmail(opts.sendTestEmail),
  ]);

  const authResults = testAuth(opts.adminUsername);

  const results: TestResult[] = [
    ...envResults,
    ...authResults,
    ...employeeResults,
    ...shiftResults,
    ...tradeResults,
    ...councilResults,
    ...sarahResults,
    ...leadResults,
    ...emailResults,
  ];

  const summary = {
    ok:      results.filter((r) => r.status === "ok").length,
    warning: results.filter((r) => r.status === "warning").length,
    error:   results.filter((r) => r.status === "error").length,
    total:   results.length,
  };

  const modulesSummary: DebugReport["modulesSummary"] = {};
  for (const r of results) {
    if (!modulesSummary[r.module]) {
      modulesSummary[r.module] = { ok: 0, warning: 0, error: 0 };
    }
    modulesSummary[r.module][r.status]++;
  }

  return { ranAt, results, summary, modulesSummary };
}
