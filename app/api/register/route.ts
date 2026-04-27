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
      photoFile,
      photoName,
      photoType,
      cvFile,
      cvName,
      cvType,
      ansogningFile,
      ansogningName,
      ansogningType,
      references,
      acceptedTerms,
      acceptedMedarbejderVilkaar,
      acceptedGdpr,
      confirmedAge,
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
      /** Base64-encoded file contents (without the data URL prefix) */
      photoFile?: string;
      photoName?: string;
      photoType?: string;
      cvFile?: string;
      cvName?: string;
      cvType?: string;
      ansogningFile?: string;
      ansogningName?: string;
      ansogningType?: string;
      references?: Reference[];
      acceptedTerms?: boolean;
      acceptedMedarbejderVilkaar?: boolean;
      acceptedGdpr?: boolean;
      confirmedAge?: boolean;
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
      acceptedMedarbejderVilkaar: acceptedMedarbejderVilkaar === true,
      acceptedGdpr: acceptedGdpr === true,
      confirmedAge: confirmedAge === true,
      createdAt: now,
      updatedAt: now,
    };

    employees.push(employee);
    await writeEmployees(employees);

    // Send email notification (best-effort — don't fail registration if email fails)
    if (process.env.RESEND_API_KEY) {
      const fromAddress = process.env.RESEND_FROM || "onboarding@resend.dev";
      const toAddress = process.env.RESEND_TO || "kontakt@krydsbyg.com";

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

      // Build file attachments (stripped from base64 data URL if needed)
      type Attachment = { filename: string; content: Buffer };
      const attachments: Attachment[] = [];
      function decodeBase64(dataOrBase64: string): Buffer {
        // Accept either raw base64 or a full data URL
        const idx = dataOrBase64.indexOf("base64,");
        const raw = idx >= 0 ? dataOrBase64.slice(idx + 7) : dataOrBase64;
        return Buffer.from(raw, "base64");
      }
      if (photoFile) {
        try {
          const buf = decodeBase64(photoFile);
          const ext = (photoType && photoType.split("/")[1]) || "jpg";
          const filename = photoName || `foto-${employee.id}.${ext}`;
          attachments.push({ filename, content: buf });
        } catch (e) {
          console.warn("[register] couldn't decode photo:", e);
        }
      }
      if (cvFile) {
        try {
          const buf = decodeBase64(cvFile);
          const ext = (cvType && cvType.split("/")[1]) || "pdf";
          const filename = cvName || `cv-${employee.id}.${ext}`;
          attachments.push({ filename, content: buf });
        } catch (e) {
          console.warn("[register] couldn't decode cv:", e);
        }
      }
      if (ansogningFile) {
        try {
          const buf = decodeBase64(ansogningFile);
          const ext = (ansogningType && ansogningType.split("/")[1]) || "pdf";
          const filename = ansogningName || `ansoegning-${employee.id}.${ext}`;
          attachments.push({ filename, content: buf });
        } catch (e) {
          console.warn("[register] couldn't decode ansogning:", e);
        }
      }

      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromAddress,
          to: [toAddress],
          replyTo: employee.email || undefined,
          subject: `Ny medarbejder-tilmelding: ${safeName} (${safeTrade})`,
          attachments: attachments.length > 0 ? attachments : undefined,
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
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888880;">Vedhæftede filer</p>
            <p style="margin:4px 0 0;font-size:14px;color:#F2EEE6;">
              ${photoFile ? `📷 Foto: ${escapeHtml(photoName || "foto")} (vedhæftet)<br>` : ""}
              ${cvFile ? `📄 CV: ${escapeHtml(cvName || "cv")} (vedhæftet)<br>` : ""}
              ${ansogningFile ? `✉️ Ansøgning: ${escapeHtml(ansogningName || "ansoegning")} (vedhæftet)` : ""}
              ${!photoFile && !cvFile && !ansogningFile ? "Ingen filer vedhæftet" : ""}
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
