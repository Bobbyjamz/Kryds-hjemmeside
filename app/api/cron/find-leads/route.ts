import { NextResponse } from "next/server";
import { runLeadFinder } from "@/lib/lead-finder/runner";
import { readLeads, writeLeads, generateId } from "@/lib/db";
import { notifyAdmin } from "@/lib/sms";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // Op til 60 sekunder (Vercel Pro: 300s)

export async function GET(req: Request) {
  // Sikkerhed: kun Vercel Cron eller admin med CRON_SECRET må kalde denne
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

      // Skip hvis firma allerede kendes
      if (existingNames.has(nameLower)) continue;
      if (emailLower && existingEmails.has(emailLower)) continue;

      existingNames.add(nameLower);
      if (emailLower) existingEmails.add(emailLower);

      const now = new Date().toISOString();
      // Leads uden email gemmes med tom streng — kan tilføjes manuelt i admin
      newLeads.push({
        id: generateId(),
        companyName: candidate.companyName,
        contactName: candidate.contactName,
        email: candidate.email || "",
        phone: candidate.phone,
        website: candidate.website,
        city: candidate.city,
        industry: candidate.industry,
        serviceType: candidate.serviceType,
        notes: [
          candidate.notes,
          !candidate.email ? "⚠️ Ingen email fundet — tilføj manuelt for at Sarah kan sende" : "",
        ].filter(Boolean).join(" | "),
        status: "New",
        sourceFile: `auto-${candidate.source.toLowerCase().replace(/\s+/g, "-")}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Gem nye leads i KV
    if (newLeads.length > 0) {
      await writeLeads([...existingLeads, ...newLeads]);
    }

    // SMS notifikation til admin
    const sourceBreakdown = Object.entries(result.bySource)
      .map(([src, n]) => `${src}: ${n}`)
      .join(", ");

    const smsText =
      newLeads.length > 0
        ? `KrydsByg LeadBot: ${newLeads.length} nye leads fundet i dag (${sourceBreakdown}). Klar i admin-panelet.`
        : `KrydsByg LeadBot: Ingen nye leads i dag — alle ${result.candidates.length} fundet er allerede i systemet.`;

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
    await notifyAdmin(`KrydsByg LeadBot FEJL: ${msg}`).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
