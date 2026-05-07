/**
 * Admin: oversigt over modtagne LeadBot-batches.
 *
 * GET  /api/admin/leadbot      → seneste 100 batches (kompakt sammenfatning)
 */

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface BatchSummary {
  batchId: string;
  generatedAt: string;
  receivedAt: string;
  total: number;
  accepted: number;
  rejected: number;
  sourceBreakdown: Record<string, number>;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recent = (await redis.get<BatchSummary[]>("leadbot:recent")) ?? [];

  const totals = recent.reduce(
    (acc, b) => {
      acc.batches += 1;
      acc.totalLeads += b.total;
      acc.accepted += b.accepted;
      acc.rejected += b.rejected;
      return acc;
    },
    { batches: 0, totalLeads: 0, accepted: 0, rejected: 0 }
  );

  return NextResponse.json({
    ok: true,
    totals,
    batches: recent,
  });
}
