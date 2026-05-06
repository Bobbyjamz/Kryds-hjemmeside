import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { runLeadFinder } from "@/lib/lead-finder/runner";
import { readLeads, writeLeads, generateId } from "@/lib/db";
import { notifyAdmin } from "@/lib/sms";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();

  try {
    const result = await runLeadFinder();

    // Hent eksisterende leads for deduplicering
    const existingLeads = await readLeads();
    const existingNames = new Set(
      existingLeads.map((l) => l.companyName.toLowerCase().trim())
    );
    const existingEmails = new Set(
      existingLeads.map((l) => (l.email || "").toLowerCase().trim()).filter(Boolean)
    );

    // Filtrer dubletter
    const newLeads: Lead[] = [];
    for (const candidate of result.candidates) {
      const nameLower = candidate.companyName.toLowerCase().trim();
      const emailLower = (candidate.email || "").toLowerCase().trim();

      if (existingNames.has(nameLower)) continue;
      if (emailLower && existingEmails.has(emailLower)) continue;

      existingNames.add(nameLower);
      if (emailLower) existingEmails.add(emailLower);

      const now = new Date().toISOString();
      newLeads.push({
        id: generateId(),
        companyName: candidate.companyName,
        contactName: candidate.contactName,
        contactTitle: candidate.contactTitle,
        email: candidate.email || "",
        phone: candidate.phone,
        website: candidate.website,
        city: candidate.city,
        industry: candidate.industry,
        serviceType: candidate.serviceType,
        budget: candidate.budget,
        leadType: candidate.leadType,
        notes: [
          candidate.notes,
          !candidate.email ? "⚠️ Ingen email fundet — tilføj manuelt" : "",
        ].filter(Boolean).join(" | "),
        status: "New",
        sourceFile: `manual-run-${candidate.source.toLowerCase().replace(/\s+/g, "-")}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Gem nye leads
    if (newLeads.length > 0) {
      await writeLeads([...existingLeads, ...newLeads]);
    }

    // SMS notifikation
    const smsText =
      newLeads.length > 0
        ? `KrydsByg LeadBot (manuel): ${newLeads.length} nye leads importeret. Klar i admin.`
        : `KrydsByg LeadBot (manuel): Ingen nye leads — ${result.candidates.length} fundet er allerede i systemet.`;

    const smsResult = await (async () => {
      try {
        await notifyAdmin(smsText);
        return { sent: !!process.env.ADMIN_PHONE && !!process.env.GATEWAYAPI_TOKEN };
      } catch {
        return { sent: false };
      }
    })();

    return NextResponse.json({
      ok: true,
      found: result.candidates.length,
      imported: newLeads.length,
      bySource: result.bySource,
      byType: result.byType,
      durationMs: Date.now() - startMs,
      smsSent: smsResult.sent,
      hasGatewayToken: !!process.env.GATEWAYAPI_TOKEN,
      hasAdminPhone: !!process.env.ADMIN_PHONE,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg, durationMs: Date.now() - startMs }, { status: 500 });
  }
}
