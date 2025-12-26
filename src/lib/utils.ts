import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOffsetMs(timeZone: string) {
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
    }).formatToParts(new Date());
    const p: Record<string, string> = {};
    parts.forEach(({ type, value }) => p[type] = value);
    return new Date(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  };

  const dateInTarget = getParts(timeZone);
  const dateInUTC = getParts('UTC');
  return dateInTarget.getTime() - dateInUTC.getTime();
}

export function adjustTime(time: string, offsetMs: number) {
  if (!time) return time;
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  const result = new Date(d.getTime() + offsetMs);
  return `${result.getHours().toString().padStart(2, '0')}:${result.getMinutes().toString().padStart(2, '0')}`;
}
