import { differenceInCalendarDays, parseISO } from 'date-fns';

import { getEffectiveStatus } from '@/features/trips/status';
import type { Trip } from '@/features/trips/types';

/** How far ahead an upcoming trip already counts as "now" — its notes and plan surface early. */
export const FOCUS_WINDOW_DAYS = 7;

/** Trips the Now tab is about: the ones in progress, then the ones starting within a week. */
export function getFocusTrips(trips: Trip[], now: Date = new Date()): Trip[] {
  const ongoing = trips.filter((t) => getEffectiveStatus(t, now) === 'ongoing');
  const startingSoon = trips.filter((t) => {
    if (getEffectiveStatus(t, now) !== 'upcoming' || !t.startDate) return false;
    return differenceInCalendarDays(parseISO(t.startDate), now) <= FOCUS_WINDOW_DAYS;
  });
  const byStart = (a: Trip, b: Trip) => (a.startDate ?? '').localeCompare(b.startDate ?? '');
  return [...ongoing.sort(byStart), ...startingSoon.sort(byStart)];
}

/** The closest upcoming trip beyond the focus window — what Now shows when nothing is close. */
export function getNextTrip(trips: Trip[], now: Date = new Date()): Trip | null {
  const upcoming = trips
    .filter((t) => getEffectiveStatus(t, now) === 'upcoming' && t.startDate)
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
  return upcoming[0] ?? null;
}
