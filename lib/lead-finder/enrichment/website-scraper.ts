/**
 * Website scraper — finder kontaktinfo fra firmaers hjemmesider.
 * Forsøger /kontakt, /om-os, /about, /team, sitemap — returnerer hvad der kan udtrækkes.
 * Bygget til at tåle timeouts, 404s og anti-bot beskyttelse uden at kaste errors.
 */

export interface WebsiteScrapeResult {
  emails: string[];
  phones: string[];
  contactNames: string[];    // Navne fundet på /kontakt eller /team
  description: string;       // Første afsnit/meta description — hvad firmaet laver
  employeeCount?: string;    // "15 medarbejdere" eller "siden 1989" — context til Sarah
}

const EMPTY: WebsiteScrapeResult = { emails: [], phones: [], contactNames: [], description: "" };

// Kontakt-sider at prøve i rækkefølge
const CONTACT_PATHS = [
  "/kontakt", "/contact", "/om-os", "/about-us", "/about",
  "/team", "/hvem-er-vi", "/medarbejdere", "/staff",
];

// UA der ligner en rigtig browser
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function scrapeWebsite(websiteUrl: string): Promise<WebsiteScrapeResult> {
  const base = normalizeBase(websiteUrl);
  if (!base) return EMPTY;

  // Samle HTML fra forsiden + /kontakt (parallel)
  const pagesToTry = [base, ...CONTACT_PATHS.slice(0, 3).map((p) => base + p)];

  const htmlPages: string[] = [];
  await Promise.allSettled(
    pagesToTry.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA, "Accept": "text/html", "Accept-Language": "da,en;q=0.9" },
          signal: AbortSignal.timeout(7000),
          redirect: "follow",
        });
        if (res.ok) {
          const text = await res.text();
          htmlPages.push(text);
        }
      } catch {
        // Timeout eller blokeret — fortsæt med andre sider
      }
    })
  );

  if (htmlPages.length === 0) return EMPTY;

  const combined = htmlPages.join("\n");

  return {
    emails: extractEmails(combined),
    phones: extractPhones(combined),
    contactNames: extractNames(combined),
    description: extractDescription(htmlPages[0] || ""),
    employeeCount: extractEmployeeHint(combined),
  };
}

// ── Hjælpefunktioner ──────────────────────────────────────────────────────────

function normalizeBase(url: string): string {
  try {
    if (!url.startsWith("http")) url = "https://" + url;
    const u = new URL(url);
    return u.origin; // f.eks. "https://example.dk"
  } catch {
    return "";
  }
}

function extractEmails(html: string): string[] {
  const raw = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}/g) || [];
  const filtered = raw
    .map((e) => e.toLowerCase().trim())
    .filter((e) => !isJunkEmail(e));
  return [...new Set(filtered)].slice(0, 3); // max 3 unikke emails
}

function isJunkEmail(email: string): boolean {
  const junk = ["@example.", "@test.", "@domain.", "noreply@", "no-reply@",
    "@sentry.", "@wix.", "@wordpress.", "@gravatar.", "cdn@", "assets@",
    ".png", ".jpg", ".gif", ".svg", ".css", ".js"];
  return junk.some((j) => email.includes(j));
}

function extractPhones(html: string): string[] {
  // Dansk format: 8 cifre evt. med mellemrum/bindestreg, gerne med +45
  const raw = html.match(/(?:\+45[\s\-]?)?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}/g) || [];
  const cleaned = raw
    .map((p) => p.replace(/[\s\-]/g, "").replace(/^\+45/, ""))
    .filter((p) => p.length === 8)
    .map((p) => `${p.slice(0, 2)} ${p.slice(2, 4)} ${p.slice(4, 6)} ${p.slice(6, 8)}`);
  return [...new Set(cleaned)].slice(0, 2);
}

function extractNames(html: string): string[] {
  // Leder efter mønstre som "Navn Efternavn\nDirektør" eller "CEO – Navn Efternavn"
  const patterns = [
    /([A-ZÆØÅ][a-zæøå]+\s+[A-ZÆØÅ][a-zæøå]+)\s*(?:<[^>]+>)?\s*(?:direktør|ceo|leder|formand|kontakt|manager|chef|partner)/gi,
    /(?:direktør|ceo|leder|formand|kontakt|manager|chef|partner)[:\s–-]+([A-ZÆØÅ][a-zæøå]+\s+[A-ZÆØÅ][a-zæøå]+)/gi,
  ];

  const names: string[] = [];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(html)) !== null) {
      const name = m[1]?.trim();
      if (name && name.length > 4 && name.length < 40) names.push(name);
    }
  }
  return [...new Set(names)].slice(0, 3);
}

function extractDescription(html: string): string {
  // Meta description er guld
  const meta = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']{20,300})["']/i);
  if (meta?.[1]) return meta[1].trim();

  // Fallback: første store tekst-afsnit (min 80 tegn)
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const paras = text.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 80);
  return paras[0]?.slice(0, 300) || "";
}

function extractEmployeeHint(html: string): string | undefined {
  // "15 medarbejdere", "siden 1985", "over 50 ansatte"
  const patterns = [
    /(\d+)\s+(?:medarbejder|ansat|kollega)/i,
    /siden\s+(\d{4})/i,
    /(?:grundlagt|etableret)\s+(?:i\s+)?(\d{4})/i,
    /over\s+(\d+)\s+(?:medarbejder|ansat)/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[0].trim();
  }
  return undefined;
}
