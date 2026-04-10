import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_PHOTO = 5 * 1024 * 1024; // 5 MB
const MAX_CV = 10 * 1024 * 1024; // 10 MB

const ALLOWED_PHOTO = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_CV = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = (form.get("kind") as string) || "photo";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Ingen fil" }, { status: 400 });
    }

    const isPhoto = kind === "photo";
    const maxSize = isPhoto ? MAX_PHOTO : MAX_CV;
    const allowed = isPhoto ? ALLOWED_PHOTO : ALLOWED_CV;

    if (file.size > maxSize) {
      return NextResponse.json({ error: `Filen er for stor (max ${maxSize / 1024 / 1024} MB)` }, { status: 400 });
    }

    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Filtype er ikke tilladt" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase() || (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const id = crypto.randomBytes(8).toString("hex");
    const sub = isPhoto ? "photo" : "cv";
    const dir = path.join(process.cwd(), "public", "uploads", sub);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${id}${ext}`;
    await fs.writeFile(path.join(dir, filename), buffer);

    const publicPath = `/uploads/${sub}/${filename}`;
    return NextResponse.json({ ok: true, path: publicPath });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload fejlede" }, { status: 500 });
  }
}
