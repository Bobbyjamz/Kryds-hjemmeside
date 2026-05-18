/**
 * Bulk-import endpoint — bruges af Python Outreach System (bridge.py)
 *
 * Authenticering: Bearer CRON_SECRET (samme som cron-routes)
 * Body: { source: string, generatedAt: string, leads: PythonLeadPayload[] }
 *
 * Deduplikerer på email (case-insensitive) og firmanavn (lowercased).
 * Bevarer alle eksisterende leads — tilføjer kun nye.
 *
 * Pusher også email-kontakter ind i Sarah's outreach-pipeline så hun
 * automatisk kan generere udkast til de nye partnere/private/medarbejdere.
 */

import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads, generateId, readSarahContacts, writeSarahContacts } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";
import type { Lead, LeadType, LeadStatus, SarahContact } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface PythonLeadPayload {
  companyName: string;
  contactName?: string | null;
  contactTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  city?: string | null;
  website?: string | null;
  notes?: string | null;
  serviceType?: string | null;       // KrydsByg Faggruppe (Tømrer/Murer/...)
  personalAngle?: string | null;
  leadType?: LeadType;
  qualifierScore?: number;
  status?: LeadStatus;
  sourceFile?: string;
  // Pass-through metadata fra Python:
  _pythonLeadId?: number;
  _pythonPriority?: string;
  _pythonSegment?: string;
  _isHiring?: boolean;
  _isActiveProject?: boolean;
}

interface BulkImportBody {
  source?: string;
  generatedAt?: string;
  leads: PythonLeadPayload[];
}

function normalizeEmail(e?: string | null): string {
  return (e || "").toLowerCase().trim();
}

function normalizeName(n: string): string {
  return n.toLowerCase().trim().replace(/\s+/g, " ");
}

function mapSarahType(leadType?: LeadType): "medarbejder" | "partner" | "privat" {
  if (leadType === "employee") return "medarbejder";
  if (leadType === "private") return "privat";
  return "partner";
}

function buildNotes(p: PythonLeadPayload): string {
  const parts: string[] = [];
  if (p.notes) parts.push(p.notes);
  if (p._pythonPriority) parts.push(`Python-prioritet: ${p._pythonPriority}`);
  if (p._pythonSegment) parts.push(`Segment: ${p._pythonSegment}`);
  if (p._isHiring) parts.push("Aktivt ansættende — kan have akut vikar-behov");
  if (p._isActiveProject) parts.push("Har aktive byggeprojekter");
  return parts.filter(Boolean).join(" · ");
}

export async function POST(req: NextRequest) {
  // Genbrug cron-auth — Python sender Bearer CRON_SECRET
  const authFail = verifyCronAuth(req);
  if (authFail) return authFail;

  let body: BulkImportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.leads) || body.leads.length === 0) {
    return NextResponse.json({ error: "Body skal have 'leads' array med mindst ét element" }, { status: 400 });
  }

  if (body.leads.length > 1000) {
    return NextResponse.json({ error: "Max 1000 leads pr. request" }, { status: 400 });
  }

  const source = body.source || "external-bulk-import";
  const generatedAt = body.generatedAt || new Date().toISOString();
  const now = new Date().toISOString();

  // ── Eksisterende leads til dedup ─────────────────────────────────────────
  const existingLeads = await readLeads();
  const existingEmails = new Set(
    existingLeads.map((l) => normalizeEmail(l.email)).filter(Boolean),
  );
  const existingNames = new Set(
    existingLeads.map((l) => normalizeName(l.companyName)),
  );

  const existingSarah = await readSarahContacts();
  const existingSarahEmails = new Set(existingSarah.map((c) => normalizeEmail(c.email)).filter(Boolean));

  const newLeads: Lead[] = [];
  const newSarah: SarahContact[] = [];
  let skipped = 0;
  let invalid = 0;

  for (const p of body.leads) {
    const companyName = (p.companyName || "").trim();
    if (!companyName) {
      invalid++;
      continue;
    }

    const email = normalizeEmail(p.email);
    const normName = normalizeName(companyName);

    // Dedup: email matches existing
    if (email && existingEmails.has(email)) {
      skipped++;
      continue;
    }
    // Dedup: same company name (no email)
    if (!email && existingNames.has(normName)) {
      skipped++;
      continue;
    }

    const leadType: LeadType = (p.leadType as LeadType) || "company";
    const consolidatedNotes = buildNotes(p);

    const lead: Lead = {
      id: generateId(),
      companyName,
      status: (p.status as LeadStatus) || "New",
      leadType,
      email: email || "",
      ...(p.contactName && { contactName: p.contactName.trim() }),
      ...(p.contactTitle && { contactTitle: p.contactTitle.trim() }),
      ...(p.phone && { phone: p.phone.trim() }),
      ...(p.industry && { industry: p.industry.trim() }),
      ...(p.city && { city: p.city.trim() }),
      ...(p.website && { website: p.website.trim() }),
      ...(consolidatedNotes && { notes: consolidatedNotes }),
      ...(p.serviceType && { serviceType: p.serviceType.trim() }),
      ...(p.personalAngle && { personalAngle: p.personalAngle.trim() }),
      ...(typeof p.qualifierScore === "number" && { qualifierScore: p.qualifierScore }),
      sourceFile: p.sourceFile || `${source} @ ${generatedAt}`,
      createdAt: now,
      updatedAt: now,
    };

    newLeads.push(lead);
    if (email) existingEmails.add(email);
    existingNames.add(normName);

    // Push email-kontakter ind i Sarah's outreach-pipeline (kun hvis email findes)
    if (email && !existingSarahEmails.has(email)) {
      newSarah.push({
        id: generateId(),
        name: p.contactName?.trim() || companyName,
        email,
        company: companyName,
        trade: p.serviceType?.trim() || "",
        type: mapSarahType(leadType),
        status: "pending",
        notes: p.personalAngle || consolidatedNotes || undefined,
        createdAt: now,
      });
      existingSarahEmails.add(email);
    }
  }

  if (newLeads.length > 0) {
    // Nye leads forrest — Sarah og admin ser dem først
    await writeLeads([...newLeads, ...existingLeads]);
  }
  if (newSarah.length > 0) {
    await writeSarahContacts([...existingSarah, ...newSarah]);
  }

  return NextResponse.json({
    ok: true,
    imported: newLeads.length,
    sarahContactsAdded: newSarah.length,
    skipped,
    invalid,
    totalReceived: body.leads.length,
    source,
    generatedAt,
  });
}
