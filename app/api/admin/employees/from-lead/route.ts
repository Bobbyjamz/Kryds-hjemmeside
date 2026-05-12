/**
 * Konverter et employee-lead til en medarbejder.
 *
 * Lead-felter mappes til Employee-felter, leadet markeres "Approved"
 * og medarbejderen får status="AFVENTER_BEKRÆFTELSE" indtil kontrakt
 * er accepteret via /tilmeld.
 */

import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads, readEmployees, writeEmployees, generateId } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { Employee } from "@/lib/types";

export const runtime = "nodejs";

function mapTrade(value: string | undefined): string {
  const v = (value || "").toLowerCase().trim();
  if (!v) return "HANDYMAN";
  if (v.includes("tømrer") || v.includes("snedker")) return "TOMRER";
  if (v.includes("murer")) return "MURER";
  if (v.includes("maler")) return "MALER";
  if (v.includes("elektri")) return "ELEKTRIKER";
  if (v.includes("vvs")) return "VVS";
  if (v.includes("struktør")) return "STRUKTOR";
  if (v.includes("nedriv")) return "NEDRIVER";
  if (v.includes("montør") || v.includes("monter")) return "MONTOR";
  if (v.includes("have") || v.includes("gart")) return "HAVEMAND";
  if (v.includes("rengør")) return "RENGORING";
  if (v.includes("chauf") || v.includes("kørs")) return "CHAUFFOR";
  if (v.includes("byggehj")) return "BYGGEHJAELPER";
  return "HANDYMAN";
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { leadId, overrides } = body;

    if (!leadId) return NextResponse.json({ error: "leadId påkrævet" }, { status: 400 });

    const leads = await readLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });

    if (!lead.phone || lead.phone.replace(/\s/g, "").length < 8) {
      return NextResponse.json({ error: "Lead mangler gyldigt telefonnummer" }, { status: 400 });
    }

    const employees = await readEmployees();
    const phoneClean = lead.phone.replace(/\s/g, "");
    if (employees.find((e) => e.phone.replace(/\s/g, "") === phoneClean)) {
      return NextResponse.json({ error: "Medarbejder med dette telefonnummer findes allerede" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const name = overrides?.name?.trim() || lead.contactName || lead.companyName;

    const employee: Employee = {
      id: generateId(),
      name,
      phone: lead.phone,
      email: lead.email || undefined,
      birthDate: overrides?.birthDate || "1980-01-01",
      trade: mapTrade(overrides?.trade || lead.serviceType || lead.industry),
      skills: Array.isArray(overrides?.skills) ? overrides.skills : [],
      experience: overrides?.experience || lead.notes?.slice(0, 200) || undefined,
      notes: [
        `Konverteret fra lead: ${lead.companyName}`,
        lead.city ? `By: ${lead.city}` : "",
        lead.industry ? `Branche: ${lead.industry}` : "",
        lead.notes ? `\n--- Lead-noter ---\n${lead.notes}` : "",
        "⚠ Mangler kontrakt-godkendelse — send /tilmeld link",
      ].filter(Boolean).join("\n"),
      references: [],
      status: "AFVENTER_BEKRÆFTELSE",
      employeeType: "MEDARBEJDER",
      acceptedTerms: false,
      createdAt: now,
      updatedAt: now,
    };

    // Gem ny medarbejder
    await writeEmployees([...employees, employee]);

    // Marker lead som konverteret (status="Approved" — manuel behandling færdig)
    await writeLeads(leads.map((l) =>
      l.id === leadId
        ? {
            ...l,
            status: "Approved" as const,
            notes: [l.notes, `✓ Konverteret til medarbejder ${name} (${now.slice(0, 10)})`].filter(Boolean).join("\n\n"),
            updatedAt: now,
          }
        : l
    ));

    return NextResponse.json({ ok: true, employee });
  } catch (err) {
    console.error("[employees/from-lead]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
