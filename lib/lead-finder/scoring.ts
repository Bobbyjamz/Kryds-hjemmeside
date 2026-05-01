// Scoring — læser email-hukommelse og bygger industry-weights til lead-finderen.
// Branche-tags der har konverteret til "Sent" emails får højere prioritet i søgningen.

import { readEmailMemory } from "@/lib/db";

export interface IndustryWeights {
  // Map fra branche-keyword (lowercase) → score (0-1, hvor 1 = mest succesfuld branche)
  [keyword: string]: number;
}

/**
 * Læser alle sendte emails fra hukommelsen og udregner relative vægte for hver branche.
 * Branche der dukker op flest gange = højest vægt.
 *
 * Returnerer tomt objekt hvis der ikke er nok data endnu (under 5 mails sendt).
 */
export async function getIndustryWeights(): Promise<IndustryWeights> {
  const memory = await readEmailMemory();

  // Behov for minimum 5 datapunkter før vi begynder at justere
  if (memory.length < 5) return {};

  // Tæl forekomster per industry-tag (normaliseret til lowercase keywords)
  const counts: Record<string, number> = {};
  for (const entry of memory) {
    if (!entry.industry) continue;
    const keywords = extractKeywords(entry.industry);
    for (const kw of keywords) {
      counts[kw] = (counts[kw] || 0) + 1;
    }
  }

  // Normalisér til 0-1 skala
  const max = Math.max(...Object.values(counts), 1);
  const weights: IndustryWeights = {};
  for (const [kw, count] of Object.entries(counts)) {
    weights[kw] = count / max;
  }

  return weights;
}

/**
 * Udtrækker brugbare keywords fra en industry-tekst.
 * F.eks. "Ejendomsadministration og service" → ["ejendomsadministration", "service"]
 */
function extractKeywords(industry: string): string[] {
  return industry
    .toLowerCase()
    .split(/[\s,/&-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 4); // Skip korte stop-ord som "og", "i", "med"
}

/**
 * Sorterer en liste af søgetermer baseret på industry-vægte.
 * Termer der matcher højtprioriterede brancher rykker op i listen.
 */
export function rankSearchTerms(terms: string[], weights: IndustryWeights): string[] {
  if (Object.keys(weights).length === 0) return terms;

  const scored = terms.map((term) => {
    const lower = term.toLowerCase();
    let score = 0;
    for (const [kw, weight] of Object.entries(weights)) {
      if (lower.includes(kw)) score += weight;
    }
    return { term, score };
  });

  // Sortér: højeste score først, men bevar nogle ikke-rangerede så vi ikke kun jager de samme termer
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.term);
}
