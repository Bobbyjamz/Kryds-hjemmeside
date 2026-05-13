import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { runLeadFinderWithGapFilling } from "@/lib/lead-finder/runner/gap-runner";
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
    const result = await runLeadFinderWithGapFilling();

    // Hent eksisterende leads for deduplicering
    let existingLeads = await readLeads();

    // Smartere dedup-strategi:
    //   1. Kontaktede leads (Sent/Drafted/Approved/Analyzed/Rejected) = perm. duplicat
    //   2. Gamle "New" leads (>7 dage uden nogen handling) ryddes op — de udløber
    //      og må gerne komme igen med friske AI-noter
    const PERMANENT_STATUSES = new Set(["Sent", "Drafted", "Approved", "Analyzed", "Rejected"]);
    const STALE_NEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 dage
    const cutoff = Date.now() - STALE_NEW_THRESHOLD_MS;

    const beforeCount = existingLeads.length;
    existingLeads = existingLeads.filter((l) => {
      if (PERMANENT_STATUSES.has(l.status)) return true;       // Behold altid
      if (l.status !== "New") return true;                     // Behold "Needs Review" etc.
      const created = new Date(l.createdAt).getTime();
      return created >= cutoff;                                // Behold New < 7 dage
    });
    const cleanedUp = beforeCount - existingLeads.length;

    // Dedup mod alle leads vi stadig har
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
      const noteWithWarning = [
        candidate.notes,
        !candidate.email ? "⚠️ Ingen email fundet — tilføj manuelt" : "",
      ].filter(Boolean).join("\n\n");

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
        qualifierScore: candidate.score,
        notes: noteWithWarning || undefined,
        status: "New",
        sourceFile: `manual-run-${candidate.source.toLowerCase().replace(/\s+/g, "-")}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Gem nye leads (existingLeads er allerede ryddet for >7 dage gamle "New"s)
    if (newLeads.length > 0 || cleanedUp > 0) {
      await writeLeads([...existingLeads, ...newLeads]);
    }

    // SMS notifikation
    const smsText =
      newLeads.length > 0
        ? `Hej chef! 🎯 Manuel kørsel: ${newLeads.length} nye leads klar til dig. Gå ind på admin og lad Sarah komme igang 🚀`
        : `Hej chef! Manuel kørsel: Ingen nye leads — alle ${result.candidates.length} fundet er allerede i systemet 💪`;

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
      cleanedUp,
      qualified: result.qualifiedCount,
      discarded: result.discardedCount,
      bySource: result.bySource,
      byType: result.byType,
      // v2 fields:
      byFaggruppe: result.byFaggruppe,
      brainPlan: result.brainPlan,
      retries: result.retries,
      finalShortfall: result.finalShortfall,
      sourceDiagnostics: result.sourceDiagnostics,
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
