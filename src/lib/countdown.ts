import { intervalToDuration, parseISO, startOfDay } from 'date-fns';

export interface CountdownParts {
  months: number;
  days: number;
  hours: number;
  minutes: number;
}

/** Null once the trip's start day has arrived or passed — callers show a different, non-countdown state then. */
export function getCountdownParts(
  startDate: string,
  now: Date = new Date(),
): CountdownParts | null {
  const target = startOfDay(parseISO(startDate));
  if (target.getTime() <= now.getTime()) return null;

  const duration = intervalToDuration({ start: now, end: target });
  return {
    months: (duration.years ?? 0) * 12 + (duration.months ?? 0),
    days: duration.days ?? 0,
    hours: duration.hours ?? 0,
    minutes: duration.minutes ?? 0,
  };
}

/** "2 months, 5 days, 3 hours" — zero-valued units are dropped so it never reads "0 hours". */
export function formatCountdown(startDate: string, now: Date = new Date()): string | null {
  const parts = getCountdownParts(startDate, now);
  if (!parts) return null;

  const segments: string[] = [];
  if (parts.months > 0) segments.push(plural(parts.months, 'month'));
  if (parts.days > 0) segments.push(plural(parts.days, 'day'));
  if (parts.hours > 0) segments.push(plural(parts.hours, 'hour'));
  if (parts.minutes > 0) segments.push(plural(parts.minutes, 'minute'));

  return segments.length > 0 ? segments.join(', ') : 'Starting any moment';
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}
