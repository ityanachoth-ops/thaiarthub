const BANGKOK_TIME_ZONE = "Asia/Bangkok";

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: BANGKOK_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: BANGKOK_TIME_ZONE,
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: BANGKOK_TIME_ZONE,
});

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "12 กันยายน 2569" */
export function formatEventDate(value: string | null): string | null {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : null;
}

/** "12 กันยายน 2569 19:00 น." */
export function formatEventDateTime(value: string | null): string | null {
  const date = toDate(value);
  if (!date) return null;
  return `${dateFormatter.format(date)} ${timeFormatter.format(date)} น.`;
}

/**
 * Same day  -> "12 กันยายน 2569 19:00 - 23:00 น."
 * Multi-day -> "12 กันยายน 2569 19:00 น. - 14 กันยายน 2569 23:00 น."
 * No end    -> "12 กันยายน 2569 19:00 น."
 */
export function formatEventDateRange(
  startAt: string,
  endAt: string | null,
): string {
  const start = toDate(startAt);
  if (!start) return "";

  const end = toDate(endAt);
  if (!end) return formatEventDateTime(startAt) ?? "";

  const sameDay = dayKeyFormatter.format(start) === dayKeyFormatter.format(end);

  if (sameDay) {
    return `${dateFormatter.format(start)} ${timeFormatter.format(start)} - ${timeFormatter.format(end)} น.`;
  }

  return `${formatEventDateTime(startAt)} - ${formatEventDateTime(endAt)}`;
}

/** ISO datetime -> "2026-09-12", for <time dateTime="..."> */
export function toDateAttribute(value: string | null): string | undefined {
  const date = toDate(value);
  return date ? date.toISOString() : undefined;
}

/** Get today's date in Bangkok timezone, normalized to start of day */
export function getTodayInBangkok(): Date {
  const now = new Date();
  const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: BANGKOK_TIME_ZONE }));
  // Set to start of day (00:00:00)
  bangkokTime.setHours(0, 0, 0, 0);
  return bangkokTime;
}

/** Check if event is upcoming (end_date >= today or start_date >= today if no end_date) */
export function isEventUpcoming(event: { startAt: string; endAt: string | null }, today: Date): boolean {
  const endDate = event.endAt ? new Date(event.endAt) : new Date(event.startAt);
  return endDate >= today;
}