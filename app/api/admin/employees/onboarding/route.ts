/**
 * Onboarding-mail til medarbejdere — Sarah skriver, du bekræfter.
 *
 * POST   { employeeId, regenerate? } → genererer udkast (status: AFVENTER_BEKRÆFTELSE)
 * PATCH  { employeeId, action }      → "approve" | "send" | "edit" | "reject"
 * PUT    { bulk: true }              → genererer udkast for ALLE Afventer-medarbejdere
 *
 * Auto-send sker ALDRIG — admin trykker manuelt "Send".
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readEmployees, writeEmployees } from "@/lib/db";
import { buildEmailHtml, buildEmailText } from "@/lib/email-builder";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { TRADES } from "@/lib/constants";
import type { Employee } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ONBOARDING_SYSTEM = `Du er Sarah Møller, rekrutterings-assistent hos KrydsByg.

Du skriver KORTE, venlige onboarding-mails til håndværkere/medarbejdere der er blevet importeret i vores system. Målet er at få dem til at gå til krydsbyg.com/tilmeld og fuldføre deres profil + acceptere kontrakten.

KrydsByg er et bemandingsbureau i Storkøbenhavn der leverer rengøring, flytning, maling, montering, have/anlæg, mindre håndværk, byggepladsbehjælp, events og sammensatte hold.

Hvad vi tilbyder medarbejdere:
- Fleksible vagter — du vælger selv hvad du tager
- Aftalt timeløn (overenskomstniveau)
- Hurtig afregning (8 dage efter vagt)
- Faste kunder, varierede opgaver
- Ingen binding — fri til at sige nej

OBLIGATORISK STRUKTUR:
1. "Hej [fornavn]," (eller "Hej," hvis fornavn ikke kan udledes)
2. Tom linje
3. Body (3-5 linjer):
   - Nævn at vi har dem i systemet som [deres fag]
   - Forklar kort hvad KrydsByg tilbyder
   - Inviter til at gå til krydsbyg.com/tilmeld for at fuldføre profilen
   - Skriv at det tager 2 minutter
4. Tom linje
5. CTA: "Hvis du har spørgsmål så ring til Krystian på +45 42 77 88 66"
6. Tom linje
7. "Med venlig hilsen,"
   (Systemet tilføjer signaturen automatisk)

REGLER:
- Tone: venlig kollega, ikke sælger
- Lyd menneskelig — ikke robotagtig
- ALDRIG bindestreger som sætningskobling
- ALDRIG: "Hi", "Hello", "Kære", klicheer
- Lov IKKE specifik løn eller specifikt antal vagter
- Hold mailen UNDER 120 ord total

RETURNER KUN JSON (intet før/efter):
{"subject":"<emne max 60 tegn>","body":"<body med Hej øverst og 'Med venlig hilsen,' nederst, linjeskift som \\n>"}`;

async function generateOnboardingDraft(employee: Employee): Promise<{ subject: string; body: string }> {
  const firstName = employee.name.split(" ")[0];
  const tradeName = TRADES[employee.trade as keyof typeof TRADES] || employee.trade;
  const skillsBlurb = employee.skills.length > 0 ? `Færdigheder: ${employee.skills.slice(0, 3).join(", ")}` : "";
  const experienceBlurb = employee.experience ? `Erfaring: ${employee.experience.slice(0, 150)}` : "";

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    system: ONBOARDING_SYSTEM,
    messages: [{
      role: "user",
      content: `Skriv en onboarding-mail. Returner KUN JSON.

MEDARBEJDER:
Fornavn: ${firstName}
Fulde navn: ${employee.name}
Fag: ${tradeName}
${skillsBlurb}
${experienceBlurb}
By/område: ${employee.notes?.match(/By: ([^\n]+)/)?.[1] || "Storkøbenhavn"}

Mailen skal:
- Henvende sig til ${firstName} med fornavn
- Nævne deres fag (${tradeName}) konkret
- Forklare hvad KrydsByg er
- Invitere til krydsbyg.com/tilmeld
- Inkludere telefon +45 42 77 88 66
- Slutte med "Med venlig hilsen,"`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  let result: Record<string, string>;
  try {
    result = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Sarah returnerede intet JSON. Svar: ${text.slice(0, 200)}`);
    result = JSON.parse(match[0]);
  }

  return { subject: result.subject, body: result.body };
}

// ── POST: generér udkast for én medarbejder ──────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { employeeId, regenerate } = await req.json();
    if (!employeeId) return NextResponse.json({ error: "employeeId påkrævet" }, { status: 400 });

    const employees = await readEmployees();
    const idx = employees.findIndex((e) => e.id === employeeId);
    if (idx === -1) return NextResponse.json({ error: "Medarbejder ikke fundet" }, { status: 404 });

    const employee = employees[idx];
    if (!employee.email) return NextResponse.json({ error: "Medarbejder mangler email" }, { status: 400 });
    if (employee.onboardingDraftBody && !regenerate) {
      return NextResponse.json({ error: "Udkast eksisterer allerede — brug regenerate: true" }, { status: 400 });
    }

    const draft = await generateOnboardingDraft(employee);

    const now = new Date().toISOString();
    employees[idx] = {
      ...employee,
      onboardingDraftSubject: draft.subject,
      onboardingDraftBody: draft.body,
      onboardingDraftCreatedAt: now,
      updatedAt: now,
    };
    await writeEmployees(employees);

    return NextResponse.json({ ok: true, subject: draft.subject, body: draft.body });
  } catch (err) {
    console.error("[employees/onboarding POST]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── PATCH: approve / send / edit / reject ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { employeeId, action, editedSubject, editedBody } = await req.json();
    const employees = await readEmployees();
    const idx = employees.findIndex((e) => e.id === employeeId);
    if (idx === -1) return NextResponse.json({ error: "Medarbejder ikke fundet" }, { status: 404 });

    const employee = employees[idx];
    const now = new Date().toISOString();

    if (action === "edit") {
      employees[idx] = {
        ...employee,
        onboardingDraftSubject: editedSubject ?? employee.onboardingDraftSubject,
        onboardingDraftBody: editedBody ?? employee.onboardingDraftBody,
        updatedAt: now,
      };
      await writeEmployees(employees);
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      employees[idx] = { ...employee, onboardingApprovedAt: now, updatedAt: now };
      await writeEmployees(employees);
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      employees[idx] = {
        ...employee,
        onboardingDraftSubject: undefined,
        onboardingDraftBody: undefined,
        onboardingDraftCreatedAt: undefined,
        onboardingApprovedAt: undefined,
        updatedAt: now,
      };
      await writeEmployees(employees);
      return NextResponse.json({ ok: true });
    }

    if (action === "send") {
      if (!employee.email) return NextResponse.json({ error: "Email mangler" }, { status: 400 });
      if (!employee.onboardingDraftSubject || !employee.onboardingDraftBody) {
        return NextResponse.json({ error: "Intet udkast at sende" }, { status: 400 });
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM ?? "KrydsByg <kontakt@krydsbyg.com>";
      const html = buildEmailHtml({ body: employee.onboardingDraftBody, preheader: employee.onboardingDraftSubject });
      const text = buildEmailText(employee.onboardingDraftBody);

      try {
        await resend.emails.send({
          from,
          to: [employee.email],
          bcc: ["kontakt@krydsbyg.com"],
          replyTo: "kontakt@krydsbyg.com",
          subject: employee.onboardingDraftSubject,
          html,
          text,
          headers: {
            "List-Unsubscribe": "<mailto:kontakt@krydsbyg.com?subject=afmeld>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "X-Mailer": "KrydsByg Onboarding",
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: `Email-afsendelse fejlede: ${msg}` }, { status: 500 });
      }

      employees[idx] = { ...employee, onboardingSentAt: now, updatedAt: now };
      await writeEmployees(employees);
      return NextResponse.json({ ok: true, sent: true });
    }

    return NextResponse.json({ error: "Ukendt action" }, { status: 400 });
  } catch (err) {
    console.error("[employees/onboarding PATCH]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── PUT: bulk-generér udkast for alle Afventer-medarbejdere ─────────────
export async function PUT(_req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const employees = await readEmployees();

    // Find medarbejdere der har email, ikke har udkast endnu, og afventer bekræftelse
    const toDraft = employees.filter((e) =>
      e.email &&
      !e.onboardingDraftBody &&
      (e.status === "AFVENTER_BEKRÆFTELSE" || !e.acceptedTerms)
    ).slice(0, 15); // Max 15 pr. kald (~60 sekunder)

    if (toDraft.length === 0) {
      return NextResponse.json({ ok: true, generated: 0, message: "Ingen medarbejdere mangler udkast" });
    }

    let generated = 0;
    const errors: string[] = [];

    for (const emp of toDraft) {
      try {
        const draft = await generateOnboardingDraft(emp);
        const idx = employees.findIndex((e) => e.id === emp.id);
        if (idx !== -1) {
          const now = new Date().toISOString();
          employees[idx] = {
            ...employees[idx],
            onboardingDraftSubject: draft.subject,
            onboardingDraftBody: draft.body,
            onboardingDraftCreatedAt: now,
            updatedAt: now,
          };
          generated++;
        }
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        errors.push(`${emp.name}: ${err instanceof Error ? err.message.slice(0, 50) : "fejl"}`);
      }
    }

    if (generated > 0) await writeEmployees(employees);
    return NextResponse.json({ ok: true, generated, errors });
  } catch (err) {
    console.error("[employees/onboarding PUT]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}