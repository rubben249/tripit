import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** Inclusive list of ISO ("yyyy-MM-dd") dates from start to end. */
export function eachDateBetween(startDate: string, endDate: string): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInCalendarDays(end, start);
  if (days < 0) {
    throw new Error(`endDate (${endDate}) is before startDate (${startDate})`);
  }
  return Array.from({ length: days + 1 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

export function formatDayLabel(date: string): string {
  return format(parseISO(date), 'EEE d MMM');
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const sameMonth = format(start, 'MMM') === format(end, 'MMM');
  const startLabel = sameMonth ? format(start, 'd') : format(start, 'd MMM');
  return `${startLabel} – ${format(end, 'd MMM')}`;
}

export function tripDurationNights(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
}
