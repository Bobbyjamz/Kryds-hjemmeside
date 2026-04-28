import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readLeads, writeLeads, generateId } from "@/lib/db";
import type { Lead, ExcelColumnMapping } from "@/lib/types";

export const runtime = "nodejs";

async function isAdmin() {
  return (await cookies()).get("kryds-admin")?.value === "authenticated";
}

function detectColumn(headers: string[], ...candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim().replace(/\s+/g, ""));
  for (const candidate of candidates) {
    const idx = lower.indexOf(candidate.toLowerCase().replace(/\s+/g, ""));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

function autoMapColumns(headers: string[]): ExcelColumnMapping {
  return {
    companyName: detectColumn(headers, "Virksomhed", "Firma", "Company", "Firmanavn", "Virksomhedsnavn"),
    contactName: detectColumn(headers, "Kontaktperson", "Navn", "Kontakt", "Name", "Contact"),
    email: detectColumn(headers, "Email", "Mail", "E-mail", "Emailadresse"),
    phone: detectColumn(headers, "Telefon", "Tlf", "Phone", "Mobil", "Tel"),
    industry: detectColumn(headers, "Branche", "Industry", "Sektor", "Type"),
    city: detectColumn(headers, "By", "City", "Postnummer", "Postby"),
    website: detectColumn(headers, "Website", "Hjemmeside", "Web", "URL", "Link"),
    notes: detectColumn(headers, "Noter", "Notes", "Bemærkning", "Kommentar"),
    serviceType: detectColumn(headers, "Service", "Ydelse", "Relevant service", "ServiceType"),
    personalAngle: detectColumn(headers, "Personlig vinkel", "Vinkel", "Angle", "Tilgang"),
  };
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mappingStr = formData.get("mapping") as string | null;

    if (!file) return NextResponse.json({ error: "Ingen fil valgt" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, string>[];

    if (rows.length === 0) {
      return NextResponse.json({ error: "Excel filen er tom" }, { status: 400 });
    }

    const headers = Object.keys(rows[0]);
    const autoMapping = autoMapColumns(headers);

    const mapping: ExcelColumnMapping = mappingStr
      ? { ...autoMapping, ...JSON.parse(mappingStr) }
      : autoMapping;

    if (!mapping.email && !mapping.companyName) {
      return NextResponse.json({
        error: "Kunne ikke finde email eller virksomhedsnavn kolonne",
        headers,
        autoMapping,
        requiresManualMapping: true,
      }, { status: 400 });
    }

    // Return preview for confirmation before actual import
    if (!mappingStr) {
      const preview = rows.slice(0, 5).map((row) => ({
        companyName: mapping.companyName ? row[mapping.companyName] : "",
        contactName: mapping.contactName ? row[mapping.contactName] : "",
        email: mapping.email ? row[mapping.email] : "",
        phone: mapping.phone ? row[mapping.phone] : "",
        industry: mapping.industry ? row[mapping.industry] : "",
      }));
      return NextResponse.json({
        ok: false,
        requiresConfirmation: true,
        headers,
        autoMapping,
        preview,
        totalRows: rows.length,
        fileName: file.name,
      });
    }

    const existingLeads = await readLeads();
    const existingEmails = new Set(existingLeads.map((l) => l.email.toLowerCase()));

    const newLeads: Lead[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      const email = mapping.email ? (row[mapping.email] || "").toString().trim().toLowerCase() : "";
      const companyName = mapping.companyName ? (row[mapping.companyName] || "").toString().trim() : "";

      if (!email || !email.includes("@")) {
        if (companyName) errors.push(`${companyName}: ugyldig email`);
        continue;
      }
      if (existingEmails.has(email)) {
        skipped.push(email);
        continue;
      }

      const now = new Date().toISOString();
      const lead: Lead = {
        id: generateId(),
        companyName: companyName || email.split("@")[1],
        contactName: mapping.contactName ? row[mapping.contactName]?.toString().trim() || undefined : undefined,
        email,
        phone: mapping.phone ? row[mapping.phone]?.toString().trim() || undefined : undefined,
        industry: mapping.industry ? row[mapping.industry]?.toString().trim() || undefined : undefined,
        city: mapping.city ? row[mapping.city]?.toString().trim() || undefined : undefined,
        website: mapping.website ? row[mapping.website]?.toString().trim() || undefined : undefined,
        notes: mapping.notes ? row[mapping.notes]?.toString().trim() || undefined : undefined,
        serviceType: mapping.serviceType ? row[mapping.serviceType]?.toString().trim() || undefined : undefined,
        personalAngle: mapping.personalAngle ? row[mapping.personalAngle]?.toString().trim() || undefined : undefined,
        status: "New",
        sourceFile: file.name,
        createdAt: now,
        updatedAt: now,
      };

      newLeads.push(lead);
      existingEmails.add(email);
    }

    await writeLeads([...existingLeads, ...newLeads]);
    return NextResponse.json({ ok: true, imported: newLeads.length, skipped: skipped.length, errors, total: existingLeads.length + newLeads.length });
  } catch (err) {
    console.error("[leads/upload]", err);
    return NextResponse.json({ error: "Kunne ikke parse filen" }, { status: 500 });
  }
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await readLeads();
  return NextResponse.json({ leads, total: leads.length });
}
