/**
 * LeadBot ingestion endpoint — modtager batches fra ekstern Node.js LeadBot.
 *
 * Spec (V0.1):
 *   POST /api/leadbot/ingest
 *   Headers: X-LeadBot-Signature: sha256=<hex>
 *   Body: { version, batchId, generatedAt, leads: [...] }
 *
 *   Response: { accepted: <count>, rejected: [{ leadId, reason }] }
 *
 * Sikkerhed:
 *   - HMAC-SHA256 over RAW body med LEADBOT_WEBHOOK_SECRET
 *   - Timing-safe sammenligning af signatur
 *   - Dedup på batchId (30 dages TTL i Redis) — hvis LeadBot retransmitterer
 *
 * Per-lead validering:
 *   - Email skal være til stede og parse'bar
 *   - emailConfidence ≥ 0.5 (LeadBot pusher kun ≥0.5 ifølge specen, men vi tjekker igen)
 *   - Dedup mod eksisterende leads (samme email, eller samme company+source hvis ingen email)
 */

import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { readLeads, writeLeads, generateId } from "@/lib/db";
import type { Lead, LeadType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Types fra LeadBot-spec ─────────────────────────────────────────────────

interface LeadBotPayload {
  version: number;
  batchId: string;
  generatedAt: string;
  leads: LeadBotLead[];
}

interface LeadBotLead {
  source: string;                  // "jobindex" | "linkedin" | "facebook" | …
  company?: { name?: string; cvr?: string; website?: string; city?: string };
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    emailConfidence?: number;       // 0–1
    phone?: string;
  };
  job?: { title?: string; description?: string };
  enrichment?: {
    emailMethod?: string;           // "mailto" | "scrape" | "guess+verify" | …
    domain?: string;
  };
  externalId?: string | number;     // bruges i rejected[].leadId
}

interface RejectedLead {
  leadId: string | number;
  reason: "duplicate" | "missing_email" | "low_confidence" | "invalid_payload";
}

// ── Redis-klient til batchId-dedup ─────────────────────────────────────────

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BATCH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dage

// ── HMAC-validering ────────────────────────────────────────────────────────

function verifySignature(rawBody: string, headerValue: string | null, secret: string): boolean {
  if (!headerValue) return false;

  // Forventer "sha256=<hex>"
  const match = headerValue.match(/^sha256=([0-9a-f]+)$/i);
  if (!match) return false;
  const provided = Buffer.from(match[1], "hex");

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest();
  if (provided.length !== expected.length) return false;

  return crypto.timingSafeEqual(provided, expected);
}

// ── Lead-konvertering: LeadBot → intern Lead ────────────────────────────────

function isValidEmail(email: string | undefined): email is string {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function dedupKey(email: string | undefined, source: string, companyName: string | undefined): string {
  if (email) return `email:${email.trim().toLowerCase()}`;
  return `company:${source}:${(companyName || "").trim().toLowerCase()}`;
}

function classifyLeadType(lead: LeadBotLead): LeadType {
  // Job-portaler → ofte employee-leads (kandidater)
  // CVR/Maps → company-leads
  const empSources = new Set(["jobindex", "linkedin", "thehub", "jobnet", "indeed"]);
  if (empSources.has(lead.source) && lead.job?.title) return "employee";
  return "company";
}

function convertLead(input: LeadBotLead): Lead {
  const now = new Date().toISOString();
  const company = input.company?.name?.trim() || input.contact?.name?.trim() || "(ukendt)";
  const email = input.contact?.email?.trim() || "";
  const conf = input.contact?.emailConfidence ?? 0;

  const noteLines = [
    `Kilde: ${input.source}`,
    input.job?.title ? `Stilling: ${input.job.title}` : null,
    input.enrichment?.emailMethod ? `Email-metode: ${input.enrichment.emailMethod} (conf ${conf.toFixed(2)})` : null,
    input.enrichment?.domain ? `Domain: ${input.enrichment.domain}` : null,
    input.company?.cvr ? `CVR: ${input.company.cvr}` : null,
    input.job?.description ? `\n${input.job.description.slice(0, 400)}` : null,
  ].filter(Boolean);

  return {
    id: generateId(),
    companyName: company,
    contactName: input.contact?.name,
    contactTitle: input.contact?.title || input.job?.title,
    email,
    phone: input.contact?.phone,
    industry: input.job?.title,
    city: input.company?.city,
    website: input.company?.website,
    notes: noteLines.join(" · "),
    leadType: classifyLeadType(input),
    sourceFile: `LeadBot:${input.source}`,
    status: "New",
    qualifierScore: Math.round(conf * 100), // brug confidence som start-score
    createdAt: now,
    updatedAt: now,
  };
}

// ── POST handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.LEADBOT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfigured: LEADBOT_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }

  // 1) Læs raw body — vigtigt at den bruges UÆNDRET til HMAC-verifikation
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // 2) Verificér signatur
  const signature = req.headers.get("x-leadbot-signature");
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3) Parse JSON
  let payload: LeadBotPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.batchId || !Array.isArray(payload.leads)) {
    return NextResponse.json({ error: "Invalid payload shape" }, { status: 400 });
  }

  // 4) Dedup på batchId — hvis vi allerede har set denne batch, returnér samme svar idempotent
  const batchKey = `leadbot:batch:${payload.batchId}`;
  try {
    const existing = await redis.get<{ accepted: number; rejected: RejectedLead[] }>(batchKey);
    if (existing) {
      return NextResponse.json({
        ...existing,
        idempotent: true,
        message: "Batch already processed",
      });
    }
  } catch {
    // Ikke kritisk — fortsæt
  }

  // 5) Behandl leads
  const existingLeads = await readLeads();
  const existingKeys = new Set(
    existingLeads.map((l) => dedupKey(l.email, l.sourceFile?.replace(/^LeadBot:/, "") || "", l.companyName))
  );

  let accepted = 0;
  const rejected: RejectedLead[] = [];
  const toAdd: Lead[] = [];
  const seenInBatch = new Set<string>();

  for (let i = 0; i < payload.leads.length; i++) {
    const raw = payload.leads[i];
    const refId = raw.externalId ?? i;

    // Email-validering
    if (!isValidEmail(raw.contact?.email)) {
      rejected.push({ leadId: refId, reason: "missing_email" });
      continue;
    }

    // Confidence-tjek (LeadBot pusher kun ≥0.5, men double-check)
    const conf = raw.contact?.emailConfidence ?? 0;
    if (conf < 0.5) {
      rejected.push({ leadId: refId, reason: "low_confidence" });
      continue;
    }

    const key = dedupKey(raw.contact?.email, raw.source, raw.company?.name);

    if (seenInBatch.has(key) || existingKeys.has(key)) {
      rejected.push({ leadId: refId, reason: "duplicate" });
      continue;
    }
    seenInBatch.add(key);

    toAdd.push(convertLead(raw));
    accepted++;
  }

  // 6) Skriv nye leads
  if (toAdd.length > 0) {
    const next = [...existingLeads, ...toAdd];
    await writeLeads(next);
  }

  // 7) Marker batchId som processeret (idempotency)
  const result = { accepted, rejected };
  try {
    await redis.set(batchKey, result, { ex: BATCH_TTL_SECONDS });
  } catch {
    // Ikke kritisk
  }

  // 8) Log kort så admin kan se aktivitet (best-effort)
  try {
    const recent = (await redis.get<unknown[]>("leadbot:recent")) ?? [];
    const next = [
      {
        batchId: payload.batchId,
        generatedAt: payload.generatedAt,
        receivedAt: new Date().toISOString(),
        total: payload.leads.length,
        accepted,
        rejected: rejected.length,
        sourceBreakdown: countBy(payload.leads, (l) => l.source),
      },
      ...recent,
    ].slice(0, 100);
    await redis.set("leadbot:recent", next);
  } catch {
    // Ikke kritisk
  }

  return NextResponse.json(result);
}

function countBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of arr) {
    const k = keyFn(item);
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
