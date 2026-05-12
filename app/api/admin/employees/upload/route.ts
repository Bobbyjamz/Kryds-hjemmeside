/**
 * Bulk-upload af medarbejdere fra Excel/CSV.
 *
 * Samme to-trins flow som leads-upload:
 *   1. POST uden mapping → returnerer preview + auto-mapping til bekræftelse
 *   2. POST med mapping → faktisk import
 *
 * Importerede medarbejdere får status="AFVENTER_BEKRÆFTELSE" indtil de
 * accepterer kontrakten via /tilmeld (eller du markerer dem som LEDIG manuelt).
 */

import { NextRequest, NextResponse } from "next/server";
import { readEmployees, writeEmployees, generateId } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { Employee } from "@/lib/types";

export const runtime = "nodejs";

interface EmployeeColumnMapping {
  name?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  trade?: string;
  skills?: string;
  experience?: string;
  notes?: string;
  city?: string;
}

function detectColumn(headers: string[], ...candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim().replace(/\s+/g, ""));
  for (const candidate of candidates) {
    const idx = lower.indexOf(candidate.toLowerCase().replace(/\s+/g, ""));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

function autoMapColumns(headers: string[]): EmployeeColumnMapping {
  return {
    name:       detectColumn(headers, "Navn", "Name", "Fulde navn", "Medarbejder", "Medarbejdernavn", "Fornavn"),
    phone:      detectColumn(headers, "Telefon", "Tlf", "Phone", "Mobil", "Tel", "Tlf.nr"),
    email:      detectColumn(headers, "Email", "Mail", "E-mail", "Emailadresse"),
    birthDate:  detectColumn(headers, "Fødselsdato", "Fødsel", "BirthDate", "DOB", "Birthday", "F-dato"),
    trade:      detectColumn(headers, "Fag", "Trade", "Erhverv", "Profession", "Stilling"),
    skills:     detectColumn(headers, "Færdigheder", "Skills", "Kompetencer", "Kvalifikationer"),
    experience: detectColumn(headers, "Erfaring", "Experience", "År erfaring", "Erfaring år"),
    notes:      detectColumn(headers, "Noter", "Notes", "Bemærkning", "Kommentar"),
    city:       detectColumn(headers, "By", "City", "Postby", "Område", "Bopæl"),
  };
}

/** Fri tekst → TRADES enum-key (matcher det første kendte fag) */
function mapTrade(value: string | undefined): string {
  const v = (value || "").toLowerCase().trim();
  if (!v) return "HANDYMAN";
  if (v.includes("tømrer") || v.includes("snedker")) return "TOMRER";
  if (v.includes("murer")) return "MURER";
  if (v.includes("maler")) return "MALER";
  if (v.includes("elektri")) return "ELEKTRIKER";
  if (v.includes("vvs") || v.includes("blikkenslager")) return "VVS";
  if (v.includes("struktør")) return "STRUKTOR";
  if (v.includes("nedriv")) return "NEDRIVER";
  if (v.includes("montør") || v.includes("monter")) return "MONTOR";
  if (v.includes("have") || v.includes("gart") || v.includes("anlæg")) return "HAVEMAND";
  if (v.includes("rengør") || v.includes("rens")) return "RENGORING";
  if (v.includes("chauf") || v.includes("kørs")) return "CHAUFFOR";
  if (v.includes("byggehj") || v.includes("hjælp")) return "BYGGEHJAELPER";
  return "HANDYMAN";
}

/** Excel-dato (serial number) → YYYY-MM-DD string */
function parseExcelDate(value: string | undefined): string {
  if (!value) return "1980-01-01"; // Default hvis ingen fødselsdato
  const v = String(value).trim();

  // Allerede ISO-format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);

  // DD/MM/YYYY eller DD-MM-YYYY
  const dmy = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const yyyy = y.length === 2 ? `19${y}` : y;
    return `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Excel serial number (days since 1900-01-01)
  if (/^\d+$/.test(v)) {
    const excelEpoch = new Date(1899, 11, 30).getTime();
    const date = new Date(excelEpoch + parseInt(v, 10) * 86400000);
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  return "1980-01-01";
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mappingStr = formData.get("mapping") as string | null;

    if (!file) return NextResponse.json({ error: "Ingen fil valgt" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const SKIP_NAMES = ["overblik", "tips", "guide", "instruks", "regler", "forside", "vejledning"];
    const dataSheetName =
      workbook.SheetNames.find((n) => !SKIP_NAMES.some((s) => n.toLowerCase().includes(s))) ??
      workbook.SheetNames[0];

    const sheet = workbook.Sheets[dataSheetName];
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];

    // Find header-rækken (kan være række 1-5 hvis der er banner-tekst øverst)
    const HEADER_HINTS = ["navn", "name", "telefon", "phone", "tlf", "email", "fag", "trade", "fornavn"];
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(6, aoa.length); i++) {
      const rowLower = (aoa[i] || []).map((c) => String(c ?? "").toLowerCase().trim());
      const hits = rowLower.filter((c) => HEADER_HINTS.some((h) => c === h || c.startsWith(h)));
      if (hits.length >= 2) { headerRowIdx = i; break; }
    }

    const headers = (aoa[headerRowIdx] || []).map((c) => String(c ?? "").trim());
    const rows: Record<string, string>[] = [];
    for (let i = headerRowIdx + 1; i < aoa.length; i++) {
      const row = aoa[i] || [];
      const obj: Record<string, string> = {};
      let hasAny = false;
      for (let j = 0; j < headers.length; j++) {
        if (!headers[j]) continue;
        const v = String(row[j] ?? "").trim();
        obj[headers[j]] = v;
        if (v) hasAny = true;
      }
      if (hasAny) rows.push(obj);
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: `Excel filen er tom (sheet: ${dataSheetName})` }, { status: 400 });
    }

    const autoMapping = autoMapColumns(headers);
    const mapping: EmployeeColumnMapping = mappingStr
      ? { ...autoMapping, ...JSON.parse(mappingStr) }
      : autoMapping;

    if (!mapping.name || !mapping.phone) {
      return NextResponse.json({
        error: "Navn og telefon er påkrævet — kunne ikke finde disse kolonner",
        headers,
        autoMapping,
        requiresManualMapping: true,
      }, { status: 400 });
    }

    // ── Preview-trin: returnér de første 5 rækker så admin kan bekræfte ──
    if (!mappingStr) {
      const preview = rows.slice(0, 5).map((row) => ({
        name: mapping.name ? row[mapping.name] : "",
        phone: mapping.phone ? row[mapping.phone] : "",
        email: mapping.email ? row[mapping.email] : "",
        trade: mapping.trade ? row[mapping.trade] : "",
        city: mapping.city ? row[mapping.city] : "",
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

    // ── Faktisk import ──────────────────────────────────────────────────
    const existing = await readEmployees();
    const existingPhones = new Set(existing.map((e) => e.phone.replace(/\s/g, "")));

    const newEmployees: Employee[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      const name = mapping.name ? (row[mapping.name] || "").toString().trim() : "";
      const phone = mapping.phone ? (row[mapping.phone] || "").toString().trim() : "";

      if (!name || !phone) {
        if (name || phone) errors.push(`${name || phone}: mangler navn eller telefon`);
        continue;
      }

      const phoneClean = phone.replace(/\s/g, "");
      if (phoneClean.length < 8) {
        errors.push(`${name}: ugyldigt telefonnummer`);
        continue;
      }
      if (existingPhones.has(phoneClean)) {
        skipped.push(name);
        continue;
      }

      const skillsRaw = mapping.skills ? (row[mapping.skills] || "").toString().trim() : "";
      const skills = skillsRaw
        ? skillsRaw.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean).slice(0, 10)
        : [];

      const cityNote = mapping.city ? row[mapping.city]?.toString().trim() : "";
      const userNote = mapping.notes ? row[mapping.notes]?.toString().trim() : "";

      const now = new Date().toISOString();
      const employee: Employee = {
        id: generateId(),
        name,
        phone,
        email: mapping.email ? row[mapping.email]?.toString().trim() || undefined : undefined,
        birthDate: parseExcelDate(mapping.birthDate ? row[mapping.birthDate] : undefined),
        trade: mapTrade(mapping.trade ? row[mapping.trade] : undefined),
        skills,
        experience: mapping.experience ? row[mapping.experience]?.toString().trim() || undefined : undefined,
        notes: [
          userNote,
          cityNote ? `By: ${cityNote}` : "",
          `Importeret fra: ${file.name}`,
          "⚠ Mangler kontrakt-godkendelse — send /tilmeld link",
        ].filter(Boolean).join("\n"),
        references: [],
        status: "AFVENTER_BEKRÆFTELSE",
        employeeType: "MEDARBEJDER",
        acceptedTerms: false,
        createdAt: now,
        updatedAt: now,
      };

      newEmployees.push(employee);
      existingPhones.add(phoneClean);
    }

    await writeEmployees([...existing, ...newEmployees]);
    return NextResponse.json({
      ok: true,
      imported: newEmployees.length,
      skipped: skipped.length,
      errors,
      total: existing.length + newEmployees.length,
    });
  } catch (err) {
    console.error("[employees/upload]", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Upload fejl: ${detail}` }, { status: 500 });
  }
}
