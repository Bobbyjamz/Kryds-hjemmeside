import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminSession } from "@/lib/auth";
import {
  readHelbedLog,
  readHelbedMeals,
  readHelbedSupplements,
  readHelbedSupplementLog,
  readHelbedTraining,
  readHelbedChat,
  writeHelbedChat,
  generateHelbedId,
} from "@/lib/helbred-db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildSystemPrompt(
  log: Awaited<ReturnType<typeof readHelbedLog>>,
  meals: Awaited<ReturnType<typeof readHelbedMeals>>,
  supplements: Awaited<ReturnType<typeof readHelbedSupplements>>,
  takenLog: Record<string, boolean>,
  training: Awaited<ReturnType<typeof readHelbedTraining>>,
  date: string,
): string {
  const danskDato = new Date(date).toLocaleDateString("da-DK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const mealsText = meals.length > 0
    ? meals.map((m) => `  - ${m.time}: ${m.name} — ${m.items} (${m.kcal} kcal, P:${m.protein}g K:${m.carbs}g F:${m.fat}g)`).join("\n")
    : "  Ingen måltider logget endnu";

  const trainingText = training.length > 0
    ? training.map((t) => `  - ${t.time}: ${t.type} ${t.duration > 0 ? `(${t.duration} min)` : ""} ${t.subtitle ? `· ${t.subtitle}` : ""}${t.adjustedBySarah ? " · justeret af Sarah" : ""}`).join("\n")
    : "  Ingen træning planlagt";

  const suppText = supplements
    .filter((s) => s.active)
    .map((s) => `  - ${s.name} ${s.dose} (${s.when}): ${takenLog[s.id] ? "✓ taget" : "○ ikke taget"}`)
    .join("\n");

  return `Du er Sarah, Krystiansm personlige helbreds-AI agent. Du taler altid dansk.

DATO: ${danskDato}

DAGENS HELBREDS-DATA:
  Readiness: ${log.readiness}/100
  HRV: ${log.hrv} ms
  Søvn: ${log.sleepHours}t ${log.sleepMinutes}m (score: ${log.sleepScore}, effektivitet: ${log.sleepEfficiency}%)
  Body Battery: ${log.bodyBattery}/100
  Hvilepuls: ${log.restingHr} bpm
  Skridt: ${log.steps.toLocaleString("da")} / ${log.stepsGoal.toLocaleString("da")}
  Kalorier: ${log.caloriesEaten} / ${log.calorieTarget} kcal
  Protein: ${log.proteinNow}g / ${log.proteinGoal}g
  Kulhydrater: ${log.carbsNow}g / ${log.carbsGoal}g
  Fedt: ${log.fatNow}g / ${log.fatGoal}g
  Vand: ${log.waterNow}L / ${log.waterGoal}L
${log.notes ? `  Noter: ${log.notes}` : ""}

DAGENS MÅLTIDER:
${mealsText}

TRÆNINGSPLAN:
${trainingText}

SUPPLEMENTS:
${suppText}

DIN ROLLE:
- Du er Krystiansm personlige sundhedscoach med adgang til alle hans biometriske data
- Analyser sammenhænge mellem søvn, HRV, ernæring og træning
- Giv konkrete, handlingsorienterede anbefalinger
- Du kan foreslå at booke aktiviteter i Google Kalender — brug formatet [BOOK: HH:MM | Titel | varighed_min] i din besked
- Hold svarene korte og præcise (2-4 linjer) medmindre Krystian beder om mere
- Brug hans fornavn Krystian naturligt
- Tal altid dansk`;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const messages = await readHelbedChat();
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const body = await req.json();
  const { message, date: reqDate } = body as { message: string; date?: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Ingen besked" }, { status: 400 });
  }

  const date = reqDate ?? todayISO();

  const [log, meals, supplements, takenLog, training, history] = await Promise.all([
    readHelbedLog(date),
    readHelbedMeals(date),
    readHelbedSupplements(),
    readHelbedSupplementLog(date),
    readHelbedTraining(date),
    readHelbedChat(),
  ]);

  const systemPrompt = buildSystemPrompt(log, meals, supplements, takenLog, training, date);

  const newUserMsg = { id: generateHelbedId(), role: "user" as const, content: message.trim(), createdAt: new Date().toISOString() };
  const updatedHistory = [...history, newUserMsg];

  const apiMessages = updatedHistory.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: apiMessages,
  });

  const assistantText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const assistantMsg = { id: generateHelbedId(), role: "assistant" as const, content: assistantText, createdAt: new Date().toISOString() };

  await writeHelbedChat([...updatedHistory, assistantMsg]);

  // Detect calendar booking commands: [BOOK: 09:00 | Boksetræning | 45]
  const bookings: Array<{ time: string; title: string; duration: number }> = [];
  const bookRegex = /\[BOOK:\s*(\d{1,2}:\d{2})\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\]/gi;
  let match;
  while ((match = bookRegex.exec(assistantText)) !== null) {
    bookings.push({ time: match[1], title: match[2].trim(), duration: parseInt(match[3]) });
  }

  return NextResponse.json({ message: assistantMsg, bookings });
}

export async function DELETE() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  await writeHelbedChat([]);
  return NextResponse.json({ ok: true });
}
