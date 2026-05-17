import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminSession } from "@/lib/auth";
import { readTilbud, writeTilbud, generateId } from "@/lib/db";
import { getCouncilAdviceForTilbud } from "@/lib/council";
import type { Tilbud } from "@/lib/types";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY ?? "not-configured");
const FROM = process.env.RESEND_FROM ?? "KrydsByg <kontakt@krydsbyg.com>";
const VAT = 0.25;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readTilbud());
}

// POST — opret nyt tilbud med Council-rådgivning
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientName, clientEmail, taskDescription, trade, estimatedHours, location } =
    await req.json();

  if (!taskDescription || !clientName) {
    return NextResponse.json({ error: "Beskrivelse og kundenavn er påkrævet" }, { status: 400 });
  }

  const advice = await getCouncilAdviceForTilbud({
    description: taskDescription,
    trade: trade ?? "byggeri",
    hours: Number(estimatedHours) || 8,
    location: location ?? "København",
  });

  const hours = Number(estimatedHours) || 8;
  const rate = advice.hourlyRate || 450;
  const materials = advice.materialsCost || 0;
  const totalExVat = hours * rate + materials;
  const totalIncVat = Math.round(totalExVat * (1 + VAT));

  const tilbud: Tilbud = {
    id: generateId(),
    clientName,
    clientEmail: clientEmail ?? "",
    taskDescription,
    trade: trade ?? "",
    estimatedHours: hours,
    hourlyRate: rate,
    materialsCost: materials,
    totalExVat,
    totalIncVat,
    councilNotes: advice.pricingAdvice,
    generatedText: advice.emailText,
    status: "draft",
    validDays: 14,
    createdAt: new Date().toISOString(),
  };

  const all = await readTilbud();
  all.unshift(tilbud);
  await writeTilbud(all);

  return NextResponse.json({ ok: true, tilbud });
}

// PATCH — send tilbud til kunde via email
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, ...updates } = await req.json();
  const all = await readTilbud();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });

  if (action === "send") {
    const t = all[idx];
    if (!t.clientEmail) return NextResponse.json({ error: "Ingen klient-email" }, { status: 400 });

    const subject = `Tilbud fra KrydsByg — ${t.taskDescription.slice(0, 50)}`;
    const body = t.generatedText ?? `Hermed vores tilbud.\n\nTotal inkl. moms: ${t.totalIncVat.toLocaleString("da-DK")} kr.\n\nGyldig i ${t.validDays} dage.\n\nKrystian Balasz · KrydsByg ApS · krydsbyg.com`;

    await resend.emails.send({
      from: FROM,
      to: [t.clientEmail],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <div style="background:#F5C400;padding:10px 18px;margin-bottom:24px;">
          <p style="margin:0;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#0C0C0A;">✕ KRYDSBYG</p>
        </div>
        <div style="color:#222;font-size:15px;line-height:1.6;white-space:pre-wrap;">${body}</div>
        <div style="margin-top:24px;background:#f9f9f9;padding:16px;border-radius:8px;font-size:14px;">
          <strong>Opgave:</strong> ${t.taskDescription}<br>
          <strong>Timer:</strong> ${t.estimatedHours} timer × ${t.hourlyRate} kr/t<br>
          <strong>Materialer:</strong> ${t.materialsCost.toLocaleString("da-DK")} kr<br>
          <strong>Total ekskl. moms:</strong> ${t.totalExVat.toLocaleString("da-DK")} kr<br>
          <strong>Total inkl. moms:</strong> ${t.totalIncVat.toLocaleString("da-DK")} kr<br>
          <strong>Gyldigt:</strong> ${t.validDays} dage
        </div>
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;color:#888;font-size:12px;">
          KrydsByg ApS · CVR: 46369947 · kontakt@krydsbyg.com · krydsbyg.com
        </div>
      </div>`,
      text: body,
    });

    all[idx] = { ...t, status: "sent", sentAt: new Date().toISOString() };
  } else {
    all[idx] = { ...all[idx], ...updates };
  }

  await writeTilbud(all);
  return NextResponse.json({ ok: true, tilbud: all[idx] });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const all = await readTilbud();
  await writeTilbud(all.filter((t) => t.id !== id));
  return NextResponse.json({ ok: true });
}