import type { Trip, TripStatus } from './types';

/**
 * `draft` and `archived` are explicit states the user sets. Everything else
 * (`upcoming`/`ongoing`/`past`) is derived from today's date vs. the trip's
 * dates, so a trip's bucket in "My Trips" updates on its own as time passes
 * instead of needing a background job to flip a stored value.
 */
export function getEffectiveStatus(trip: Trip, now: Date = new Date()): TripStatus {
  if (trip.status === 'draft' || trip.status === 'archived') {
    return trip.status;
  }
  if (!trip.startDate || !trip.endDate) {
    return 'draft';
  }
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  end.setHours(23, 59, 59, 999);

  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'ongoing';
}
