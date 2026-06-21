import { NextResponse } from "next/server";
import { runLeadFinderWithGapFilling } from "@/lib/lead-finder/runner/gap-runner";
import { findEmail } from "@/lib/lead-finder/enrichment/email-finder";
import { isCompleteLead, isValidEmail } from "@/lib/lead-finder/is-complete";
import { readLeads, writeLeads, generateId } from "@/lib/db";
import { notifyAdmin } from "@/lib/sms";
import { verifyCronAuth } from "@/lib/cron-auth";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // 300s — website scraping + note-generering kræver tid

export async function GET(req: Request) {
  const authFail = verifyCronAuth(req);
  if (authFail) return authFail;

  try {
    const result = await runLeadFinderWithGapFilling();

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

    // Filtrer dubletter + frasortér ufuldstændige (email kræves for alle typer)
    const newLeads: Lead[] = [];
    let skippedIncomplete = 0;
    for (const candidate of result.candidates) {
      const nameLower = candidate.companyName.toLowerCase().trim();

      // Skip hvis firma allerede kendes
      if (existingNames.has(nameLower)) continue;
      const initialEmail = (candidate.email || "").toLowerCase().trim();
      if (initialEmail && existingEmails.has(initialEmail)) continue;

      // Sidste-chance rescue: mangler email, prøv at finde én før vi opgiver
      let email = candidate.email;
      if (!isValidEmail(email)) {
        email = (await findEmail(candidate)) ?? email;
      }

      // Hård regel: email + navn kræves — ellers gemmes leadet aldrig
      if (!isCompleteLead({ ...candidate, email })) {
        skippedIncomplete++;
        continue;
      }

      const emailLower = email!.toLowerCase().trim();
      if (existingEmails.has(emailLower)) continue; // dedup mod nyfunden email
      existingNames.add(nameLower);
      existingEmails.add(emailLower);

      const now = new Date().toISOString();

      newLeads.push({
        id: generateId(),
        companyName: candidate.companyName,
        contactName: candidate.contactName,
        contactTitle: candidate.contactTitle,
        email: email!,
        phone: candidate.phone,
        website: candidate.website,
        city: candidate.city,
        industry: candidate.industry,
        serviceType: candidate.serviceType,
        budget: candidate.budget,
        leadType: candidate.leadType,
        qualifierScore: candidate.score,
        notes: candidate.notes || undefined,
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
      skippedIncomplete,
      bySource: result.bySource,
      byType: result.byType,
      // v2 fields
      byFaggruppe: result.byFaggruppe,
      brainPlan: result.brainPlan,
      retries: result.retries,
      finalShortfall: result.finalShortfall,
      durationMs: result.durationMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await notifyAdmin(`Hej chef! ⚠️ LeadBot stødte på en fejl i dag: ${msg}`).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
