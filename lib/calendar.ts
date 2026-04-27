export interface TimeSlot {
  start: string; // ISO
  end: string;   // ISO
}

export async function getFreeSlots(
  _calendarId: string,
  _from: Date,
  _to: Date
): Promise<TimeSlot[]> {
  // TODO: Google Calendar API integration
  // Kræver: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN
  return [];
}
