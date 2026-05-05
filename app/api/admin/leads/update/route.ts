import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

// PATCH — opdater felter på et lead (email, phone, navn, budget, osv.)
export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    leadId,
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
    companyName,
  } = body;

  if (!leadId) {
    return NextResponse.json({ error: "Mangler leadId" }, { status: 400 });
  }

  const leads = await readLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });
  }

  const now = new Date().toISOString();

  const updated = leads.map((l) => {
    if (l.id !== leadId) return l;
    return {
      ...l,
      // Kun opdater felter der er sendt med (undefined = behold eksisterende)
      ...(companyName !== undefined && { companyName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(contactName !== undefined && { contactName }),
      ...(contactTitle !== undefined && { contactTitle }),
      ...(website !== undefined && { website }),
      ...(city !== undefined && { city }),
      ...(industry !== undefined && { industry }),
      ...(serviceType !== undefined && { serviceType }),
      ...(budget !== undefined && { budget }),
      ...(notes !== undefined && { notes }),
      ...(personalAngle !== undefined && { personalAngle }),
      updatedAt: now,
    };
  });

  await writeLeads(updated);
  return NextResponse.json({ ok: true });
}
