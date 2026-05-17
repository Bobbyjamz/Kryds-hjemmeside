import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminSession } from "@/lib/auth";
import { readCustomers, readEmployees } from "@/lib/db";
import type { Customer, Employee } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type EmailType = "first_contact" | "followup" | "job_offer" | "welcome";

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  first_contact: "første kontaktemail",
  followup: "opfølgningsemail efter ingen svar",
  job_offer: "jobmulighed til medarbejder",
  welcome: "velkomstemail til ny medarbejder/kunde",
};

const KRYDSBYG_KONTEKST = `KrydsByg ApS — dansk bemandingsbureau i København. Leverer faglærte og handymen til byggeprojekter: tømrer, murer, stillads, nedrivning, VVS, el, maler, jord og anlæg. Grundlægger: Krystian Balasz. krydsbyg.com`;

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY ikke sat" }, { status: 503 });
  }

  const { contactId, contactType, emailType } = await req.json() as {
    contactId: string;
    contactType: "customer" | "employee";
    emailType: EmailType;
  };

  if (!contactId || !contactType || !emailType) {
    return NextResponse.json({ error: "Mangler contactId, contactType eller emailType" }, { status: 400 });
  }

  let contact: Customer | Employee | null = null;
  if (contactType === "customer") {
    const customers = await readCustomers();
    contact = customers.find((c) => c.id === contactId) ?? null;
  } else {
    const employees = await readEmployees();
    contact = employees.find((e) => e.id === contactId) ?? null;
  }

  if (!contact) return NextResponse.json({ error: "Kontakt ikke fundet" }, { status: 404 });

  // Build context lines about the contact
  const ctx: string[] = [];
  if (contactType === "customer") {
    const c = contact as Customer;
    ctx.push(`Type: ${c.type === "virksomhed" ? "Virksomhed" : "Privat kunde"}`);
    if (c.company) ctx.push(`Firma: ${c.company}`);
    ctx.push(`Kontakt: ${c.name}`);
    if (c.trade) ctx.push(`Faginteresse: ${c.trade}`);
    if (c.cvr) ctx.push(`CVR: ${c.cvr}`);
  } else {
    const e = contact as Employee;
    ctx.push(`Medarbejder: ${e.name}`);
    ctx.push(`Fag: ${e.trade}`);
    if (e.desiredTrades?.length) ctx.push(`Ønskede fag: ${e.desiredTrades.join(", ")}`);
    if (e.employmentType) ctx.push(`Ønsker: ${e.employmentType}`);
    if (e.certifications?.length) ctx.push(`Certifikater: ${e.certifications.join(", ")}`);
  }
  const contextStr = ctx.join("\n");
  const emailTypeLabel = EMAIL_TYPE_LABELS[emailType] || emailType;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Step 1: Council strategy advice
  const councilMsg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    system: `Du er Council for ${KRYDSBYG_KONTEKST}\nGiv kort strategisk rådgivning om en ${emailTypeLabel} email. Ton, vinkel, hvad resonerer. Max 80 ord. Dansk.`,
    messages: [{ role: "user", content: `Kontakt:\n${contextStr}\n\nHvad er den bedste tilgang?` }],
  });
  const councilAdvice = councilMsg.content[0]?.type === "text" ? councilMsg.content[0].text : "";

  // Step 2: Sarah writes the email
  const emailMsg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: `Du er Sarah — outreach-assistent for Krystian Balasz hos KrydsByg ApS.\n${KRYDSBYG_KONTEKST}\n\nStruktur:\n1. Personlig hilsen med fornavn\n2. Én sætning om DERES situation\n3. Kort hvad KrydsByg kan gøre\n4. Tydelig call-to-action\n5. "/ Sarah for Krystian · KrydsByg ApS · +45 42 77 88 66 · krydsbyg.com"\n\nDansk. Max 6 linjer. Ingen emne-linje.`,
    messages: [{ role: "user", content: `Skriv en ${emailTypeLabel} til:\n${contextStr}\n\nCouncil's råd: ${councilAdvice}` }],
  });
  const generatedEmail = emailMsg.content[0]?.type === "text" ? emailMsg.content[0].text : "";

  // Step 3: Council quality check
  const approvalMsg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    system: `Du er Council quality control for KrydsByg.\nGodkend emailen med "✓ GODKENDT" eller giv én konkret forbedring med "⚠ FORBEDR: [ændring]". Max 50 ord.`,
    messages: [{ role: "user", content: `Godkend email til ${contactType === "customer" ? "kunde" : "medarbejder"}:\n\n${generatedEmail}` }],
  });
  const approval = approvalMsg.content[0]?.type === "text" ? approvalMsg.content[0].text : "";

  return NextResponse.json({
    ok: true,
    councilAdvice,
    generatedEmail,
    approval,
    approved: approval.includes("✓ GODKENDT"),
    contact,
  });
}
