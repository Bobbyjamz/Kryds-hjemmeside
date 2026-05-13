/**
 * Virksomheds-note template — B2B salgsmail til byggevirksomheder.
 *
 * Tone: Professionel, peer-to-peer, ikke-pushy.
 * Fokus: Vi løser kapacitetsproblemer i travle perioder.
 */

import type { LeadCandidate } from "../../types";
import { getSourceContext } from "../sarah-prompt";

export function buildCompanyNote(c: LeadCandidate, aiAnalysis: string): string {
  const sourceContext = getSourceContext(c.source, "company");

  const lines: string[] = [
    `---SARAH NOTE [VIRKSOMHED]---`,
    `FIRMA: ${c.companyName}`,
  ];

  if (c.cvr) lines.push(`CVR: ${c.cvr}`);
  if (c.contactName) {
    lines.push(`KONTAKT: ${c.contactName}${c.contactTitle ? ` (${c.contactTitle})` : ""}`);
  }
  if (c.email) lines.push(`EMAIL: ${c.email}`);
  if (c.phone) lines.push(`TLF: ${c.phone}`);
  if (c.industry) {
    lines.push(`BRANCHE: ${c.industry}${c.branchekode ? ` (${c.branchekode})` : ""}`);
  }
  if (c.employees) lines.push(`STØRRELSE: ${c.employees} ansatte`);
  if (c.city) lines.push(`REGION: ${c.city}`);
  if (c.website) lines.push(`HJEMMESIDE: ${c.website}`);
  if (c.yearFounded) lines.push(`GRUNDLAGT: ${c.yearFounded}`);
  if (c.score !== undefined) lines.push(`LEAD-SCORE: ${c.score}/100`);
  lines.push(`KILDE: ${c.source}`);
  lines.push(`KONTEKST: ${sourceContext}`);

  lines.push(``, aiAnalysis);

  lines.push(``, `SARAH — SKRIV EN MAIL DER:`);
  lines.push(`  1. Åbner med specifik reference til virksomhedens branche/aktivitet`);
  lines.push(`  2. Præsenterer KrydsByg som peer-bureau (bemanding til byggeri på Sjælland)`);
  lines.push(`  3. Nævner ÉN konkret fordel: vi håndterer løn, forsikring, HR — de skal bare bruge folk`);
  lines.push(`  4. Slutter med invitation til 15-min snak om deres kapacitetsbehov`);
  lines.push(``);
  lines.push(`TONE: Professionel, peer-to-peer, ikke-pushy`);
  lines.push(`MAKS: 120 ord`);
  lines.push(``);
  lines.push(`HILSEN: "Hej ${c.contactName?.split(" ")[0] || `${c.companyName}-team`},"`);
  lines.push(`AFSLUTNING: "Med venlig hilsen,"`);
  lines.push(`---`);

  return lines.join("\n");
}

// ── Fallback ─────────────────────────────────────────────────────────────────

export function buildCompanyFallbackAnalysis(c: LeadCandidate): string {
  const bullets: string[] = [];

  if (c.source.includes("Jobindex") || c.source.includes("Jobnet")) {
    bullets.push("- Aktiv rekruttering = klar kapacitetssignal");
  }
  if (c.employees) {
    bullets.push(`- ${c.employees} ansatte — passer til KrydsByg's B2B-model`);
  }
  if (c.yearFounded) {
    const age = new Date().getFullYear() - c.yearFounded;
    if (age >= 3) bullets.push(`- Etableret siden ${c.yearFounded} (${age} år) — stabil prospekt`);
  }
  if (c.city) {
    bullets.push(`- Placeret i ${c.city} — inden for KrydsByg's primærzone`);
  }
  if (c.industry && c.branchekode?.startsWith("43")) {
    bullets.push(`- Bygge/anlæg-branche — direkte fagligt match`);
  }
  if (!c.email) bullets.push("- Mangler email — tilføj manuelt inden Sarah kører");
  if (bullets.length === 0) bullets.push("- Relevant virksomhed i KrydsByg's målgruppe");

  return [
    "KVALIFIKATION:",
    bullets.join("\n"),
    "",
    "DECISION-MAKER:",
    `- ${c.contactTitle || "Direktør / ejer"}`,
    "",
    "TIMING:",
    "- Hverdage 9-11 (mest svarende tidspunkt for B2B)",
    "",
    "BEDSTE TILGANG:",
    "- Email først, opkald som follow-up efter 2 dage",
    "",
    "VINKEL TIL BREV:",
    `- ${c.serviceType ? `Konkret tilbud om ${c.serviceType.toLowerCase()}` : "Fleksibel kapacitet uden HR-besvær"}`,
  ].join("\n");
}
