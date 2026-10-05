import {
  listAllCities,
  listBookings,
  listItineraryDays,
  updateBooking,
} from '@/features/itinerary/api';
import type { Booking, ItineraryDay } from '@/features/itinerary/types';
import { getDb } from '@/lib/db/client';
import { searchAddress } from '@/lib/geocoding';

import { isNumberedPlace, placeQuery } from './places';

/** Bookings and days of every trip not in the trash — what the world map numbers places from. */
export async function loadMapTripData(): Promise<{ bookings: Booking[]; days: ItineraryDay[] }> {
  const db = await getDb();
  const tripIds = await db.getAllAsync<{ id: string }>(
    'select id from trips where deleted_at is null',
  );
  const perTrip = await Promise.all(
    tripIds.map(async ({ id }) => ({
      bookings: await listBookings(id),
      days: await listItineraryDays(id),
    })),
  );
  return {
    bookings: perTrip.flatMap((t) => t.bookings),
    days: perTrip.flatMap((t) => t.days),
  };
}

/** Nominatim allows one request per second; a little margin on top. */
const REQUEST_GAP_MS = 1100;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Bumped when the lookup strategy changes, so places looked up the old way get one retry. */
const GEOCODER_VERSION = 2;

/** What a booking's stored lookup must match to count as done — see schema v8. */
export function geocodeKey(booking: Booking): string | null {
  const query = placeQuery(booking);
  return query ? `v${GEOCODER_VERSION}|${query}` : null;
}

/** Queries to try, best first. A name ("Roscioli") finds the venue itself; an address finds the
 * building; the two together often find neither, so they're tried apart. */
function lookups(booking: Booking, cityName: string | undefined): string[] {
  const withCity = (text: string) => (cityName ? `${text}, ${cityName}` : text);
  return [booking.locationName, booking.address]
    .map((part) => part?.trim())
    .filter((part): part is string => !!part)
    .map(withCity);
}

/** Looks up booked places whose place text changed since their last lookup (or never had one).
 * The result — found or not — is stored with the key it answered, so the same place is never
 * looked up twice. Places not found keep no coordinates and show at their city instead. */
export async function geocodePendingPlaces(): Promise<number> {
  const { bookings, days } = await loadMapTripData();
  const cities = new Map((await listAllCities()).map((c) => [c.id, c]));
  const dayCity = new Map(days.map((d) => [d.id, d.cityId]));

  const pending = bookings.filter((b) => isNumberedPlace(b) && geocodeKey(b) !== b.geocodedQuery);

  let updated = 0;
  let sent = 0;
  for (const booking of pending) {
    const cityId = booking.cityId ?? (booking.dayId ? dayCity.get(booking.dayId) : null);
    const city = cityId ? cities.get(cityId) : undefined;
    const near =
      city?.lat != null && city.lng != null ? { lat: city.lat, lng: city.lng } : undefined;
    try {
      let hit: { lat: number; lng: number } | null = null;
      for (const query of lookups(booking, city?.name)) {
        if (sent++ > 0) await wait(REQUEST_GAP_MS);
        hit = await searchAddress(query, near);
        if (hit) break;
      }
      await updateBooking(booking.id, {
        lat: hit?.lat ?? null,
        lng: hit?.lng ?? null,
        geocodedQuery: geocodeKey(booking),
      });
      updated++;
    } catch {
      // Offline or rate-limited: leave it pending and try again next time the map opens.
      break;
    }
  }
  return updated;
}
