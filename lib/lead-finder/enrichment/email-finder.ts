/**
 * Email Finder — finder emails til leads der mangler dem.
 *
 * Prioriteret rækkefølge:
 *   1. Hunter.io  (kræver HUNTER_API_KEY — gratis tier: 25/md, betalt: $49/md)
 *   2. Apollo.io  (kræver APOLLO_API_KEY — gratis tier: 10/dag, betalt: $49/md)
 *   3. Website-scraper (altid gratis, allerede implementeret)
 *
 * Bruges kun på leads der mangler email — sparer API-kald.
 */

import { scrapeWebsite } from "./website-scraper";
import type { LeadCandidate } from "../types";

// ── Hunter.io ─────────────────────────────────────────────────────────────────

interface HunterEmail {
  value: string;
  type: string;       // "personal" | "generic"
  confidence: number; // 0-100
  first_name?: string;
  last_name?: string;
  position?: string;
}

interface HunterResponse {
  data?: {
    emails?: HunterEmail[];
    organization?: string;
  };
  errors?: Array<{ details: string }>;
}

async function findEmailHunter(domain: string): Promise<string | null> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://api.hunter.io/v2/domain-search` +
      `?domain=${encodeURIComponent(domain)}` +
      `&api_key=${apiKey}` +
      `&limit=5` +
      `&type=personal`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data: HunterResponse = await res.json();
    if (data.errors?.length) return null;

    const emails = data.data?.emails || [];

    // Prioritér: høj confidence + personal type
    const best = emails
      .filter((e) => e.confidence >= 70)
      .sort((a, b) => b.confidence - a.confidence)[0];

    return best?.value || emails[0]?.value || null;
  } catch {
    return null;
  }
}

// ── Apollo.io ─────────────────────────────────────────────────────────────────

interface ApolloOrg {
  primary_email?: string;
  primary_phone?: { number?: string };
}

interface ApolloResponse {
  organization?: ApolloOrg;
  organizations?: ApolloOrg[];
}

async function findEmailApollo(companyName: string, domain?: string): Promise<string | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  try {
    const body: Record<string, unknown> = { q_organization_name: companyName, page: 1, per_page: 1 };
    if (domain) body.q_organization_domains = [domain];

    const res = await fetch("https://api.apollo.io/v1/organizations/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data: ApolloResponse = await res.json();
    const org = data.organization || data.organizations?.[0];
    return org?.primary_email || null;
  } catch {
    return null;
  }
}

// ── Samlet email-finder ────────────────────────────────────────────────────────

/**
 * Forsøger at finde en email til et lead der mangler én.
 * Prøver Hunter.io → Apollo.io → website scraper.
 * Returnerer null hvis ingen email kan findes.
 */
export async function findEmail(c: LeadCandidate): Promise<string | null> {
  if (c.email) return c.email; // Allerede har email

  const domain = extractDomain(c.website) ?? undefined;

  // 1. Hunter.io (bedst til firma-domæner)
  if (domain) {
    const hunterEmail = await findEmailHunter(domain);
    if (hunterEmail) return hunterEmail;
  }

  // 2. Apollo.io (bredere firma-søgning)
  const apolloEmail = await findEmailApollo(c.companyName, domain);
  if (apolloEmail) return apolloEmail;

  // 3. Website-scraper (altid et forsøg værd)
  if (c.website) {
    try {
      const scraped = await scrapeWebsite(c.website);
      if (scraped.emails.length > 0) return scraped.emails[0];
    } catch {
      // Ignorér scraping-fejl
    }
  }

  return null;
}

/**
 * Batch email-finding: finder emails for alle leads der mangler én.
 * Kører med lille pause ml. kald for at undgå rate limits.
 */
export async function enrichEmailsBatch(
  candidates: LeadCandidate[],
  { maxEnrich = 20 }: { maxEnrich?: number } = {}
): Promise<LeadCandidate[]> {
  const needsEmail = candidates.filter((c) => !c.email);
  const hasEmail = candidates.filter((c) => !!c.email);

  // Begræns antal enrichments per kørsel (spar API-kald)
  const toEnrich = needsEmail.slice(0, maxEnrich);
  const skipped = needsEmail.slice(maxEnrich);

  // Kør 5 ad gangen — sparer ~70% tid sammenlignet med sekventielt
  const PARALLEL = 5;
  const enriched: LeadCandidate[] = [];

  for (let i = 0; i < toEnrich.length; i += PARALLEL) {
    const batch = toEnrich.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(
      batch.map(async (c) => {
        const email = await findEmail(c);
        return email ? { ...c, email } : c;
      })
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      enriched.push(r.status === "fulfilled" ? r.value : batch[j]);
    }
  }

  return [...hasEmail, ...enriched, ...skipped];
}

// ── Hjælpefunktioner ──────────────────────────────────────────────────────────

function extractDomain(website?: string): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
