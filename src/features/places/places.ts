import {
  isBookableCategory,
  isReservationCategory,
  type CategoryKey,
} from '@/features/bookings/categories';
import { isTransportCategory } from '@/features/bookings/details';
import type { Booking, City, ItineraryDay } from '@/features/itinerary/types';

/**
 * "Places" are the stops of a trip that sit somewhere on the map — the hotel, the museum, the
 * square you walk to — numbered 1, 2, 3… in the order they happen. Transport isn't a place (a
 * flight goes from one to another, and neither is walking between two of them).
 *
 * A place does not have to be booked: half of what you go and see costs nothing and has nothing
 * to reserve, and leaving those off the map left it emptier than the trip. Only a cancelled stop
 * drops out, because that one is no longer happening.
 */

/** Categories that happen *at* a place. Getting around isn't one, even inside a city. */
export function isPlaceCategory(key: CategoryKey): boolean {
  return (
    isReservationCategory(key) &&
    !isTransportCategory(key) &&
    key !== 'local_transport' &&
    key !== 'walking'
  );
}

export function isBooked(booking: Booking): boolean {
  return booking.status === 'booked' || booking.status === 'paid';
}

/**
 * What the Reservations tab lists. The category decides what *can* be a
 * reservation — a museum, a seat, a room — and the status decides whether it is
 * one yet: `idea` is the app's own word for "not committed", so it stays out,
 * while `to_book` is already a commitment waiting on a payment.
 */
export function isReservation(booking: Booking): boolean {
  return (
    isBookableCategory(booking.categoryKey) &&
    booking.status !== 'idea' &&
    booking.status !== 'cancelled'
  );
}

/** The text to look up on the map — the place name and/or address the user typed. */
export function placeQuery(booking: Booking): string | null {
  const parts = [booking.locationName, booking.address]
    .map((p) => p?.trim())
    .filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function isNumberedPlace(booking: Booking): boolean {
  return (
    isPlaceCategory(booking.categoryKey) &&
    booking.status !== 'cancelled' &&
    placeQuery(booking) !== null
  );
}

/** When a place happens, as a sortable local timestamp. Hotel stays only have a date — check-in
 * is placed mid-afternoon; untimed bookings take their day at noon. */
function whenOf(booking: Booking, dayDate: Map<string, string>): string {
  const start = booking.startAt;
  if (start?.includes('T')) return start;
  if (start) return `${start}T14:00:00`;
  const date = booking.dayId ? dayDate.get(booking.dayId) : undefined;
  return date ? `${date}T12:00:00` : '9999-12-31T00:00:00';
}

export interface Place {
  booking: Booking;
  number: number;
  /** Local timestamp the numbering follows. */
  when: string;
  lat: number;
  lng: number;
  /** True when the address wasn't found and the point sits on its city instead. */
  approximate: boolean;
  cityId: string | null;
  seen: boolean;
}

/** The trip's places in time order, numbered from 1. Places with no coordinates of their
 * own fall back to their city's; places with neither are left off (they can't be drawn). */
export function buildPlaces(bookings: Booking[], days: ItineraryDay[], cities: City[]): Place[] {
  const dayDate = new Map(days.map((d) => [d.id, d.date]));
  const dayCity = new Map(days.map((d) => [d.id, d.cityId]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const sorted = bookings
    .filter(isNumberedPlace)
    .map((booking) => ({ booking, when: whenOf(booking, dayDate) }))
    .sort(
      (a, b) =>
        a.when.localeCompare(b.when) ||
        a.booking.orderIndex - b.booking.orderIndex ||
        a.booking.createdAt.localeCompare(b.booking.createdAt),
    );

  const places: Place[] = [];
  for (const { booking, when } of sorted) {
    const cityId = booking.cityId ?? (booking.dayId ? (dayCity.get(booking.dayId) ?? null) : null);
    const city = cityId ? cityById.get(cityId) : undefined;
    const own = booking.lat != null && booking.lng != null;
    const lat = own ? booking.lat : city?.lat;
    const lng = own ? booking.lng : city?.lng;
    if (lat == null || lng == null) continue;
    places.push({
      booking,
      number: places.length + 1,
      when,
      lat,
      lng,
      approximate: !own,
      cityId,
      seen: booking.visitedAt !== null,
    });
  }
  return places;
}

/** booking id → its number, for showing the same number outside the map (itinerary cards). */
export function placeNumbers(places: Place[]): Map<string, number> {
  return new Map(places.map((p) => [p.booking.id, p.number]));
}
