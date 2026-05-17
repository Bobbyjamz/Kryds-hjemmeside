import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readHelbedMeals, writeHelbedMeals, generateHelbedId } from "@/lib/helbred-db";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const meals = await readHelbedMeals(date);
  return NextResponse.json({ meals });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const body = await req.json();
  const meals = await readHelbedMeals(date);
  const newMeal = { id: generateHelbedId(), logged: true, suggestedBySarah: false, ...body };
  await writeHelbedMeals(date, [...meals, newMeal]);
  return NextResponse.json({ meal: newMeal });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const body = await req.json();
  const meals = await readHelbedMeals(date);
  const updated = meals.map((m) => m.id === body.id ? { ...m, ...body } : m);
  await writeHelbedMeals(date, updated);
  return NextResponse.json({ meals: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const id = req.nextUrl.searchParams.get("id");
  const meals = await readHelbedMeals(date);
  await writeHelbedMeals(date, meals.filter((m) => m.id !== id));
  return NextResponse.json({ ok: true });
}
