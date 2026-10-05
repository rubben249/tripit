import { isReservationCategory, type CategoryKey } from '@/features/bookings/categories';

import { emptyTables, type BundleRow, type BundleTables } from './bundle';

/** What the sender chose to include. The itinerary skeleton (the trip, its cities and days) always
 * travels; everything else is opt-out — except booking numbers, which are sensitive and opt-in. */
export interface ShareOptions {
  reservations: boolean;
  /** Flight/train numbers and similar — excluded unless the sender turns them on. */
  bookingNumbers: boolean;
  prices: boolean;
  notes: boolean;
  tasks: boolean;
  photos: boolean;
  people: boolean;
}

export const DEFAULT_SHARE_OPTIONS: ShareOptions = {
  reservations: true,
  bookingNumbers: false,
  prices: true,
  notes: true,
  tasks: true,
  photos: true,
  people: true,
};

/** Keys inside a booking's `details` JSON that identify a specific booking. */
const SENSITIVE_DETAIL_KEYS = ['carrierNumber'];

function withoutSensitiveDetails(details: string | number | null): string | null {
  if (typeof details !== 'string') return null;
  try {
    const parsed = JSON.parse(details) as Record<string, unknown>;
    for (const key of SENSITIVE_DETAIL_KEYS) delete parsed[key];
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

function keepBooking(row: BundleRow, options: ShareOptions): boolean {
  const category = row.category_key as CategoryKey;
  if (category === 'note') return options.notes;
  if (category === 'task') return options.tasks;
  return isReservationCategory(category) && options.reservations;
}

/** Removes everything the sender left out *before* the trip is encrypted and uploaded — excluded
 * data is never in the payload at all, rather than hidden on the receiving screen. */
export function filterForShare(tables: BundleTables, options: ShareOptions): BundleTables {
  const out = emptyTables();
  out.trips = tables.trips.map((t) => ({ ...t, deleted_at: null }));
  out.cities = tables.cities;
  out.itinerary_days = tables.itinerary_days;
  out.trip_participants = options.people ? tables.trip_participants : [];

  out.bookings = tables.bookings
    .filter((b) => keepBooking(b, options))
    .map((b) => {
      const next: BundleRow = { ...b };
      if (!options.prices) {
        next.price = null;
        next.currency = null;
      }
      if (!options.bookingNumbers) next.details = withoutSensitiveDetails(b.details ?? null);
      return next;
    });

  // Photos only travel with a note/task that travels too.
  const keptIds = new Set(out.bookings.map((b) => b.id));
  out.note_photos = options.photos
    ? tables.note_photos.filter((p) => typeof p.note_id === 'string' && keptIds.has(p.note_id))
    : [];
  return out;
}
