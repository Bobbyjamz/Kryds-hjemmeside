// Kryds — Sarah email-skabeloner
// Tre cold-outreach skabeloner: Virksomhed (B2B), Privatperson, Medarbejder-hunting
// Designet matcher KrydsMailSkabelon.html — paper/ink/mustard farveskala, table-baseret HTML
// klar til Gmail/Outlook/Apple Mail.

const TPL_STYLES = {
  paper: "#faf7f0",
  ink: "#151311",
  inkSoft: "#2a2622",
  mustard: "#c69920",
  mustardDeep: "#a07d16",
  line: "#d8cfbd",
  muted: "#8a7f6a",
  cream: "#f0ebe0",
} as const;

const KRYDS_PHONE_DISPLAY = "+45 42 77 88 66";
const KRYDS_PHONE_TEL = "+4542778866";
const KRYDS_EMAIL = "Kontakt@KrydsByg.com";
const KRYDS_WEB = "krydsbyg.com";
const SARAH_NAME = "Sarah Møller";
const KRYSTIAN_NAME = "Krystian Balasz";

// ── Header (gentages i alle 3 skabeloner) ────────────────────────────────

function tplHeader(): string {
  const s = TPL_STYLES;
  return `
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:28px;border-bottom:1px solid ${s.line};padding-bottom:16px;">
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:900;letter-spacing:1px;color:${s.ink};">
      <span style="color:${s.mustard};">✕</span>&nbsp; KRYDS
    </td>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${s.muted};text-align:right;">
      KØBENHAVN
    </td>
  </tr>
</table>`;
}

// ── Signatur ─────────────────────────────────────────────────────────────

function tplSignature(): string {
  const s = TPL_STYLES;
  return `
<p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${s.inkSoft};">De bedste hilsner,</p>
<p style="margin:0 0 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:${s.ink};">${SARAH_NAME}</p>
<p style="margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${s.muted};">Kryds · på vegne af ${KRYSTIAN_NAME}</p>
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:16px;padding-top:18px;border-top:1px solid ${s.line};">
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${s.ink};">
      <a href="tel:${KRYDS_PHONE_TEL}" style="color:${s.ink};text-decoration:none;">${KRYDS_PHONE_DISPLAY}</a><br>
      <a href="mailto:${KRYDS_EMAIL}" style="color:${s.ink};text-decoration:none;">${KRYDS_EMAIL}</a>
    </td>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;text-align:right;">
      <a href="https://${KRYDS_WEB}" style="color:${s.mustard};text-decoration:none;font-weight:bold;">${KRYDS_WEB} →</a>
    </td>
  </tr>
</table>`;
}

// ── Wrap brødtekst i fuld mail ───────────────────────────────────────────

function wrapTpl(body: string): string {
  const s = TPL_STYLES;
  return `<div style="max-width:640px;margin:0 auto;background:${s.paper};padding:40px 44px;font-family:Arial,Helvetica,sans-serif;color:${s.ink};">
${tplHeader()}
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${s.inkSoft};">
${body}
${tplSignature()}
</div>
</div>`;
}

// ── Skabelon-typer ───────────────────────────────────────────────────────

export type SarahTemplateKey = "virksomhed" | "privat" | "medarbejder";

export interface SarahTemplateFields {
  modtagerNavn: string;
  // Virksomhed
  virksomhed?: string;
  // Privat
  adresse?: string;
  opgave?: string;
  // Medarbejder
  fag?: string;
  hvorFundet?: string;
  // Fælles tidsforslag
  tid1?: string;
  tid2?: string;
  // Personlig note (1 sætning Sarah fletter ind så mailen ikke føles AI-genereret)
  personalNote?: string;
}

export interface SarahTemplate {
  label: string;
  description: string;
  defaults: Partial<SarahTemplateFields>;
  buildSubject: (fields: SarahTemplateFields) => string;
  buildHTML: (fields: SarahTemplateFields) => string;
  buildText: (fields: SarahTemplateFields) => string;
}

// Hjælpere — escape HTML i bruger-input
function esc(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── 1. Virksomhed (cold B2B) ─────────────────────────────────────────────

// Kort, direkte, menneskelig.
// Ingen "Jeg faldt over X" — det signalerer scraping og sænker svarrate.
// Struktur: hilsen → hook/personal → pitch (1 sætning) → tilbud → CTA
const virksomhedTemplate: SarahTemplate = {
  label: "Virksomhed (cold)",
  description: "Byggefirmaer, entreprenører, projektledere. De kender os ikke.",
  defaults: {
    modtagerNavn: "[Navn]",
    virksomhed: "",
    tid1: "I de kommende 2 uger",
    tid2: "eller ugen efter hvis det passer bedre",
  },
  buildSubject: (f) => {
    if (f.virksomhed) return `${f.virksomhed} — håndværkere på 24 timer?`;
    return `Håndværkere på kort varsel til næste projekt?`;
  },
  buildHTML: (f) => {
    const s = TPL_STYLES;
    const navn = esc(f.modtagerNavn || "[Navn]");
    const virk = f.virksomhed ? esc(f.virksomhed) : "";
    const tid1 = esc(f.tid1 || "I de kommende 2 uger");
    const tid2 = esc(f.tid2 || "eller ugen efter hvis det passer bedre");
    // personalNote er første prioritet — gør mailen menneskelig
    // Ellers åbner vi med firmanavn eller direkte pitch
    const hookLine = f.personalNote
      ? `<p style="margin:0 0 16px 0;">${esc(f.personalNote)}</p>\n`
      : virk
      ? `<p style="margin:0 0 16px 0;">Jeg har kigget lidt på <strong style="color:${s.ink};">${virk}</strong> og tror I måske kan bruge det her.</p>\n`
      : "";
    return wrapTpl(`
<p style="margin:0 0 16px 0;">Hej ${navn},</p>
${hookLine}<p style="margin:0 0 16px 0;">Sarah fra <strong style="color:${s.ink};">Kryds</strong>. Vi leverer screenede håndværkere og byggepersonale i Storkøbenhavn på 24 timer — malere, handymen, gartnere og byggepladshjælp. Over 75 folk i netværket, I betaler kun for udført arbejde.</p>
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;background:${s.cream};border-left:3px solid ${s.mustard};">
  <tr>
    <td style="padding:14px 18px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;color:${s.mustardDeep};text-transform:uppercase;font-weight:bold;margin-bottom:6px;">FORSLAG</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${s.ink};">Er der et projekt på vej hvor I kunne bruge ekstra hænder? <strong>15 minutter</strong> ${tid1}, ${tid2}?</div>
    </td>
  </tr>
</table>
<p style="margin:0 0 24px 0;font-style:italic;color:${s.muted};font-size:14px;">Vi giver kaffen.</p>
`);
  },
  buildText: (f) => {
    const navn = f.modtagerNavn || "[Navn]";
    const virk = f.virksomhed || "";
    const tid1 = f.tid1 || "I de kommende 2 uger";
    const tid2 = f.tid2 || "eller ugen efter hvis det passer bedre";
    const hookLine = f.personalNote
      ? `${f.personalNote}\n\n`
      : virk
      ? `Jeg har kigget lidt på ${virk} og tror I måske kan bruge det her.\n\n`
      : "";
    return `Hej ${navn},

${hookLine}Sarah fra Kryds. Vi leverer screenede håndværkere og byggepersonale i Storkøbenhavn på 24 timer — malere, handymen, gartnere og byggepladshjælp. Over 75 folk i netværket, I betaler kun for udført arbejde.

Er der et projekt på vej hvor I kunne bruge ekstra hænder? 15 minutter ${tid1}, ${tid2}?

Vi giver kaffen.

De bedste hilsner,
${SARAH_NAME}
Kryds · på vegne af ${KRYSTIAN_NAME}

${KRYDS_PHONE_DISPLAY}
${KRYDS_EMAIL}
${KRYDS_WEB}`;
  },
};

// ── 2. Privatperson (cold) ───────────────────────────────────────────────

const privatTemplate: SarahTemplate = {
  label: "Privatperson (cold)",
  description: "Private boligejere. Vi har fundet dem, de kender os ikke.",
  defaults: {
    modtagerNavn: "[Fornavn]",
    adresse: "",
    opgave: "maling, havearbejde eller lidt montering",
    tid1: "I de kommende 2 uger",
    tid2: "eller ugen efter",
  },
  buildSubject: () => "Lille opgave hjemme? · Kryds",
  buildHTML: (f) => {
    const s = TPL_STYLES;
    const navn = esc(f.modtagerNavn || "[Fornavn]");
    const sted = f.adresse ? ` på ${esc(f.adresse)}` : "";
    const opgave = esc(f.opgave || "maling, havearbejde eller lidt montering");
    const tid1 = esc(f.tid1 || "I de kommende 2 uger");
    const tid2 = esc(f.tid2 || "eller ugen efter");
    const personalLine = f.personalNote ? `<p style="margin:0 0 16px 0;">${esc(f.personalNote)}</p>\n` : "";
    return wrapTpl(`
<p style="margin:0 0 16px 0;">Hej ${navn},</p>
<p style="margin:0 0 16px 0;">Sarah her fra <strong style="color:${s.ink};">Kryds</strong>. Vi er et lille vikarbureau i København, der hjælper boligejere${sted} med de praktiske ting, man ikke selv når. Det kan være ${opgave}, oprydning eller mindre håndværk.</p>
${personalLine}<p style="margin:0 0 16px 0;">Vi kender ikke hinanden endnu, og jeg ved godt, det er en kold mail. Men hvis du har en lille opgave liggende derhjemme, du gerne vil have væk fra to-do-listen, er det et fint sted at teste os af. Du betaler kun for udført arbejde, og du får en klar pris på forhånd.</p>
<p style="margin:0 0 22px 0;">Må jeg invitere dig på en kort kop kaffe et par uger ude i kalenderen? 20 minutter, så du får et ansigt på os og kan vurdere, om Kryds kunne være relevant for dig.</p>
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;background:${s.cream};border-left:3px solid ${s.mustard};">
  <tr>
    <td style="padding:14px 18px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;color:${s.mustardDeep};text-transform:uppercase;font-weight:bold;margin-bottom:6px;">FORSLAG</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${s.ink};"><strong>${tid1}</strong>, ${tid2}. Sig til hvad der passer dig, så finder vi et sted i nærheden.</div>
    </td>
  </tr>
</table>
<p style="margin:0 0 24px 0;font-style:italic;color:${s.muted};font-size:14px;">Vi giver kaffen. Siger du nej tak, hører du ikke fra os igen.</p>
`);
  },
  buildText: (f) => {
    const navn = f.modtagerNavn || "[Fornavn]";
    const sted = f.adresse ? ` på ${f.adresse}` : "";
    const opgave = f.opgave || "maling, havearbejde eller lidt montering";
    const tid1 = f.tid1 || "I de kommende 2 uger";
    const tid2 = f.tid2 || "eller ugen efter";
    const personalLine = f.personalNote ? `${f.personalNote}\n\n` : "";
    return `Hej ${navn},

Sarah her fra Kryds. Vi er et lille vikarbureau i København, der hjælper boligejere${sted} med de praktiske ting, man ikke selv når. Det kan være ${opgave}, oprydning eller mindre håndværk.

${personalLine}Vi kender ikke hinanden endnu, og jeg ved godt, det er en kold mail. Men hvis du har en lille opgave liggende derhjemme, du gerne vil have væk fra to-do-listen, er det et fint sted at teste os af. Du betaler kun for udført arbejde, og du får en klar pris på forhånd.

Må jeg invitere dig på en kort kop kaffe et par uger ude i kalenderen? 20 minutter, så du får et ansigt på os og kan vurdere, om Kryds kunne være relevant for dig.

FORSLAG: ${tid1}, ${tid2}. Sig til hvad der passer dig, så finder vi et sted i nærheden.

Vi giver kaffen. Siger du nej tak, hører du ikke fra os igen.

De bedste hilsner,
${SARAH_NAME}
Kryds · på vegne af ${KRYSTIAN_NAME}

${KRYDS_PHONE_DISPLAY}
${KRYDS_EMAIL}
${KRYDS_WEB}`;
  },
};

// ── 3. Medarbejder-hunting (cold) ────────────────────────────────────────

const medarbejderTemplate: SarahTemplate = {
  label: "Medarbejder-hunting (cold)",
  description: "Håndværkere vi vil rekruttere: maler, handyman, gartner osv.",
  defaults: {
    modtagerNavn: "[Fornavn]",
    fag: "håndværker",
    hvorFundet: "din profil",
    tid1: "I de kommende 2 uger",
    tid2: "eller ugen efter",
  },
  buildSubject: (f) => {
    const fag = f.fag ? ` til ${f.fag}` : "";
    return `Kort snak om opgaver i KBH?${fag} · Kryds`;
  },
  buildHTML: (f) => {
    const s = TPL_STYLES;
    const navn = esc(f.modtagerNavn || "[Fornavn]");
    const fag = esc(f.fag || "håndværkere");
    const hvor = esc(f.hvorFundet || "din profil");
    const tid1 = esc(f.tid1 || "I de kommende 2 uger");
    const tid2 = esc(f.tid2 || "eller ugen efter");
    const personalLine = f.personalNote ? `<p style="margin:0 0 16px 0;">${esc(f.personalNote)}</p>\n` : "";
    return wrapTpl(`
<p style="margin:0 0 16px 0;">Hej ${navn},</p>
<p style="margin:0 0 16px 0;">Sarah her fra <strong style="color:${s.ink};">Kryds</strong>. Vi er et vikarbureau til byggeprojekter i København, og lige nu er vi lidt over 75 folk i netværket: malere, handymen, gartnere, montering og lignende. Vi faldt over ${hvor} og blev nysgerrige.</p>
${personalLine}<p style="margin:0 0 16px 0;">Vi har løbende brug for dygtige ${fag} til vores opgaver i København. Det kan være enkelte dage eller hele projekter, alt efter hvad der passer dig. Klare aftaler, fair løn, og ingen bureaukratisk vikarbureau-følelse.</p>
<p style="margin:0 0 22px 0;">Du kender os ikke endnu, og det er helt fair. Men har du lyst til en uformel kop kaffe et par uger ude, så vi kan få en snak om, hvad du går og laver, og om Kryds kunne være noget for dig? Ellers er du altid velkommen til at læse mere på <a href="https://${KRYDS_WEB}" style="color:${s.mustardDeep};text-decoration:none;font-weight:bold;">${KRYDS_WEB}</a> og tilmelde dig direkte der.</p>
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;background:${s.cream};border-left:3px solid ${s.mustard};">
  <tr>
    <td style="padding:14px 18px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;color:${s.mustardDeep};text-transform:uppercase;font-weight:bold;margin-bottom:6px;">FORSLAG</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${s.ink};"><strong>${tid1}</strong>, ${tid2}. Sig til, så finder vi et sted tæt på dig.</div>
    </td>
  </tr>
</table>
<p style="margin:0 0 24px 0;font-style:italic;color:${s.muted};font-size:14px;">Vi giver kaffen, og en ærlig snak om løn og vilkår.</p>
`);
  },
  buildText: (f) => {
    const navn = f.modtagerNavn || "[Fornavn]";
    const fag = f.fag || "håndværkere";
    const hvor = f.hvorFundet || "din profil";
    const tid1 = f.tid1 || "I de kommende 2 uger";
    const tid2 = f.tid2 || "eller ugen efter";
    const personalLine = f.personalNote ? `${f.personalNote}\n\n` : "";
    return `Hej ${navn},

Sarah her fra Kryds. Vi er et vikarbureau til byggeprojekter i København, og lige nu er vi lidt over 75 folk i netværket: malere, handymen, gartnere, montering og lignende. Vi faldt over ${hvor} og blev nysgerrige.

${personalLine}Vi har løbende brug for dygtige ${fag} til vores opgaver i København. Det kan være enkelte dage eller hele projekter, alt efter hvad der passer dig. Klare aftaler, fair løn, og ingen bureaukratisk vikarbureau-følelse.

Du kender os ikke endnu, og det er helt fair. Men har du lyst til en uformel kop kaffe et par uger ude, så vi kan få en snak om, hvad du går og laver, og om Kryds kunne være noget for dig? Ellers er du altid velkommen til at læse mere på ${KRYDS_WEB} og tilmelde dig direkte der.

FORSLAG: ${tid1}, ${tid2}. Sig til, så finder vi et sted tæt på dig.

Vi giver kaffen, og en ærlig snak om løn og vilkår.

De bedste hilsner,
${SARAH_NAME}
Kryds · på vegne af ${KRYSTIAN_NAME}

${KRYDS_PHONE_DISPLAY}
${KRYDS_EMAIL}
${KRYDS_WEB}`;
  },
};

// ── Eksport ──────────────────────────────────────────────────────────────

export const SARAH_TEMPLATES: Record<SarahTemplateKey, SarahTemplate> = {
  virksomhed: virksomhedTemplate,
  privat: privatTemplate,
  medarbejder: medarbejderTemplate,
};

// ── Opfølgnings-emails (kortere, forskelligt indhold) ────────────────────
// Bug-fix: tidligere sendte follow-ups samme indhold som original.
// Dag 4: kort reminder, lav friktion.
// Dag 9: "permission to close" — denne email får ofte svar fordi modtager
//        føler sig tryg ved at sige nej, og nogle siger ja alligevel.

export function buildFollowupEmail(contact: {
  name: string;
  company: string;
  type: "medarbejder" | "partner" | "privat";
}): { subject: string; html: string; text: string } {
  const fornavn = contact.name?.split(" ")[0] || contact.name || "";
  const virk = contact.company || "";
  const s = TPL_STYLES;

  const isRekruttering = contact.type === "medarbejder";
  const subject = isRekruttering
    ? `Re: Kort snak om opgaver i KBH?`
    : virk
    ? `Re: ${virk} — håndværkere på 24 timer?`
    : `Re: Håndværkere på kort varsel?`;

  const bodyHTML = isRekruttering
    ? `<p style="margin:0 0 16px 0;">Hej ${esc(fornavn)},</p>
<p style="margin:0 0 16px 0;">Sendte dig en mail forrige uge om opgaver i København.</p>
<p style="margin:0 0 16px 0;">Bare en hurtig opfølgning — er du åben for lidt ekstra arbejde i perioder? Det er ingen binding, du vælger selv hvornår du er tilgængelig.</p>
<p style="margin:0 0 24px 0;">Svar gerne med et ja eller nej, så respekterer vi det.</p>`
    : `<p style="margin:0 0 16px 0;">Hej ${esc(fornavn)},</p>
<p style="margin:0 0 16px 0;">Sendte dig en mail forrige uge om håndværkere på kort varsel.</p>
<p style="margin:0 0 16px 0;">Bare en hurtig opfølgning — har I projekter på vej hvor I kunne bruge ekstra folk? Ellers er det helt OK, det var bare et forsøg.</p>
<p style="margin:0 0 24px 0;">15 minutter er nok hvis det er relevant for jer.</p>`;

  const bodyText = isRekruttering
    ? `Hej ${fornavn},

Sendte dig en mail forrige uge om opgaver i København.

Bare en hurtig opfølgning — er du åben for lidt ekstra arbejde i perioder? Det er ingen binding, du vælger selv hvornår du er tilgængelig.

Svar gerne med et ja eller nej, så respekterer vi det.`
    : `Hej ${fornavn},

Sendte dig en mail forrige uge om håndværkere på kort varsel.

Bare en hurtig opfølgning — har I projekter på vej hvor I kunne bruge ekstra folk? Ellers er det helt OK.

15 minutter er nok hvis det er relevant for jer.`;

  return {
    subject,
    html: wrapTpl(`${bodyHTML}${tplSignature()}`),
    text: `${bodyText}\n\nDe bedste hilsner,\n${SARAH_NAME}\nKryds · på vegne af ${KRYSTIAN_NAME}\n\n${KRYDS_PHONE_DISPLAY}\n${KRYDS_EMAIL}\n${KRYDS_WEB}`,
  };
}

export function buildFinalEmail(contact: {
  name: string;
  company: string;
  type: "medarbejder" | "partner" | "privat";
}): { subject: string; html: string; text: string } {
  const fornavn = contact.name?.split(" ")[0] || contact.name || "";
  const virk = contact.company || "";
  const s = TPL_STYLES;

  const isRekruttering = contact.type === "medarbejder";
  const subject = isRekruttering
    ? `Sidst fra os — opgaver i KBH`
    : virk
    ? `Sidst fra os, ${virk}`
    : `Sidst fra os`;

  const bodyHTML = isRekruttering
    ? `<p style="margin:0 0 16px 0;">Hej ${esc(fornavn)},</p>
<p style="margin:0 0 16px 0;">Sidst fra os — vil ikke spilde din tid.</p>
<p style="margin:0 0 16px 0;">Hvis du nogensinde er interesseret i opgaver i København: skriv til <a href="mailto:${KRYDS_EMAIL}" style="color:${s.mustardDeep};">${KRYDS_EMAIL}</a> eller tilmeld dig på <a href="https://${KRYDS_WEB}" style="color:${s.mustardDeep};">${KRYDS_WEB}</a>.</p>
<p style="margin:0 0 24px 0;">Pas godt på dig selv.</p>`
    : `<p style="margin:0 0 16px 0;">Hej ${esc(fornavn)},</p>
<p style="margin:0 0 16px 0;">Sidst fra os — vil ikke spilde din tid yderligere.</p>
<p style="margin:0 0 16px 0;">Hvis I nogensinde mangler folk til et projekt: vi har håndværkere klar på 24 timer. Ring på <a href="tel:${KRYDS_PHONE_TEL}" style="color:${s.mustardDeep};">${KRYDS_PHONE_DISPLAY}</a> eller skriv til <a href="mailto:${KRYDS_EMAIL}" style="color:${s.mustardDeep};">${KRYDS_EMAIL}</a>.</p>
<p style="margin:0 0 24px 0;font-style:italic;color:${s.muted};font-size:14px;">Held og lykke med projekterne.</p>`;

  const bodyText = isRekruttering
    ? `Hej ${fornavn},

Sidst fra os — vil ikke spilde din tid.

Hvis du nogensinde er interesseret i opgaver i København: skriv til ${KRYDS_EMAIL} eller tilmeld dig på ${KRYDS_WEB}.

Pas godt på dig selv.`
    : `Hej ${fornavn},

Sidst fra os — vil ikke spilde din tid yderligere.

Hvis I nogensinde mangler folk til et projekt: vi har håndværkere klar på 24 timer.
Ring: ${KRYDS_PHONE_DISPLAY} eller skriv: ${KRYDS_EMAIL}

Held og lykke med projekterne.`;

  return {
    subject,
    html: wrapTpl(`${bodyHTML}${tplSignature()}`),
    text: `${bodyText}\n\nDe bedste hilsner,\n${SARAH_NAME}\nKryds · på vegne af ${KRYSTIAN_NAME}\n\n${KRYDS_PHONE_DISPLAY}\n${KRYDS_EMAIL}\n${KRYDS_WEB}`,
  };
}

/**
 * Bygger en email fra contact-typen. Bruges af Sarah's run-route.
 * Auto-vælger skabelon baseret på contact.type:
 *   - "partner"     → virksomhed
 *   - "privat"      → privat
 *   - "medarbejder" → medarbejder
 */
export function buildEmailFromContact(contact: {
  name: string;
  company: string;
  trade: string;
  type: "medarbejder" | "partner" | "privat";
  notes?: string;
}): { subject: string; html: string; text: string; templateKey: SarahTemplateKey } {
  const templateKey: SarahTemplateKey =
    contact.type === "partner" ? "virksomhed" : contact.type;

  const tpl = SARAH_TEMPLATES[templateKey];

  const fields: SarahTemplateFields = {
    modtagerNavn: contact.name?.split(" ")[0] || contact.name || "",
    virksomhed: contact.company || undefined,
    fag: contact.trade || undefined,
    hvorFundet: contact.trade ? `din profil` : undefined,
    // notes-feltet bliver til den personlige sætning Sarah fletter ind i mailen
    personalNote: contact.notes?.trim() || undefined,
  };

  return {
    subject: tpl.buildSubject(fields),
    html: tpl.buildHTML(fields),
    text: tpl.buildText(fields),
    templateKey,
  };
}
