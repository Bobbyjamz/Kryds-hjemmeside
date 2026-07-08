import { NextRequest, NextResponse } from "next/server";
import { readSarahContacts, writeSarahContacts } from "@/lib/db";
import { blokerEmail } from "@/lib/outreach/suppression";
import { verificerToken } from "@/lib/outreach/unsubscribe";

export const runtime = "nodejs";

async function unsubscribe(email: string): Promise<boolean> {
  if (!email) return false;
  await blokerEmail(email, "afmeld-klik"); // global — daekker OGSAA leads-verdenen
  const contacts = await readSarahContacts();
  let changed = false;
  const updated = contacts.map((c) => {
    if (c.email.toLowerCase() === email.toLowerCase() && c.status !== "unsubscribed") {
      changed = true;
      return { ...c, status: "unsubscribed" as const };
    }
    return c;
  });
  if (changed) await writeSarahContacts(updated);
  return changed;
}

// Gmail/Yahoo One-Click (RFC 8058): POST udloeser afmelding uden brugerklik
export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  // One-click (RFC 8058) poster til praecis den URL vi satte i headeren — inkl. token.
  // Form-fallback fra GET-siden poster ogsaa hertil. Ugyldig token afvises.
  if (!verificerToken(email, token)) {
    return NextResponse.json({ ok: false, error: "ugyldigt link" }, { status: 400 });
  }
  await unsubscribe(email);
  return NextResponse.json({ ok: true });
}

// Browser-fallback: viser en branded bekraeftelsesside
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";

  // Gyldig token (eller ingen UNSUB_SECRET sat): afmeld direkte.
  // Ugyldig/manglende token: vis bekraeftelses-knap i stedet — saa kan
  // link-scannere og gaette-URL'er ikke masse-afmelde vores leads via GET.
  if (!verificerToken(email, token)) {
    const bekraeftHtml = `<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bekraeft afmelding - KrydsByg</title>
  <style>
    body { margin:0; background:#0a0a0a; color:#f5f5f0; font-family:system-ui,-apple-system,sans-serif; display:flex; min-height:100vh; align-items:center; justify-content:center; }
    .card { max-width:420px; padding:40px 32px; text-align:center; }
    .mark { color:#F5C400; font-weight:800; letter-spacing:.5px; font-size:14px; text-transform:uppercase; }
    h1 { font-size:24px; margin:16px 0 8px; }
    p { color:#9a9a92; line-height:1.5; font-size:15px; }
    button { margin-top:16px; background:#F5C400; color:#0a0a0a; border:0; padding:12px 28px; font-size:15px; font-weight:700; border-radius:6px; cursor:pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="mark">KrydsByg</div>
    <h1>Bekraeft afmelding</h1>
    <p>Klik for at afmelde ${email ? email.replace(/[<>&"]/g, "") : "denne adresse"} — saa hoerer du ikke fra os igen.</p>
    <form method="POST" action="/afmeld?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}">
      <button type="submit">Afmeld mig</button>
    </form>
  </div>
</body>
</html>`;
    return new NextResponse(bekraeftHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  await unsubscribe(email);
  const html = `<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Afmeldt - KrydsByg</title>
  <style>
    body { margin:0; background:#0a0a0a; color:#f5f5f0; font-family:system-ui,-apple-system,sans-serif; display:flex; min-height:100vh; align-items:center; justify-content:center; }
    .card { max-width:420px; padding:40px 32px; text-align:center; }
    .mark { color:#F5C400; font-weight:800; letter-spacing:.5px; font-size:14px; text-transform:uppercase; }
    h1 { font-size:24px; margin:16px 0 8px; }
    p { color:#9a9a92; line-height:1.5; font-size:15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="mark">KrydsByg</div>
    <h1>Du er afmeldt</h1>
    <p>Vi sender ikke flere mails til ${email ? email.replace(/[<>&"]/g, "") : "denne adresse"}. Tak fordi du gav besked.</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}