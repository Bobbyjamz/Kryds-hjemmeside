import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readSarahContacts, writeSarahContacts, readCustomers, writeCustomers, generateId } from "@/lib/db";
import type { SarahContact, Customer } from "@/lib/types";

export const runtime = "nodejs";

/** Find the row containing actual column headers (skip banner/title rows). */
function findHeaderRow(aoa: unknown[][]): number {
  const HEADER_HINTS = ["navn", "kontaktperson", "e-mail", "email", "name", "stilling"];
  for (let i = 0; i < Math.min(10, aoa.length); i++) {
    const row = aoa[i] || [];
    const lowered = row.map((c) => String(c ?? "").toLowerCase().trim());
    const matches = lowered.filter((c) => HEADER_HINTS.some((h) => c === h || c.startsWith(h)));
    if (matches.length >= 2) return i;
  }
  return 0;
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

/** Get first non-empty value from a list of possible header keys (case-insensitive, partial match). */
function pick(row: Record<string, string>, ...candidates: string[]): string {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const wanted = cand.toLowerCase();
    const hit = keys.find((k) => k.toLowerCase() === wanted || k.toLowerCase().startsWith(wanted));
    if (hit && row[hit]) return row[hit];
  }
  return "";
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
      if (lowerName.includes("overblik") || lowerName.includes("tips") || lowerName.includes("guide")) {
        continue;
      }

      // Customer sheets: kunde, partner, customer, virksomhed, private
      const isCustomerSheet =
        lowerName.includes("kunde") ||
        lowerName.includes("customer") ||
        lowerName.includes("virksomhed") ||
        lowerName.includes("partner") ||
        lowerName.includes("private");

      if (isCustomerSheet) {
        for (const row of rows) {
          const name = pick(row, "Kontaktperson", "Navn", "Name");
          const email = pick(row, "E-mail (arbejde)", "E-mail", "Email", "EMAIL").toLowerCase();
          const phoneRaw = pick(row, "Telefon", "Phone");
          const phone = phoneRaw.replace(/\D/g, "").slice(-8);
          const company = pick(row, "Virksomhed / Stilling", "Virksomhed", "Firma", "Company");
          const trade = pick(row, "Projekttype", "Stilling / Speciale", "Fag", "Trade");
          const notes = pick(row, "Sarahs noter – skriv en personlig besked", "Sarahs noter", "Sarahs noter til personlig besked", "Noter");

          if (!name) continue;
          if (email && customerEmails.has(email)) { skippedCustomers++; continue; }
          if (phone && customerPhones.has(phone)) { skippedCustomers++; continue; }

          const customer: Customer = {
            id: generateId(),
            type: lowerName.includes("private") || lowerName.includes("privat") ? "privat" : "virksomhed",
            name,
            company: company || undefined,
            email: email || undefined,
            phone: phoneRaw || undefined,
            cvr: pick(row, "CVR") || undefined,
            trade: trade || undefined,
            notes: notes || undefined,
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
              type: "partner",
              status: "pending",
              notes: notes || undefined,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        // Sarah outreach contacts (medarbejder)
        const type: "medarbejder" | "partner" = lowerName.includes("partner") ? "partner" : "medarbejder";

        for (const row of rows) {
          const email = pick(row, "E-mail (arbejde)", "E-mail", "Email", "EMAIL").toLowerCase();
          const name = pick(row, "Navn", "Kontaktperson", "Name");
          const company = pick(row, "Virksomhed / Stilling", "Firma", "Company");
          const trade = pick(row, "Stilling / Speciale", "Projekttype", "Fag", "Trade", "Titel");
          const notes = pick(row, "Sarahs noter til personlig besked", "Sarahs noter", "Noter");

          if (!email || !name || !email.includes("@")) continue;
          if (existingEmails.has(email)) { skipped++; continue; }

          existingEmails.add(email);
          newContacts.push({
            id: generateId(),
            name,
            email,
            company: company || "",
            trade: trade || "",
            type,
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
