/**
 * Vagt-match preview — viser de bedste medarbejdere FØR du sender SMS/mail.
 *
 * Scorer hver ledig medarbejder baseret på:
 *   - Eksakt fag-match (+50)
 *   - Nært relateret fag (+20)
 *   - Færdigheder der matcher vagt-beskrivelsen (+10 hver)
 *   - Foretrukne områder matcher vagt-location (+15)
 *   - Erfaring/anciennitet (+5-15)
 *   - Tidligere completed vagter (+2 per vagt, max +20)
 *
 * Returnerer top 8 sorteret efter score.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readShifts, readEmployees } from "@/lib/db";
import type { Employee, Shift } from "@/lib/types";

export const runtime = "nodejs";

// Fag der ofte kan dække for hinanden (giver +20 hvis ikke eksakt match)
const RELATED_TRADES: Record<string, string[]> = {
  TOMRER: ["HANDYMAN", "MONTOR", "BYGGEHJAELPER"],
  MURER: ["HANDYMAN", "BYGGEHJAELPER", "STRUKTOR"],
  MALER: ["HANDYMAN", "BYGGEHJAELPER"],
  ELEKTRIKER: ["HANDYMAN", "MONTOR"],
  VVS: ["HANDYMAN", "MONTOR"],
  STRUKTOR: ["MURER", "BYGGEHJAELPER", "HANDYMAN"],
  NEDRIVER: ["BYGGEHJAELPER", "HANDYMAN", "STRUKTOR"],
  MONTOR: ["HANDYMAN", "TOMRER", "ELEKTRIKER"],
  HAVEMAND: ["HANDYMAN", "BYGGEHJAELPER"],
  RENGORING: ["HANDYMAN"],
  CHAUFFOR: ["HANDYMAN"],
  HANDYMAN: ["MONTOR", "BYGGEHJAELPER", "MALER", "TOMRER"],
  BYGGEHJAELPER: ["HANDYMAN", "STRUKTOR", "NEDRIVER", "MURER"],
};

interface ScoredMatch {
  employee: Employee;
  score: number;
  reasons: string[];
}

function scoreMatch(emp: Employee, shift: Shift): ScoredMatch {
  let score = 0;
  const reasons: string[] = [];

  // 1. Fag-match
  if (emp.trade === shift.trade) {
    score += 50;
    reasons.push("Eksakt fag-match (+50)");
  } else if (RELATED_TRADES[shift.trade]?.includes(emp.trade)) {
    score += 20;
    reasons.push("Relateret fag (+20)");
  } else if (emp.desiredTrades?.includes(shift.trade)) {
    score += 35;
    reasons.push("Har ønsket dette fag (+35)");
  }

  // 2. Færdigheder matcher vagtens titel/beskrivelse
  const shiftText = `${shift.title} ${shift.description ?? ""}`.toLowerCase();
  const matchingSkills = emp.skills.filter((s) =>
    shiftText.includes(s.toLowerCase()) || s.toLowerCase().includes(shiftText.split(" ")[0] ?? "x")
  );
  if (matchingSkills.length > 0) {
    const bonus = Math.min(matchingSkills.length * 10, 30);
    score += bonus;
    reasons.push(`${matchingSkills.length} matchende færdigheder (+${bonus})`);
  }

  // 3. Foretrukne områder
  if (emp.preferredAreas && shift.location) {
    const locLower = shift.location.toLowerCase();
    const areaMatch = emp.preferredAreas.some((a) => locLower.includes(a.toLowerCase()) || a.toLowerCase().includes(locLower));
    if (areaMatch) {
      score += 15;
      reasons.push("Foretrukket område (+15)");
    }
  }

  // 4. Erfaring (længde af experience-tekst er en simpel proxy)
  if (emp.experience && emp.experience.length > 50) {
    score += 10;
    reasons.push("Har erfaring beskrevet (+10)");
  }

  // 5. Completed vagter
  if (emp.completedShifts && emp.completedShifts > 0) {
    const bonus = Math.min(emp.completedShifts * 2, 20);
    score += bonus;
    reasons.push(`${emp.completedShifts} tidligere vagter (+${bonus})`);
  }

  // 6. Rating
  if (emp.rating && emp.rating >= 4) {
    score += 10;
    reasons.push(`Rating ${emp.rating}★ (+10)`);
  }

  // 7. Kørekort hvis vagt er udenfor city
  const isOuterArea = shift.location && !/(københavn|kbh|frederiksberg)/i.test(shift.location);
  if (isOuterArea && emp.driverLicense) {
    score += 8;
    reasons.push("Kørekort (+8)");
  }

  // 8. Eget værktøj (for håndværker-vagter)
  const isHandyJob = ["TOMRER", "MURER", "MALER", "ELEKTRIKER", "VVS", "MONTOR", "HANDYMAN"].includes(shift.trade);
  if (isHandyJob && emp.ownTools) {
    score += 5;
    reasons.push("Eget værktøj (+5)");
  }

  return { employee: emp, score, reasons };
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { shiftId } = await req.json();
    if (!shiftId) return NextResponse.json({ error: "shiftId påkrævet" }, { status: 400 });

    const [shifts, employees] = await Promise.all([readShifts(), readEmployees()]);
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return NextResponse.json({ error: "Vagt ikke fundet" }, { status: 404 });

    // Kun LEDIG medarbejdere
    const available = employees.filter((e) => e.status === "LEDIG");

    if (available.length === 0) {
      return NextResponse.json({
        ok: true,
        matches: [],
        message: "Ingen ledige medarbejdere — tilføj nogle eller aktivér Afventer-bekræftelse",
      });
    }

    const scored = available
      .map((e) => scoreMatch(e, shift))
      .filter((s) => s.score > 0)  // Skip dem uden nogen relevans
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return NextResponse.json({
      ok: true,
      matches: scored.map((s) => ({
        employee: {
          id: s.employee.id,
          name: s.employee.name,
          trade: s.employee.trade,
          phone: s.employee.phone,
          email: s.employee.email,
          rating: s.employee.rating,
          completedShifts: s.employee.completedShifts,
        },
        score: s.score,
        reasons: s.reasons,
      })),
      totalAvailable: available.length,
    });
  } catch (err) {
    console.error("[shifts/preview-match]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
