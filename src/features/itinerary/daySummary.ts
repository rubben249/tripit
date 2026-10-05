import { bookingCategories, type BookingCategory } from '@/features/bookings/categories';
import { isTransportCategory } from '@/features/bookings/details';

import type { Booking, ItineraryDay } from './types';

export interface DayHighlight {
  key: string;
  icon: BookingCategory['icon'];
  color: string;
  text: string;
}

/**
 * The "most important" events for a day at a glance: transport happening
 * that day, plus hotel check-in/check-out — shown on whichever day they
 * actually fall on (a hotel's checkout day isn't always its booking's
 * dayId), per the Itinerary summary view.
 */
export function getDayHighlights(day: ItineraryDay, bookings: Booking[]): DayHighlight[] {
  const highlights: DayHighlight[] = [];

  for (const b of bookings) {
    if (b.dayId !== day.id) continue;
    if (!isTransportCategory(b.categoryKey)) continue;
    const category = bookingCategories[b.categoryKey];
    highlights.push({
      key: `t-${b.id}`,
      icon: category.icon,
      color: category.color,
      text: b.title,
    });
  }

  for (const b of bookings) {
    if (b.categoryKey !== 'accommodation') continue;
    const category = bookingCategories.accommodation;
    const checkIn = b.startAt?.slice(0, 10);
    const checkOut = b.endAt?.slice(0, 10);
    if (checkIn === day.date) {
      highlights.push({
        key: `in-${b.id}`,
        icon: category.icon,
        color: category.color,
        text: `Check in: ${b.title}`,
      });
    }
    if (checkOut === day.date && checkOut !== checkIn) {
      highlights.push({
        key: `out-${b.id}`,
        icon: category.icon,
        color: category.color,
        text: `Check out: ${b.title}`,
      });
    }
  }

  return highlights;
}

/** Bookings to actually show when a day is opened: its own, plus any accommodation checking in/out that day even if its dayId points elsewhere. */
export function getDayBookings(day: ItineraryDay, bookings: Booking[]): Booking[] {
  const own = bookings.filter((b) => b.dayId === day.id);
  const ownIds = new Set(own.map((b) => b.id));
  const checkoutsToday = bookings.filter(
    (b) =>
      b.categoryKey === 'accommodation' && !ownIds.has(b.id) && b.endAt?.slice(0, 10) === day.date,
  );
  return [...own, ...checkoutsToday].sort((a, b) =>
    (a.startAt ?? '').localeCompare(b.startAt ?? ''),
  );
}
