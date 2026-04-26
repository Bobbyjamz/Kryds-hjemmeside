import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readSarahContacts, writeSarahContacts, generateId } from "@/lib/db";
import type { SarahContact } from "@/lib/types";

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

    const existing = await readSarahContacts();
    const existingEmails = new Set(existing.map((c) => c.email.toLowerCase()));
    const newContacts: SarahContact[] = [];
    let skipped = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      const type: "medarbejder" | "partner" = sheetName.toLowerCase().includes("partner")
        ? "partner"
        : "medarbejder";

      for (const row of rows) {
        const get = (...keys: string[]) =>
          (keys.map((k) => String(row[k] ?? "")).find((v) => v.trim()) ?? "").trim();

        const email = get("Email", "email", "EMAIL").toLowerCase();
        const name = get("Navn", "navn", "Name", "name");

        if (!email || !name || !email.includes("@")) continue;
        if (existingEmails.has(email)) { skipped++; continue; }

        existingEmails.add(email);
        newContacts.push({
          id: generateId(),
          name,
          email,
          company: get("Firma", "firma", "Company", "company"),
          trade: get("Fag", "fag", "Trade", "trade", "Titel", "titel"),
          type,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    }

    await writeSarahContacts([...existing, ...newContacts]);
    return NextResponse.json({ ok: true, imported: newContacts.length, skipped });
  } catch (err) {
    console.error("Sarah upload fejl:", err);
    return NextResponse.json({ error: "Kunne ikke parse Excel-fil" }, { status: 500 });
  }
}
