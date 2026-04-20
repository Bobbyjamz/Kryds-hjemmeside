import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Upload endpoint that accepts a file and returns it as a base64 data URL.
 * No filesystem writes — works on read-only serverless (Vercel).
 * The base64 is stored client-side and later sent to /api/register
 * which attaches it to the notification email.
 */

const MAX_PHOTO = 4 * 1024 * 1024; // 4 MB (stay under Vercel 4.5MB body limit)
const MAX_CV = 4 * 1024 * 1024; // 4 MB
const ALLOWED_PHOTO = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
// Accept PDFs, images, Word docs, plain text, RTF, and OpenDocument for CV / ansøgning
const ALLOWED_CV = [
  "application/pdf",
  "application/x-pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
  "text/rtf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  // Some phones report empty type — we fall back to extension below
  "",
  "application/octet-stream",
];
const ALLOWED_CV_EXT = /\.(pdf|doc|docx|odt|rtf|txt|jpg|jpeg|png|webp|heic|heif)$/i;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = (form.get("kind") as string) || "photo";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Ingen fil modtaget" }, { status: 400 });
    }

    const isPhoto = kind === "photo";
    const maxSize = isPhoto ? MAX_PHOTO : MAX_CV;
    const allowed = isPhoto ? ALLOWED_PHOTO : ALLOWED_CV;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Filen er for stor (max ${maxSize / 1024 / 1024} MB)` },
        { status: 400 }
      );
    }

    // For CV, allow either matching MIME or a known file extension (phones often report empty type)
    const extOk = !isPhoto && ALLOWED_CV_EXT.test(file.name || "");
    if (!allowed.includes(file.type) && !extOk) {
      return NextResponse.json(
        {
          error: isPhoto
            ? "Billedformat ikke tilladt (brug JPG, PNG, HEIC eller WebP)"
            : "Filtype ikke tilladt (brug PDF, DOC, DOCX, ODT, RTF, TXT eller billede)",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      ok: true,
      dataUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload fejlede" }, { status: 500 });
  }
}
