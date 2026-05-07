import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readEmailMemory, readSarahContacts, readLeads } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Returnerer en samlet liste af alle afsendte mails:
 *   1. EmailMemoryEntry — auto-outreach til leads (Council + Sarah pipeline)
 *   2. SarahContact (status=emailed) — Excel-uploadede partnere/medarbejdere
 *
 * Begge sorteres efter sendt-tidspunkt (nyeste først).
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [memory, contacts, leads] = await Promise.all([
    readEmailMemory(),
    readSarahContacts(),
    readLeads(),
  ]);

  // Lead-lookup: leadId → companyName + email (for at vise pænere navne)
  const leadMap = new Map(leads.map((l) => [l.id, l]));

  const fromMemory = memory.map((m) => {
    const lead = leadMap.get(m.leadId);
    return {
      id: `mem-${m.leadId}-${m.sentAt}`,
      source: "lead" as const,
      recipient: lead?.email || "(ukendt)",
      recipientName: lead?.companyName || lead?.contactName || "(ukendt lead)",
      subject: m.subjectLine,
      sentAt: m.sentAt,
      industry: m.industry,
      serviceType: m.serviceType,
      angle: m.angle,
      tone: m.tone,
      bodyLength: m.bodyLength,
      councilScore: m.councilScore,
      customerType: m.customerType,
      wasEdited: m.wasEdited,
      editSummary: m.editSummary,
      city: lead?.city,
      phone: lead?.phone,
      leadStatus: lead?.status,
    };
  });

  const fromContacts = contacts
    .filter((c) => c.emailSentAt)
    .map((c) => ({
      id: `contact-${c.id}`,
      source: "contact" as const,
      recipient: c.email,
      recipientName: c.name + (c.company ? ` · ${c.company}` : ""),
      subject: "(via Sarah-skabelon)",
      bodyPreview: c.generatedEmail?.slice(0, 200),
      sentAt: c.emailSentAt!,
      contactType: c.type,            // "partner" | "medarbejder" | "privat"
      contactTrade: c.trade,
      contactStatus: c.status,         // emailed/followed_up/replied/meeting/closed
      followUpSentAt: c.followUpSentAt,
      repliedAt: c.repliedAt,
    }));

  const all = [...fromMemory, ...fromContacts].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return NextResponse.json({
    ok: true,
    total: all.length,
    fromLeadPipeline: fromMemory.length,
    fromContactPipeline: fromContacts.length,
    emails: all,
  });
}
