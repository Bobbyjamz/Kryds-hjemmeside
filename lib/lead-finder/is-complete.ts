/**
 * Komplethedsregel for leads — ÉN kilde til sandhed.
 *
 * Beslutning (juni 2026): email kræves for ALLE lead-typer. Et lead er først
 * "komplet" når det har en gyldig email OG et navn (kontaktperson eller firma).
 * Ufuldstændige leads gemmes aldrig som "New" — de droppes (ved scraping) eller
 * sættes i karantæne med status "Incomplete" (ved backfill).
 */

export interface CompletableLead {
  email?: string | null;
  contactName?: string | null;
  companyName?: string | null;
}

/** Gyldig email: lokal-del + @ + domæne med mindst ét punktum. */
export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Et navn at tiltale leadet med — kontaktperson eller (fallback) firma. */
export function hasName(c: CompletableLead): boolean {
  return Boolean(c.contactName?.trim() || c.companyName?.trim());
}

/** Hård regel: email + navn. Bruges af find-leads, run-leadbot og backfill. */
export function isCompleteLead(c: CompletableLead): boolean {
  return isValidEmail(c.email) && hasName(c);
}
