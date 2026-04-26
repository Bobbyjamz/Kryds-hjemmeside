import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readCustomers, writeCustomers, generateId } from "@/lib/db";
import type { Customer } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readCustomers());
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<Customer>;
  if (!body.name) return NextResponse.json({ error: "Navn er påkrævet" }, { status: 400 });

  const customer: Customer = {
    id: generateId(),
    type: body.type || "virksomhed",
    name: body.name,
    company: body.company,
    email: body.email,
    phone: body.phone,
    cvr: body.cvr,
    address: body.address,
    trade: body.trade,
    notes: body.notes,
    status: body.status || "lead",
    createdAt: new Date().toISOString(),
    source: "manuel",
  };

  const all = await readCustomers();
  all.unshift(customer);
  await writeCustomers(all);
  return NextResponse.json({ ok: true, customer });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json() as { id: string } & Partial<Customer>;
  const all = await readCustomers();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });

  all[idx] = { ...all[idx], ...updates, lastContactedAt: new Date().toISOString() };
  await writeCustomers(all);
  return NextResponse.json({ ok: true, customer: all[idx] });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  const all = await readCustomers();
  await writeCustomers(all.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
