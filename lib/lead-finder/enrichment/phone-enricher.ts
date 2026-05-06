/**
 * Phone Enricher — finder telefonnumre til leads der mangler dem.
 *
 * Kilder (i rækkefølge):
 *   1. Krak.dk firma-søgning (gratis, scraping)
 *   2. 118.dk person-søgning (gratis, scraping)
 *   3. CVR-API telefon (allerede bruges i cvr.ts — her som eksplicit fallback)
 *
 * Bruges kun på company-leads uden telefon, for at øge kontaktrate.
 */

import type { LeadCandidate } from "../types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Krak.dk ───────────────────────────────────────────────────────────────────

async function findPhoneKrak(companyName: string, city?: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(companyName);
    const where = encodeURIComponent(city || "københavn");
    const url = `https://www.krak.dk/firma?q=${query}&where=${where}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html",
        "Accept-Language": "da,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Udtræk første telefonnummer fra resultatlisten
    return extractPhoneFromHtml(html);
  } catch {
    return null;
  }
}

// ── 118.dk ────────────────────────────────────────────────────────────────────

async function findPhone118(companyName: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(companyName);
    const url = `https://www.118.dk/search?q=${query}&type=company`;

    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

    if (!res.ok) return null;
    const html = await res.text();
    return extractPhoneFromHtml(html);
  } catch {
    return null;
  }
}

// ── CVR API fallback ──────────────────────────────────────────────────────────

async function findPhoneCVR(companyName: string): Promise<string | null> {
  try {
    const url = `https://cvrapi.dk/api?search=${encodeURIComponent(companyName)}&country=dk`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KrydsByg-LeadFinder/1.0 (kontakt@krydsbyg.com)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { phone?: string };
    return data.phone ? formatPhone(data.phone) : null;
  } catch {
    return null;
  }
}

// ── Samlet phone-finder ────────────────────────────────────────────────────────

/**
 * Finder telefonnummer til ét lead.
 * Prøver Krak → 118.dk → CVR i rækkefølge.
 */
export async function findPhone(c: LeadCandidate): Promise<string | null> {
  if (c.phone) return c.phone; // Allerede har telefon

  // Prøv kun for virksomheder — private og medarbejdere skraber vi ikke telefon på
  if (c.leadType !== "company") return null;

  // 1. Krak.dk
  const krakPhone = await findPhoneKrak(c.companyName, c.city);
  if (krakPhone) return krakPhone;

  await new Promise((r) => setTimeout(r, 200));

  // 2. 118.dk
  const phone118 = await findPhone118(c.companyName);
  if (phone118) return phone118;

  await new Promise((r) => setTimeout(r, 200));

  // 3. CVR API
  const cvrPhone = await findPhoneCVR(c.companyName);
  return cvrPhone;
}

/**
 * Batch telefon-enrichment for leads uden telefon.
 * Sætter max 15 opslag per kørsel for at holde runtime nede.
 */
export async function enrichPhonesBatch(
  candidates: LeadCandidate[],
  { maxEnrich = 15 }: { maxEnrich?: number } = {}
): Promise<LeadCandidate[]> {
  const needsPhone = candidates.filter(
    (c) => !c.phone && c.leadType === "company"
  );
  const hasPhone = candidates.filter(
    (c) => !!c.phone || c.leadType !== "company"
  );

  const toEnrich = needsPhone.slice(0, maxEnrich);
  const skipped = needsPhone.slice(maxEnrich);

  const enriched: LeadCandidate[] = [];

  for (const c of toEnrich) {
    const phone = await findPhone(c);
    enriched.push(phone ? { ...c, phone } : c);
    await new Promise((r) => setTimeout(r, 400));
  }

  return [...hasPhone, ...enriched, ...skipped];
}

// ── Hjælpefunktioner ──────────────────────────────────────────────────────────

function extractPhoneFromHtml(html: string): string | null {
  // Dansk telefonnummer — 8 cifre evt. med mellemrum/bindestreg og +45 prefix
  const raw = html.match(/(?:\+45[\s\-]?)?\b\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}\b/g);
  if (!raw) return null;

  for (const p of raw) {
    const cleaned = p.replace(/[\s\-]/g, "").replace(/^\+45/, "");
    if (cleaned.length === 8 && !cleaned.startsWith("00")) {
      return formatPhone(cleaned);
    }
  }
  return null;
}

function formatPhone(digits: string): string {
  const clean = digits.replace(/\D/g, "").replace(/^45/, "");
  if (clean.length !== 8) return digits;
  return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)}`;
}
