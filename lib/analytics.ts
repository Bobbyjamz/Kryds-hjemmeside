/**
 * Analytics — gemmer page views i Upstash Redis i stedet for fil.
 * Filen analytics.json eksisterede ikke på Vercel (read-only filesystem).
 *
 * Redis-nøgler:
 *   analytics:views   JSON-array af PageView (max 10.000 — ældste smides væk)
 */

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
});

const KEY = "analytics:views";
const MAX_VIEWS = 10_000;

export interface PageView {
  id: string;
  path: string;
  country: string;
  city: string;
  timestamp: string; // ISO 8601
  duration: number;  // sekunder på siden (opdateres ved exit)
  referrer: string;
}

export async function readAnalytics(): Promise<PageView[]> {
  try {
    const raw = await redis.get<PageView[]>(KEY);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export async function appendPageView(view: PageView): Promise<void> {
  try {
    const views = await readAnalytics();
    // Behold max MAX_VIEWS — kasser de ældste
    const trimmed = views.length >= MAX_VIEWS ? views.slice(-(MAX_VIEWS - 1)) : views;
    trimmed.push(view);
    await redis.set(KEY, trimmed);
  } catch (err) {
    console.error("[analytics] appendPageView fejl:", err);
  }
}

export async function updateDuration(id: string, duration: number): Promise<void> {
  try {
    const views = await readAnalytics();
    const idx = views.findLastIndex((v) => v.id === id);
    if (idx !== -1) {
      views[idx] = { ...views[idx], duration };
      await redis.set(KEY, views);
    }
  } catch (err) {
    console.error("[analytics] updateDuration fejl:", err);
  }
}

// ── Aggregation helpers ──────────────────────────────────────────────────────

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export function aggregate(views: PageView[]) {
  const today = new Date().toISOString().slice(0, 10);
  const week = last7Days();

  const todayViews = views.filter((v) => v.timestamp.startsWith(today));
  const weekViews = views.filter((v) => week.some((d) => v.timestamp.startsWith(d)));

  // Top sider
  const pageCounts: Record<string, number> = {};
  for (const v of weekViews) {
    pageCounts[v.path] = (pageCounts[v.path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  // Top lande
  const countryCounts: Record<string, number> = {};
  for (const v of weekViews) {
    const c = v.country || "Ukendt";
    countryCounts[c] = (countryCounts[c] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([country, count]) => ({ country, count }));

  // Daglige tal til graf
  const daily = week.map((date) => ({
    date,
    count: views.filter((v) => v.timestamp.startsWith(date)).length,
  }));

  // Gns. varighed (kun sessioner > 2s for at filtrere bots)
  const realViews = weekViews.filter((v) => v.duration > 2);
  const avgDuration = realViews.length
    ? Math.round(realViews.reduce((s, v) => s + v.duration, 0) / realViews.length)
    : 0;

  return {
    todayCount: todayViews.length,
    weekCount: weekViews.length,
    topPages,
    topCountries,
    daily,
    avgDuration,
  };
}
