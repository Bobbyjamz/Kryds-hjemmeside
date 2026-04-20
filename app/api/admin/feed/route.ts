import { NextRequest, NextResponse } from "next/server";
import { readFeed, writeFeed, generateId } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import type { FeedMessage } from "@/lib/types";

export const runtime = "nodejs";

// GET — hent alle beskeder (nyeste først). Åben for både admin og medarbejdere.
export async function GET() {
  const messages = await readFeed();
  return NextResponse.json(messages.slice().reverse());
}

// POST — opret ny besked (kun admin)
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, body, authorName, priority } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "title og body er påkrævet" }, { status: 400 });
  }
  const messages = await readFeed();
  const msg: FeedMessage = {
    id: generateId(),
    title: String(title).trim(),
    body: String(body).trim(),
    authorName: String(authorName || "").trim() || "Admin",
    priority: priority === "urgent" ? "urgent" : "normal",
    createdAt: new Date().toISOString(),
  };
  messages.push(msg);
  await writeFeed(messages);
  return NextResponse.json({ ok: true, id: msg.id }, { status: 201 });
}

// DELETE — slet besked (kun admin)
export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const messages = await readFeed();
  await writeFeed(messages.filter((m) => m.id !== id));
  return NextResponse.json({ ok: true });
}
