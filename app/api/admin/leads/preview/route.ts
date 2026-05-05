import { NextRequest, NextResponse } from "next/server";
import { readLeads } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { buildEmailHtml } from "@/lib/email-builder";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await req.json();
  const leads = await readLeads();
  const lead = leads.find((l) => l.id === leadId);

  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });
  if (!lead.draftBody) return NextResponse.json({ error: "Intet udkast" }, { status: 400 });

  const html = buildEmailHtml({
    body: lead.draftBody,
    preheader: lead.draftSubject,
  });

  return NextResponse.json({ html, subject: lead.draftSubject });
}
