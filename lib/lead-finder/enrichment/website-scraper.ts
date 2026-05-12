/**
 * Website-scraper — finder kontaktinfo fra firmaers hjemmesider.
 *
 * Forsøger:
 *   1. Forsiden + 10 kontakt-side varianter
 *   2. mailto: links (mest pålidelige kilde)
 *   3. JSON-LD struktureret data
 *   4. JavaScript-obfuskerede emails (data-cfemail, encoded)
 *   5. Footer/struktureret tekst
 *   6. Faldback til "kvalificerede gæt" (info@, kontakt@) hvis intet andet virker
 */

export interface WebsiteScrapeResult {
  emails: string[];
  phones: string[];
  contactNames: string[];
  description: string;
  employeeCount?: string;
  emailSource?: "mailto" | "jsonld" | "obfuscated" | "text" | "guess";
}

const EMPTY: WebsiteScrapeResult = { emails: [], phones: [], contactNames: [], description: "" };

// Kontakt-sider — udvidet liste (DK + EN)
const CONTACT_PATHS = [
  "/kontakt", "/contact", "/contact-us", "/kontakt-os",
  "/om-os", "/about-us", "/about", "/om",
  "/team", "/medarbejdere", "/staff", "/folk",
  "/hvem-er-vi", "/hvem", "/info",
  "/impressum", "/footer",
  "/skriv-til-os", "/find-os",
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function scrapeWebsite(websiteUrl: string): Promise<WebsiteScrapeResult> {
  const base = normalizeBase(websiteUrl);
  if (!base) return EMPTY;

  // Hent forside + de første 6 kontakt-sider parallelt (10s timeout pr.)
  const pagesToTry = [base, ...CONTACT_PATHS.slice(0, 6).map((p) => base + p)];
  const htmlPages: string[] = [];

  await Promise.allSettled(
    pagesToTry.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "da,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
          },
          signal: AbortSignal.timeout(8000),
          redirect: "follow",
        });
        if (res.ok) {
          const text = await res.text();
          if (text.length > 100) htmlPages.push(text);
        }
      } catch {
        // Timeout/block - fortsæt
      }
    })
  );

  if (htmlPages.length === 0) return EMPTY;
  const combined = htmlPages.join("\n");

  // ── Email-search i prioriteret rækkefølge ────────────────────────────
  let emails: string[] = [];
  let emailSource: WebsiteScrapeResult["emailSource"] | undefined;

  // 1. mailto: links — mest pålidelige
  const mailtoEmails = extractMailtoEmails(combined);
  if (mailtoEmails.length > 0) {
    emails = mailtoEmails;
    emailSource = "mailto";
  }

  // 2. JSON-LD struktureret data (schema.org)
  if (emails.length === 0) {
    const jsonldEmails = extractJsonLdEmails(combined);
    if (jsonldEmails.length > 0) {
      emails = jsonldEmails;
      emailSource = "jsonld";
    }
  }

  // 3. Cloudflare obfuskerede emails (data-cfemail attribute)
  if (emails.length === 0) {
    const cfEmails = extractCloudflareEmails(combined);
    if (cfEmails.length > 0) {
      emails = cfEmails;
      emailSource = "obfuscated";
    }
  }

  // 4. JS-obfuskerede emails ([at] dot, &#64; etc.)
  if (emails.length === 0) {
    const deobfuscated = extractDeobfuscatedEmails(combined);
    if (deobfuscated.length > 0) {
      emails = deobfuscated;
      emailSource = "obfuscated";
    }
  }

  // 5. Almindelige email-mønstre i HTML-tekst
  if (emails.length === 0) {
    const textEmails = extractEmails(combined);
    if (textEmails.length > 0) {
      emails = textEmails;
      emailSource = "text";
    }
  }

  const phones = extractPhones(combined);
  const contactNames = extractNames(combined);
  const description = extractDescription(htmlPages[0] || "");
  const employeeCount = extractEmployeeHint(combined);

  // 6. Sidste udvej: gæt mønstre på domænet (markeres som "guess")
  if (emails.length === 0) {
    const guessed = await guessEmailsForDomain(base);
    if (guessed.length > 0) {
      return { emails: guessed, phones, contactNames, description, employeeCount, emailSource: "guess" };
    }
  }

  return { emails, phones, contactNames, description, employeeCount, emailSource };
}

// ── Email-extractors (prioriteret rækkefølge) ───────────────────────────

/** mailto: href="mailto:info@firma.dk" — den bedste kilde */
function extractMailtoEmails(html: string): string[] {
  const matches = html.match(/href=["']mailto:([^"'?]+)/gi) || [];
  const emails = matches
    .map((m) => m.replace(/href=["']mailto:/i, "").toLowerCase().trim())
    .map((e) => e.split("?")[0]) // strip ?subject=
    .filter((e) => e.includes("@") && !isJunkEmail(e));
  return [...new Set(emails)].slice(0, 3);
}

/** JSON-LD: <script type="application/ld+json"> { "email": "..." } */
function extractJsonLdEmails(html: string): string[] {
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const emails: string[] = [];
  for (const block of blocks) {
    const jsonText = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
    try {
      const data = JSON.parse(jsonText);
      collectEmailsFromJson(data, emails);
    } catch { /* skip */ }
  }
  return [...new Set(emails.map((e) => e.toLowerCase()).filter((e) => !isJunkEmail(e)))].slice(0, 3);
}

function collectEmailsFromJson(obj: unknown, out: string[]): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((item) => collectEmailsFromJson(item, out));
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key.toLowerCase().includes("email") && typeof value === "string" && value.includes("@")) {
      out.push(value);
    } else if (typeof value === "object") {
      collectEmailsFromJson(value, out);
    }
  }
}

/** Cloudflare email-protection: <a data-cfemail="hex"> */
function extractCloudflareEmails(html: string): string[] {
  const matches = html.match(/data-cfemail=["']([0-9a-f]+)["']/gi) || [];
  const emails = matches.map((m) => {
    const hex = m.match(/[0-9a-f]+/i)?.[0];
    return hex ? decodeCloudflareEmail(hex) : null;
  }).filter((e): e is string => !!e && e.includes("@") && !isJunkEmail(e));
  return [...new Set(emails.map((e) => e.toLowerCase()))].slice(0, 3);
}

function decodeCloudflareEmail(hex: string): string {
  try {
    const key = parseInt(hex.substring(0, 2), 16);
    let email = "";
    for (let i = 2; i < hex.length; i += 2) {
      const charCode = parseInt(hex.substring(i, i + 2), 16) ^ key;
      email += String.fromCharCode(charCode);
    }
    return email;
  } catch {
    return "";
  }
}

/** Anti-bot mønstre: "info [at] firma [dot] dk", "info&#64;firma.dk" */
function extractDeobfuscatedEmails(html: string): string[] {
  const candidates: string[] = [];

  // Pattern: "info [at] firma [dot] dk" eller "info(at)firma(dot)dk"
  const obfPattern = /([a-zA-Z0-9._%+-]+)\s*[\[\(]\s*at\s*[\]\)]\s*([a-zA-Z0-9.-]+)\s*[\[\(]\s*dot\s*[\]\)]\s*([a-zA-Z]{2,6})/gi;
  let m: RegExpExecArray | null;
  while ((m = obfPattern.exec(html)) !== null) {
    candidates.push(`${m[1]}@${m[2]}.${m[3]}`);
  }

  // Pattern: HTML-entities &#64; = @, &#46; = .
  const entityPattern = html.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  const fromEntities = entityPattern.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}/g) || [];
  candidates.push(...fromEntities);

  return [...new Set(candidates.map((e) => e.toLowerCase()).filter((e) => !isJunkEmail(e)))].slice(0, 3);
}

/** Almindelig regex på rå HTML */
function extractEmails(html: string): string[] {
  const raw = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}/g) || [];
  const filtered = raw.map((e) => e.toLowerCase().trim()).filter((e) => !isJunkEmail(e));
  return [...new Set(filtered)].slice(0, 3);
}

function isJunkEmail(email: string): boolean {
  const junk = [
    "@example.", "@test.", "@domain.", "noreply@", "no-reply@",
    "@sentry.", "@wix.", "@wordpress.", "@gravatar.", "cdn@", "assets@",
    "@sentry-next.", "@google.", "@facebook.", "@youtube.", "@twitter.",
    ".png", ".jpg", ".gif", ".svg", ".css", ".js", ".webp",
    "u003e", "u003c", // JSON-escaped HTML
  ];
  if (junk.some((j) => email.includes(j))) return true;
  // Skip extremely long emails (likely false matches)
  if (email.length > 60) return true;
  // Skip emails der starter med tal (sjældent rigtige)
  if (/^\d{3,}/.test(email)) return true;
  return false;
}

async function guessEmailsForDomain(baseUrl: string): Promise<string[]> {
  try {
    const domain = new URL(baseUrl).hostname.replace(/^www\./, "");
    const patterns = [
      `info@${domain}`,
      `kontakt@${domain}`,
      `post@${domain}`,
    ];
    const domainExists = await checkDomainExists(domain);
    if (!domainExists) return [];
    return patterns.slice(0, 3);
  } catch {
    return [];
  }
}

async function checkDomainExists(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${domain}/`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(4000),
      redirect: "follow",
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

function normalizeBase(url: string): string {
  try {
    if (!url.startsWith("http")) url = "https://" + url;
    const u = new URL(url);
    return u.origin;
  } catch {
    return "";
  }
}

function extractPhones(html: string): string[] {
  const raw = html.match(/(?:\+45[\s\-]?)?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}/g) || [];
  const cleaned = raw
    .map((p) => p.replace(/[\s\-]/g, "").replace(/^\+45/, ""))
    .filter((p) => p.length === 8)
    .map((p) => `${p.slice(0, 2)} ${p.slice(2, 4)} ${p.slice(4, 6)} ${p.slice(6, 8)}`);
  return [...new Set(cleaned)].slice(0, 2);
}

function extractNames(html: string): string[] {
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
  const meta = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']{20,300})["']/i);
  if (meta?.[1]) return meta[1].trim();
  const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']{20,300})["']/i);
  if (ogDesc?.[1]) return ogDesc[1].trim();
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const paras = text.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 80);
  return paras[0]?.slice(0, 300) || "";
}

function extractEmployeeHint(html: string): string | undefined {
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
