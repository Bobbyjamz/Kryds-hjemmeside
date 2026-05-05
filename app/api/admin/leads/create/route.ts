import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { Lead, LeadType } from "@/lib/types";

export const runtime = "nodejs";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// POST — opret et nyt lead manuelt
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    companyName,
    email,
    phone,
    contactName,
    contactTitle,
    website,
    city,
    industry,
    serviceType,
    budget,
    notes,
    personalAngle,
    leadType = "company",
  } = body;

  if (!companyName?.trim()) {
    return NextResponse.json({ error: "Firmanavn er påkrævet" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const newLead: Lead = {
    id: generateId(),
    companyName: companyName.trim(),
    status: "New",
    leadType: (leadType as LeadType) || "company",
    ...(email && { email: email.trim() }),
    ...(phone && { phone: phone.trim() }),
    ...(contactName && { contactName: contactName.trim() }),
    ...(contactTitle && { contactTitle: contactTitle.trim() }),
    ...(website && { website: website.trim() }),
    ...(city && { city: city.trim() }),
    ...(industry && { industry: industry.trim() }),
    ...(serviceType && { serviceType: serviceType.trim() }),
    ...(budget && { budget: budget.trim() }),
    ...(notes && { notes: notes.trim() }),
    ...(personalAngle && { personalAngle: personalAngle.trim() }),
    sourceFile: "Manuel oprettelse",
    createdAt: now,
    updatedAt: now,
  };

  // Tjek om der allerede er et lead med samme email (dubletter)
  if (email?.trim()) {
    const existing = await readLeads();
    const duplicate = existing.find(
      (l) => l.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `Der findes allerede et lead med denne email: ${duplicate.companyName}` },
        { status: 409 }
      );
    }
  }

  const leads = await readLeads();
  await writeLeads([newLead, ...leads]);

  return NextResponse.json({ ok: true, lead: newLead });
}
