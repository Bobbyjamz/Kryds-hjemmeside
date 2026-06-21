import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readLeads, writeLeads } from "@/lib/db";
import { findEmail } from "@/lib/lead-finder/enrichment/email-finder";
import { isCompleteLead, isValidEmail } from "@/lib/lead-finder/is-complete";
import type { Lead } from "@/lib/types";
import type { LeadCandidate } from "@/lib/lead-finder/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Backfill — rydder op i EKSISTERENDE leads efter den hårde email-regel.
 *
 *   1. Allerede komplette leads (email + navn) røres ikke.
 *   2. Leads der allerede er i outreach-pipelinen (Sent/Drafted/Approved/
 *      Analyzed/Rejected) røres ikke — også selvom de er ufuldstændige (fx
 *      telefon-leads sendt via SMS). De er historik.
 *   3. Resten: sidste-chance rescue via findEmail(). Lykkes det -> email
 *      tilføjes og leadet genaktiveres ("New"). Mislykkes det -> karantæne
 *      ("Incomplete") så det aldrig sendes til, men heller ikke slettes.
 *
 * Login-beskyttet. Trigges manuelt fra admin — rører aldrig prod automatisk.
 */

const PROTECTED_STATUSES = new Set<Lead["status"]>([
  "Sent", "Drafted", "Approved", "Analyzed", "Rejected",
]);

function leadToCandidate(l: Lead): LeadCandidate {
  return {
    companyName: l.companyName,
    contactName: l.contactName,
    email: l.email || undefined,
    website: l.website,
    source: l.sourceFile || "backfill",
    leadType: l.leadType ?? "company",
  };
}

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startMs = Date.now();
  try {
    const leads = await readLeads();
    let rescued = 0;
    let quarantined = 0;
    let alreadyComplete = 0;
    let skippedProtected = 0;

    const updated: Lead[] = [];
    for (const lead of leads) {
      if (isCompleteLead(lead)) {
        alreadyComplete++;
        updated.push(lead);
        continue;
      }
      if (PROTECTED_STATUSES.has(lead.status)) {
        skippedProtected++;
        updated.push(lead);
        continue;
      }

      // Sidste-chance rescue: forsøg at finde den manglende email
      let email = lead.email;
      if (!isValidEmail(email)) {
        const found = await findEmail(leadToCandidate(lead));
        if (found) email = found;
      }

      const now = new Date().toISOString();
      if (isCompleteLead({ ...lead, email })) {
        rescued++;
        const nextStatus: Lead["status"] = lead.status === "Incomplete" ? "New" : lead.status;
        updated.push({ ...lead, email: email!, status: nextStatus, updatedAt: now });
      } else {
        quarantined++;
        updated.push({ ...lead, status: "Incomplete", updatedAt: now });
      }
    }

    if (rescued > 0 || quarantined > 0) {
      await writeLeads(updated);
    }

    return NextResponse.json({
      ok: true,
      total: leads.length,
      alreadyComplete,
      rescued,
      quarantined,
      skippedProtected,
      durationMs: Date.now() - startMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg, durationMs: Date.now() - startMs }, { status: 500 });
  }
}
