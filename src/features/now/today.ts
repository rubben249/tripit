import { format, parseISO } from 'date-fns';

import { isReservationCategory } from '@/features/bookings/categories';
import { getDayBookings } from '@/features/itinerary/daySummary';
import type { Booking, City, ItineraryDay } from '@/features/itinerary/types';

export type TimelineState = 'done' | 'now' | 'upcoming' | 'allDay';

export interface TimelineItem {
  booking: Booking;
  /** "14:30", or a label like "Check-out" for date-only bookings. */
  timeLabel: string | null;
  state: TimelineState;
}

export interface TodayPlan {
  day: ItineraryDay;
  dayNumber: number;
  totalDays: number;
  city: City | null;
  items: TimelineItem[];
}

/** Booking times are stored as local wall-clock time without a zone ("2026-10-09T14:30:00"), so
 * they're compared against the device clock as-is. Date-only values (hotel stays) have no time. */
function hasTime(value: string | null): boolean {
  return !!value && value.includes('T');
}

export function getTodayPlan(
  days: ItineraryDay[],
  cities: City[],
  bookings: Booking[],
  now: Date = new Date(),
): TodayPlan | null {
  const todayKey = format(now, 'yyyy-MM-dd');
  const index = days.findIndex((d) => d.date === todayKey);
  const day = days[index];
  if (!day) return null;

  const items = getDayBookings(day, bookings)
    .filter((b) => isReservationCategory(b.categoryKey))
    .map((booking) => toTimelineItem(booking, day.date, now))
    .sort(byTime);

  return {
    day,
    dayNumber: index + 1,
    totalDays: days.length,
    city: cities.find((c) => c.id === day.cityId) ?? null,
    items,
  };
}

function toTimelineItem(booking: Booking, date: string, now: Date): TimelineItem {
  if (!hasTime(booking.startAt)) {
    const label =
      booking.categoryKey === 'accommodation'
        ? booking.endAt?.slice(0, 10) === date
          ? 'Check-out'
          : booking.startAt?.slice(0, 10) === date
            ? 'Check-in'
            : 'Staying'
        : null;
    return { booking, timeLabel: label, state: 'allDay' };
  }

  const start = parseISO(booking.startAt as string);
  const end = hasTime(booking.endAt) ? parseISO(booking.endAt as string) : start;
  const state: TimelineState = end < now ? 'done' : start <= now ? 'now' : 'upcoming';
  return { booking, timeLabel: format(start, 'HH:mm'), state };
}

/** All-day items first (where you're sleeping, check-outs), then by time. */
function byTime(a: TimelineItem, b: TimelineItem): number {
  const aTimed = a.state !== 'allDay';
  const bTimed = b.state !== 'allDay';
  if (aTimed !== bTimed) return aTimed ? 1 : -1;
  return (a.booking.startAt ?? '').localeCompare(b.booking.startAt ?? '');
}

/** The next timed booking still ahead of `now`, on any day of the trip. */
export function getNextUp(bookings: Booking[], now: Date = new Date()): Booking | null {
  const ahead = bookings
    .filter((b) => isReservationCategory(b.categoryKey) && hasTime(b.startAt))
    .filter((b) => parseISO(b.startAt as string) > now)
    .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? ''));
  return ahead[0] ?? null;
}
