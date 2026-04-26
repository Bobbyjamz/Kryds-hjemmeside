import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readSarahContacts, writeSarahContacts, readCustomers, writeCustomers, generateId } from "@/lib/db";
import type { SarahContact, Customer } from "@/lib/types";

export const runtime = "nodejs";

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
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      const lowerName = sheetName.toLowerCase();

      const get = (row: Record<string, unknown>, ...keys: string[]) =>
        (keys.map((k) => String(row[k] ?? "")).find((v) => v.trim()) ?? "").trim();

      // Customer sheets: kunde, partner, customer, virksomhed
      if (
        lowerName.includes("kunde") ||
        lowerName.includes("customer") ||
        lowerName.includes("virksomhed") ||
        lowerName.includes("partner")
      ) {
        for (const row of rows) {
          const name = get(row, "Navn", "navn", "Kontaktperson", "kontaktperson", "Name", "name");
          const email = get(row, "Email", "email", "EMAIL").toLowerCase();
          const phone = get(row, "Telefon", "telefon", "Phone", "phone").replace(/\D/g, "").slice(-8);
          const typeRaw = get(row, "Type", "type").toLowerCase();

          if (!name) continue;
          if (email && customerEmails.has(email)) { skippedCustomers++; continue; }
          if (phone && customerPhones.has(phone)) { skippedCustomers++; continue; }

          const customer: Customer = {
            id: generateId(),
            type: typeRaw.includes("privat") ? "privat" : "virksomhed",
            name,
            company: get(row, "Firma", "firma", "Company", "company"),
            email: email || undefined,
            phone: get(row, "Telefon", "telefon", "Phone", "phone") || undefined,
            cvr: get(row, "CVR", "cvr") || undefined,
            trade: get(row, "Fag", "fag", "Trade", "trade") || undefined,
            status: "lead",
            createdAt: new Date().toISOString(),
            source: "excel_import",
          };

          if (email) customerEmails.add(email);
          if (phone) customerPhones.add(phone);
          newCustomers.push(customer);
        }
      } else {
        // Sarah outreach contacts (medarbejder / partner)
        const type: "medarbejder" | "partner" = lowerName.includes("partner") ? "partner" : "medarbejder";

        for (const row of rows) {
          const email = get(row, "Email", "email", "EMAIL").toLowerCase();
          const name = get(row, "Navn", "navn", "Name", "name");

          if (!email || !name || !email.includes("@")) continue;
          if (existingEmails.has(email)) { skipped++; continue; }

          existingEmails.add(email);
          newContacts.push({
            id: generateId(),
            name,
            email,
            company: get(row, "Firma", "firma", "Company", "company"),
            trade: get(row, "Fag", "fag", "Trade", "trade", "Titel", "titel"),
            type,
            status: "pending",
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
