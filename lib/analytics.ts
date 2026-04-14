import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");

export interface PageView {
  id: string;
  path: string;
  country: string;   // ISO 3166-1 alpha-2, e.g. "DK"
  city: string;
  timestamp: string; // ISO 8601
  duration: number;  // seconds on page (updated on exit)
  referrer: string;
}

async function ensureDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

export async function readAnalytics(): Promise<PageView[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, "utf8");
    return JSON.parse(raw) as PageView[];
  } catch {
    return [];
  }
}

export async function appendPageView(view: PageView): Promise<void> {
  await ensureDir();
  const views = await readAnalytics();
  // Keep max 10 000 entries — drop oldest
  const trimmed = views.length >= 10000 ? views.slice(-9999) : views;
  trimmed.push(view);
  await fs.writeFile(ANALYTICS_FILE, JSON.stringify(trimmed, null, 2), "utf8");
}

export async function updateDuration(id: string, duration: number): Promise<void> {
  const views = await readAnalytics();
  const idx = views.findLastIndex((v) => v.id === id);
  if (idx !== -1) {
    views[idx] = { ...views[idx], duration };
    await fs.writeFile(ANALYTICS_FILE, JSON.stringify(views, null, 2), "utf8");
  }
}

// ── Aggregation helpers used by admin dashboard ──────────────────────────────

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

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const v of weekViews) {
    pageCounts[v.path] = (pageCounts[v.path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  // Top countries
  const countryCounts: Record<string, number> = {};
  for (const v of weekViews) {
    const c = v.country || "Ukendt";
    countryCounts[c] = (countryCounts[c] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([country, count]) => ({ country, count }));

  // Daily counts for sparkline
  const daily = week.map((date) => ({
    date,
    count: views.filter((v) => v.timestamp.startsWith(date)).length,
  }));

  // Avg duration (only sessions > 2s to filter bots)
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
