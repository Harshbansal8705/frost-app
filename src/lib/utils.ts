import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the offset in milliseconds between UTC and a target timezone
 * for a given date (accounts for DST).
 *
 * @param timezone - IANA timezone name (e.g., "Asia/Kolkata")
 * @param date - Reference date (defaults to now)
 * @returns Offset in milliseconds
 */
export function getOffsetMs(timezone: string, date: Date = new Date()): number {
  const getParts = (tz: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(date);

    const p: Record<string, string> = {};
    for (const { type, value } of parts) {
      p[type] = value;
    }

    return new Date(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second)
    );
  };

  return getParts(timezone).getTime() - getParts('UTC').getTime();
}

/**
 * Adjusts the date to the next available weekday
 * @param date The date to adjust
 * @returns The adjusted date
 */
export function adjustForWeekend(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();

  // 0 = Sunday, 6 = Saturday
  if (day === 0) {
    // Sunday -> Monday (+1 day)
    d.setDate(d.getDate() + 1);
  } else if (day === 6) {
    // Saturday -> Monday (+2 days)
    d.setDate(d.getDate() + 2);
  }
  return d;
}

/**
 * Get the schedule time in UTC Timezone
 */
export function getFirstScheduleTime(timeStr: string = "09:00", timezone: string, allowWeekends: boolean): Date {
  const now = new Date();
  let targetDate = strToTime(timeStr);

  // If target time for today has already passed, move to tomorrow
  if (localToUtc(targetDate, timezone) <= now) targetDate.setDate(targetDate.getDate() + 1);

  // Check for weekends
  if (!allowWeekends) targetDate = adjustForWeekend(targetDate);

  return localToUtc(targetDate, timezone);
}

/**
 * Get the next schedule time in UTC Timezone
*/
export function getNextScheduleTime(timeStr: string, timezone: string, allowWeekends: boolean, lastSentAt: Date, delayDays: number): Date {
  let targetDate = utcToLocal(new Date(lastSentAt.getTime() + delayDays * 24 * 60 * 60 * 1000), timezone);
  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);

  targetDate.setUTCHours(hours, minutes, 0, 0);

  // If target time for today has already passed, move to tomorrow
  if (localToUtc(targetDate, timezone) <= now) targetDate.setDate(targetDate.getDate() + 1);

  // Check for weekends
  if (!allowWeekends) targetDate = adjustForWeekend(targetDate);

  return localToUtc(targetDate, timezone);
}

export function strToTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

export function timeToStr(date: Date): string {
  const d = new Date(date.getTime());
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
}

export function localToUtc(localDate: Date, timezone: string): Date {
  const offsetMs = getOffsetMs(timezone, localDate);
  const d = new Date(localDate.getTime() - offsetMs);
  return d;
}

export function utcToLocal(utcDate: Date, timezone: string): Date {
  const offsetMs = getOffsetMs(timezone, utcDate);
  const d = new Date(utcDate.getTime() + offsetMs);
  return d;
}
