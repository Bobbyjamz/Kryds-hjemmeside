import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { readHelbedSettings, writeHelbedSettings } from "@/lib/helbred-db";

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const settings = await readHelbedSettings();
  if (!settings.googleCalendarRefreshToken) {
    return NextResponse.json({ connected: false, events: [] });
  }

  const accessToken = await getAccessToken(settings.googleCalendarRefreshToken);
  if (!accessToken) {
    return NextResponse.json({ connected: false, events: [], error: "Token udløbet" });
  }

  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const timeMin = `${date}T00:00:00Z`;
  const timeMax = `${date}T23:59:59Z`;
  const calendarId = settings.googleCalendarId ?? "primary";

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!calRes.ok) {
    return NextResponse.json({ connected: true, events: [], error: "Kalender-API fejl" });
  }

  const data = await calRes.json() as { items?: unknown[] };
  return NextResponse.json({ connected: true, events: data.items ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const settings = await readHelbedSettings();
  if (!settings.googleCalendarRefreshToken) {
    return NextResponse.json({ error: "Google Kalender ikke tilsluttet" }, { status: 400 });
  }

  const accessToken = await getAccessToken(settings.googleCalendarRefreshToken);
  if (!accessToken) return NextResponse.json({ error: "Token fejl" }, { status: 400 });

  const body = await req.json() as {
    date: string;
    time: string;
    title: string;
    duration: number;
    description?: string;
    color?: string;
  };

  const { date, time, title, duration, description } = body;
  const [h, m] = time.split(":").map(Number);
  const start = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const end = new Date(start.getTime() + duration * 60000);

  const event = {
    summary: title,
    description: description ?? "Oprettet af Sarah · KrydsByg Helbred",
    start: { dateTime: start.toISOString(), timeZone: "Europe/Copenhagen" },
    end: { dateTime: end.toISOString(), timeZone: "Europe/Copenhagen" },
  };

  const calendarId = settings.googleCalendarId ?? "primary";
  const createRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    },
  );

  if (!createRes.ok) {
    return NextResponse.json({ error: "Kunne ikke oprette begivenhed" }, { status: 500 });
  }

  const created = await createRes.json();
  return NextResponse.json({ event: created });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

  const settings = await readHelbedSettings();
  const body = await req.json() as { calendarId?: string };
  if (body.calendarId !== undefined) {
    await writeHelbedSettings({ ...settings, googleCalendarId: body.calendarId });
  }
  return NextResponse.json({ ok: true });
}
