import { NextResponse } from "next/server";
import { runLeadFinder } from "@/lib/lead-finder/runner";
import { readLeads, writeLeads, generateId } from "@/lib/db";
import { notifyAdmin } from "@/lib/sms";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // 300s — website scraping + note-generering kræver tid

export async function GET(req: Request) {
  // Sikkerhed: kun Vercel Cron eller admin med CRON_SECRET må kalde denne
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runLeadFinder();

    // Hent eksisterende leads for deduplicering + auto-cleanup
    let existingLeads = await readLeads();

    // Ryd op: gamle "New" leads (>7 dage uden handling) udløber så vi kan
    // hente dem igen med friske AI-noter. Kontaktede leads bevares altid.
    const PERMANENT_STATUSES = new Set(["Sent", "Drafted", "Approved", "Analyzed", "Rejected"]);
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    existingLeads = existingLeads.filter((l) => {
      if (PERMANENT_STATUSES.has(l.status)) return true;
      if (l.status !== "New") return true;
      return new Date(l.createdAt).getTime() >= cutoff;
    });

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

      // Skip hvis firma allerede kendes
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
        sourceFile: `auto-${candidate.source.toLowerCase().replace(/\s+/g, "-")}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Gem nye leads i KV (existingLeads er allerede ryddet for udløbne "New"s)
    await writeLeads([...existingLeads, ...newLeads]);

    // SMS notifikation til admin
    const sourceBreakdown = Object.entries(result.bySource)
      .map(([src, n]) => `${src}: ${n}`)
      .join(", ");

    const typeBreakdown = result.byType
      ? `Virk: ${result.byType.company} · Priv: ${result.byType.private} · Medarb: ${result.byType.employee}`
      : sourceBreakdown;

    const smsText =
      newLeads.length > 0
        ? `Hej chef! 🎯 ${newLeads.length} nye leads er klar til dig i dag. ${typeBreakdown}. Gå ind på admin og lad Sarah komme igang 🚀`
        : `Hej chef! LeadBot har kigget — ingen nye leads i dag, de ${result.candidates.length} fundet er allerede i systemet. Prøv igen i morgen 💪`;

    await notifyAdmin(smsText);

    return NextResponse.json({
      ok: true,
      found: result.candidates.length,
      imported: newLeads.length,
      bySource: result.bySource,
      durationMs: result.durationMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await notifyAdmin(`Hej chef! ⚠️ LeadBot stødte på en fejl i dag: ${msg}`).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
