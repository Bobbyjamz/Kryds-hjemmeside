import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readSarahContacts, writeSarahContacts, readCustomers, writeCustomers, generateId } from "@/lib/db";
import type { SarahContact, Customer } from "@/lib/types";

export const runtime = "nodejs";

/** Find the row containing actual column headers (skip banner/title rows).
 *  Matches both old format (header on row 3) and new format (header on row 1). */
function findHeaderRow(aoa: unknown[][]): number {
  const HEADER_HINTS = [
    "navn", "kontaktperson", "e-mail", "email", "name", "stilling",
    "fornavn", "efternavn", "fag", "virksomhed", "telefon", "status",
  ];
  for (let i = 0; i < Math.min(10, aoa.length); i++) {
    const row = aoa[i] || [];
    const lowered = row.map((c) => String(c ?? "").toLowerCase().trim());
    const matches = lowered.filter((c) => HEADER_HINTS.some((h) => c === h || c.startsWith(h)));
    if (matches.length >= 2) return i;
  }
  return 0;
}

/** Map Mail-skabelon column value → contact type. */
function mapTemplateToType(tpl: string): "medarbejder" | "partner" | "privat" | null {
  const t = tpl.toLowerCase().trim();
  if (t === "virksomhed" || t === "partner") return "partner";
  if (t === "privat" || t === "privatperson") return "privat";
  if (t === "medarbejder" || t === "medarbejdere") return "medarbejder";
  return null;
}

/** Combine Fornavn + Efternavn or fall back to single Navn/Kontaktperson field. */
function pickFullName(row: Record<string, string>): string {
  const fornavn = pickRaw(row, "Fornavn");
  const efternavn = pickRaw(row, "Efternavn");
  if (fornavn || efternavn) return `${fornavn} ${efternavn}`.trim();
  return pickRaw(row, "Kontaktperson", "Navn", "Name");
}

/** Like pick() but doesn't apply lowercase. */
function pickRaw(row: Record<string, string>, ...candidates: string[]): string {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const wanted = cand.toLowerCase();
    const hit = keys.find((k) => k.toLowerCase() === wanted || k.toLowerCase().startsWith(wanted));
    if (hit && row[hit]) return row[hit];
  }
  return "";
}

/** Convert AOA to row objects with normalized header keys. */
function rowsWithHeaders(aoa: unknown[][], headerIdx: number): Record<string, string>[] {
  const headers = (aoa[headerIdx] || []).map((c) => String(c ?? "").trim());
  const result: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const row = aoa[i] || [];
    const obj: Record<string, string> = {};
    let hasAny = false;
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j];
      if (!h) continue;
      const v = String(row[j] ?? "").trim();
      obj[h] = v;
      if (v) hasAny = true;
    }
    if (hasAny) result.push(obj);
  }
  return result;
}


export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Ingen fil modtaget" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const existingSarah = await readSarahContacts();
    const existingEmails = new Set(existingSarah.map((c) => c.email.toLowerCase()));
    const newContacts: SarahContact[] = [];

    const existingCustomers = await readCustomers();
    const customerEmails = new Set(existingCustomers.map((c) => (c.email || "").toLowerCase()).filter(Boolean));
    const customerPhones = new Set(existingCustomers.map((c) => (c.phone || "").replace(/\D/g, "").slice(-8)).filter(Boolean));
    const newCustomers: Customer[] = [];

    let skipped = 0;
    let skippedCustomers = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
      if (aoa.length < 2) continue;
      const headerIdx = findHeaderRow(aoa);
      const rows = rowsWithHeaders(aoa, headerIdx);
      const lowerName = sheetName.toLowerCase();

      // Skip overview / instruction sheets
      if (
        lowerName.includes("overblik") ||
        lowerName.includes("tips") ||
        lowerName.includes("guide") ||
        lowerName.includes("instruks") ||
        lowerName.includes("regler")
      ) {
        continue;
      }

      // ── Bestem default-type ud fra sheet-navn ────────────────────────────
      // Ny struktur: "Virksomheder" / "Private kunder – Leads" / "Medarbejdere – Skabelon"
      // Gammel struktur: "kunde", "partner", "customer", "virksomhed", "private"
      let defaultType: "medarbejder" | "partner" | "privat" = "medarbejder";
      const isCustomerSheet =
        lowerName.includes("kunde") ||
        lowerName.includes("customer") ||
        lowerName.includes("virksomhed") ||
        lowerName.includes("partner") ||
        lowerName.includes("private") ||
        lowerName.includes("privat");

      if (isCustomerSheet) {
        defaultType = lowerName.includes("private") || lowerName.includes("privat") ? "privat" : "partner";
      }

      for (const row of rows) {
        // Pr.-række "Mail-skabelon"-kolonne overruler sheet-navn hvis sat
        const tplOverride = mapTemplateToType(pickRaw(row, "Mail-skabelon", "Skabelon"));
        const contactType = tplOverride ?? defaultType;

        const name = pickFullName(row);
        const email = pickRaw(row, "E-mail (arbejde)", "E-mail (udfyld)", "E-mail", "Email", "EMAIL").toLowerCase();
        const phoneRaw = pickRaw(row, "Telefon (udfyld)", "Telefon", "Phone");
        const phone = phoneRaw.replace(/\D/g, "").slice(-8);
        const company = pickRaw(row, "Virksomhed / Stilling", "Virksomhed", "Firma", "Company");
        const trade = pickRaw(
          row,
          "Fag",
          "Stilling / Speciale",
          "Stilling",
          "Projekttype",
          "Trade",
          "Titel",
          "Branche",
        );
        // Personal note — ny struktur "Personlig note", gammel "Sarahs noter ..."
        const notes = pickRaw(
          row,
          "Personlig note",
          "Sarahs noter – skriv en personlig besked",
          "Sarahs noter til personlig besked",
          "Sarahs noter",
          "Noter",
          "Note",
        );
        const adresse = pickRaw(row, "Adresse / område", "Adresse", "By / område", "By");
        const opgave = pickRaw(row, "Opgave", "Aktuelle opgave", "Projekt-vinkel");

        if (!name) continue;

        // ── Customer-record (kunder, ikke medarbejdere) ────────────────────
        if (contactType === "partner" || contactType === "privat") {
          // Skip duplikater på email/telefon
          if (email && customerEmails.has(email)) { skippedCustomers++; continue; }
          if (phone && customerPhones.has(phone)) { skippedCustomers++; continue; }

          const customer: Customer = {
            id: generateId(),
            type: contactType === "privat" ? "privat" : "virksomhed",
            name,
            company: company || undefined,
            email: email || undefined,
            phone: phoneRaw || undefined,
            cvr: pickRaw(row, "CVR") || undefined,
            trade: trade || undefined,
            notes: [notes, opgave, adresse].filter(Boolean).join(" · ") || undefined,
            status: "lead",
            createdAt: new Date().toISOString(),
            source: "excel_import",
          };

          if (email) customerEmails.add(email);
          if (phone) customerPhones.add(phone);
          newCustomers.push(customer);

          // Også lav en Sarah-outreach kontakt så hun kan emaile dem direkte
          if (email && email.includes("@") && !existingEmails.has(email)) {
            existingEmails.add(email);
            newContacts.push({
              id: generateId(),
              name,
              email,
              company: company || "",
              trade: trade || "",
              type: contactType,
              status: "pending",
              notes: notes || undefined,
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          // ── Medarbejder-outreach (kun Sarah-kontakt, ingen Customer) ─────
          if (!email || !email.includes("@")) continue;
          if (existingEmails.has(email)) { skipped++; continue; }

          existingEmails.add(email);
          newContacts.push({
            id: generateId(),
            name,
            email,
            company: company || "",
            trade: trade || "",
            type: "medarbejder",
            status: "pending",
            notes: notes || undefined,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    await writeSarahContacts([...existingSarah, ...newContacts]);
    await writeCustomers([...existingCustomers, ...newCustomers]);

    return NextResponse.json({
      ok: true,
      imported: newContacts.length,
      skipped,
      customersImported: newCustomers.length,
      customersSkipped: skippedCustomers,
    });
  } catch (err) {
    console.error("Sarah upload fejl:", err);
    return NextResponse.json({ error: "Kunne ikke parse Excel-fil" }, { status: 500 });
  }
}
