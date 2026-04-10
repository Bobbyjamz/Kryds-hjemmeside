import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { readEmployees, writeEmployees, generateId } from "@/lib/db";
import { CONTRACT_VERSION } from "@/lib/contract";
import type { Employee, Reference } from "@/lib/types";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      birthDate,
      trade,
      skills,
      experience,
      notes,
      photoPath,
      cvPath,
      references,
      acceptedTerms,
    } = body as {
      name?: string;
      phone?: string;
      email?: string;
      birthDate?: string;
      trade?: string;
      skills?: string[];
      experience?: string;
      notes?: string;
      photoPath?: string;
      cvPath?: string;
      references?: Reference[];
      acceptedTerms?: boolean;
    };

    if (!name?.trim() || !phone?.trim() || !birthDate?.trim() || !trade?.trim()) {
      return NextResponse.json({ error: "Navn, telefon, fødselsdato og fag er påkrævet" }, { status: 400 });
    }

    if (acceptedTerms !== true) {
      return NextResponse.json({ error: "Du skal acceptere kontraktens vilkår" }, { status: 400 });
    }

    const employees = await readEmployees();
    const normalizedPhone = phone.replace(/\s/g, "");
    const exists = employees.find((e) => e.phone.replace(/\s/g, "") === normalizedPhone);
    if (exists) {
      return NextResponse.json({ error: "Der findes allerede en medarbejder med dette telefonnummer" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const employee: Employee = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      birthDate: birthDate.trim(),
      trade: trade.trim(),
      skills: Array.isArray(skills) ? skills.filter(Boolean) : [],
      experience: experience?.trim() || undefined,
      notes: notes?.trim() || undefined,
      photoPath: photoPath || undefined,
      cvPath: cvPath || undefined,
      references: Array.isArray(references) ? references.filter((r) => r && r.name?.trim()) : [],
      status: "LEDIG",
      employeeType: "MEDARBEJDER",
      acceptedTerms: true,
      acceptedAt: now,
      contractVersion: CONTRACT_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    employees.push(employee);
    await writeEmployees(employees);

    // Send email notification (best-effort — don't fail registration if email fails)
    if (process.env.RESEND_API_KEY) {
      const fromAddress = process.env.RESEND_FROM || "onboarding@resend.dev";
      const toAddress = process.env.RESEND_TO || "Kontakt@KrydsByg.com";

      const safeName = escapeHtml(employee.name);
      const safePhone = escapeHtml(employee.phone);
      const safeEmail = escapeHtml(employee.email || "–");
      const safeBirth = escapeHtml(employee.birthDate);
      const safeTrade = escapeHtml(employee.trade);
      const safeSkills = employee.skills.length > 0 ? escapeHtml(employee.skills.join(", ")) : "–";
      const safeExperience = escapeHtml(employee.experience || "–").replace(/\n/g, "<br>");
      const safeNotes = escapeHtml(employee.notes || "–").replace(/\n/g, "<br>");
      const safeRefs =
        employee.references.length > 0
          ? employee.references
              .map(
                (r) =>
                  `<p style="margin:4px 0;font-size:14px;color:#F2EEE6;">${escapeHtml(r.name)}${
                    r.company ? ` – ${escapeHtml(r.company)}` : ""
                  }${r.phone ? ` · ${escapeHtml(r.phone)}` : ""}</p>`
              )
              .join("")
          : `<p style="margin:4px 0;font-size:14px;color:#888880;">Ingen referencer</p>`;

      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromAddress,
          to: [toAddress],
          replyTo: employee.email || undefined,
          subject: `Ny medarbejder-tilmelding: ${safeName} (${safeTrade})`,
          html: `
<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><title>Ny tilmelding — Kryds</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0C0C0A;border-radius:4px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#F5C400;padding:20px 32px;">
          <p style="margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0C0C0A;">✕ KRYDS</p>
          <p style="margin:4px 0 0;font-size:12px;color:#0C0C0A;opacity:0.7;letter-spacing:0.1em;text-transform:uppercase;">Ny medarbejder-tilmelding</p>
        </td></tr>
        <tr><td style="padding:24px 32px 0;color:#F2EEE6;">
          <h2 style="margin:0;font-size:22px;font-weight:700;color:#F5C400;">${safeName}</h2>
          <p style="margin:6px 0 0;font-size:14px;color:#888880;">${safeTrade} · Kontrakt ${CONTRACT_VERSION} accepteret</p>
        </td></tr>
        <tr><td style="padding:16px 32px;"><hr style="border:none;border-top:1px solid rgba(242,238,230,0.1);margin:0;"></td></tr>
        <tr><td style="padding:0 32px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ["Navn", safeName],
            ["Telefon", safePhone],
            ["Email", safeEmail],
            ["Fødselsdato", safeBirth],
            ["Primært fag", safeTrade],
            ["Kompetencer", safeSkills],
          ]
            .map(
              ([label, value]) => `
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(242,238,230,0.07);">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">${label}</p>
            <p style="margin:4px 0 0;font-size:15px;color:#F2EEE6;">${value}</p>
          </td></tr>`
            )
            .join("")}
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(242,238,230,0.07);">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">Erfaring</p>
            <p style="margin:4px 0 0;font-size:15px;color:#F2EEE6;line-height:1.6;">${safeExperience}</p>
          </td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(242,238,230,0.07);">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">Noter</p>
            <p style="margin:4px 0 0;font-size:15px;color:#F2EEE6;line-height:1.6;">${safeNotes}</p>
          </td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(242,238,230,0.07);">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">Referencer</p>
            ${safeRefs}
          </td></tr>
          <tr><td style="padding:10px 0;">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">Filer</p>
            <p style="margin:4px 0 0;font-size:14px;color:#F2EEE6;">
              ${employee.photoPath ? `Foto: ${escapeHtml(employee.photoPath)}<br>` : ""}
              ${employee.cvPath ? `CV: ${escapeHtml(employee.cvPath)}` : ""}
              ${!employee.photoPath && !employee.cvPath ? "Ingen filer uploadet" : ""}
            </p>
          </td></tr>
        </table></td></tr>
        <tr><td style="padding:16px 32px;background:rgba(242,238,230,0.03);border-top:1px solid rgba(242,238,230,0.07);">
          <p style="margin:0;font-size:12px;color:#888880;">Log ind på /admin for at redigere eller tildele vagter.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
        });
        if (emailError) {
          console.error("[register] Resend error:", emailError);
        } else {
          console.log("[register] Email sendt til", toAddress, "id:", emailData?.id);
        }
      } catch (emailErr) {
        console.error("[register] Email exception:", emailErr);
      }
    } else {
      console.warn("[register] RESEND_API_KEY mangler — springer email over");
    }

    return NextResponse.json({ ok: true, id: employee.id }, { status: 201 });
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json({ error: "Registrering fejlede" }, { status: 500 });
  }
}
