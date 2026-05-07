#!/usr/bin/env node
/**
 * Test-script: sender en mock LeadBot-batch til /api/leadbot/ingest
 *
 * Brug:
 *   node scripts/test-leadbot.js                        (sender til http://localhost:3000)
 *   node scripts/test-leadbot.js https://krydsbyg.com  (sender til prod)
 *
 * Kræver: LEADBOT_WEBHOOK_SECRET sat i miljøet (eller i .env.local)
 *
 *   Windows:  set LEADBOT_WEBHOOK_SECRET=din-secret && node scripts/test-leadbot.js
 *   Mac/Linux: LEADBOT_WEBHOOK_SECRET=din-secret node scripts/test-leadbot.js
 */

import crypto from "crypto";

// ── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = process.argv[2] || "http://localhost:3000";
const INGEST_URL = `${BASE_URL}/api/leadbot/ingest`;
const CONFIG_URL = `${BASE_URL}/api/leadbot/config`;

const SECRET = process.env.LEADBOT_WEBHOOK_SECRET;
if (!SECRET) {
  console.error("❌  LEADBOT_WEBHOOK_SECRET er ikke sat i miljøet.");
  console.error("    Kør: set LEADBOT_WEBHOOK_SECRET=xxx && node scripts/test-leadbot.js");
  process.exit(1);
}

// ── HMAC helper ─────────────────────────────────────────────────────────────

function sign(body) {
  const hex = crypto.createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
  return `sha256=${hex}`;
}

// ── Mock-batch ───────────────────────────────────────────────────────────────

const batchId = `test-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const batch = {
  version: 1,
  batchId,
  generatedAt: new Date().toISOString(),
  leads: [
    {
      source: "jobindex",
      externalId: 1,
      company: { name: "Testfirma Maling ApS", city: "København K", website: "https://testfirma-maling.dk" },
      contact: {
        name: "Lars Testesen",
        title: "Direktør",
        email: `lars.test.${Date.now()}@testfirma-maling.dk`,
        emailConfidence: 0.92,
        phone: "+4520304050",
      },
      job: { title: "Søger malere og håndværkere", description: "Virksomhed der ansætter malere til facade-projekter i Storkøbenhavn." },
      enrichment: { emailMethod: "scrape", domain: "testfirma-maling.dk" },
    },
    {
      source: "googlemaps",
      externalId: 2,
      company: { name: "Hotel Teststed", city: "Frederiksberg", website: "https://hotelteststed.dk" },
      contact: {
        name: "Maria Testdatter",
        title: "Facility Manager",
        email: `maria.test.${Date.now()}@hotelteststed.dk`,
        emailConfidence: 0.85,
        phone: "+4529304050",
      },
      job: { title: "Rengøring & vedligehold" },
      enrichment: { emailMethod: "guess+verify", domain: "hotelteststed.dk" },
    },
    {
      // Skal afvises: for lav confidence
      source: "linkedin",
      externalId: 3,
      company: { name: "Sketchysoft ApS" },
      contact: {
        email: "maybe@sketchysoft.dk",
        emailConfidence: 0.3,
      },
    },
    {
      // Skal afvises: ingen email
      source: "facebook",
      externalId: 4,
      company: { name: "Firma uden email" },
      contact: { name: "Anonym Person" },
    },
  ],
};

const bodyStr = JSON.stringify(batch, null, 2);
const signature = sign(bodyStr);

// ── Test 1: Ingest ──────────────────────────────────────────────────────────

console.log("─".repeat(60));
console.log(`🤖  LeadBot Test Script`);
console.log(`📡  Target: ${INGEST_URL}`);
console.log(`🔑  Batch: ${batchId}`);
console.log("─".repeat(60));

console.log("\n[1/3] Sender mock-batch til /api/leadbot/ingest...\n");

let ingestResult;
try {
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-LeadBot-Signature": signature,
    },
    body: bodyStr,
  });

  ingestResult = await res.json();

  if (res.ok) {
    console.log(`✅  HTTP ${res.status} OK`);
    console.log(`    Accepteret: ${ingestResult.accepted}`);
    if (ingestResult.rejected?.length > 0) {
      console.log(`    Afvist:     ${ingestResult.rejected.length}`);
      for (const r of ingestResult.rejected) {
        console.log(`       - Lead #${r.leadId}: ${r.reason}`);
      }
    }
  } else {
    console.error(`❌  HTTP ${res.status}:`, ingestResult);
    process.exit(1);
  }
} catch (err) {
  console.error("❌  Netværksfejl:", err.message);
  process.exit(1);
}

// ── Test 2: Idempotency (send samme batch igen) ──────────────────────────────

console.log("\n[2/3] Sender SAMME batch igen (idempotency-test)...\n");

try {
  const res2 = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-LeadBot-Signature": signature,
    },
    body: bodyStr,
  });

  const res2json = await res2.json();
  if (res2json.idempotent) {
    console.log(`✅  Idempotency OK — batch allerede processeret, samme svar returneret`);
  } else {
    console.warn("⚠️   Batch blev behandlet igen (ingen dedup):", res2json);
  }
} catch (err) {
  console.error("❌  Netværksfejl:", err.message);
}

// ── Test 3: Config endpoint ──────────────────────────────────────────────────

console.log("\n[3/3] Henter LeadBot-config fra /api/leadbot/config...\n");

try {
  // Config-endpoint signerer over query string (tom her)
  const configSig = sign("");
  const res3 = await fetch(CONFIG_URL, {
    headers: { "X-LeadBot-Signature": configSig },
  });

  if (res3.ok) {
    const d = await res3.json();
    const cfg = d.config;
    console.log(`✅  Config hentet`);
    console.log(`    Focus:        "${cfg.focus || "(ikke sat)"}"`)
    console.log(`    Lead-type:    ${cfg.leadTypeFocus}`);
    console.log(`    Min confidence: ${cfg.minEmailConfidence}`);
    console.log(`    Daglig cap:   ${cfg.dailyLeadCap || "ubegrænset"}`);
    const activeSources = Object.entries(cfg.enabledSources).filter(([,v]) => v).map(([k]) => k);
    console.log(`    Aktive kilder: ${activeSources.join(", ")}`);
    if (cfg.priorityQueries?.length) {
      console.log(`    Prioritets-søgeord: ${cfg.priorityQueries.join(", ")}`);
    }
  } else {
    console.error(`❌  HTTP ${res3.status}:`, await res3.text());
  }
} catch (err) {
  console.error("❌  Netværksfejl:", err.message);
}

console.log("\n" + "─".repeat(60));
console.log("✅  Test færdig. Tjek Sarah → LeadBot-fanen for at se batchen.");
console.log("    Nye leads ligger under /admin/leads");
console.log("─".repeat(60) + "\n");
