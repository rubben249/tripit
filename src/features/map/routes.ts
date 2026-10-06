import { getCategory, type CategoryKey } from '@/features/bookings/categories';
import { isTransportCategory } from '@/features/bookings/details';
import type { Booking, City, ItineraryDay } from '@/features/itinerary/types';

/**
 * The legs of a trip: how you get from each city to the next. Cities run in travel order (arrival
 * date, then the order they were added), and every consecutive pair becomes one leg drawn as a
 * great-circle arc. The way you travel it comes from the trip's own transport bookings — a flight
 * on the day you arrive in the next city makes that leg a flight — and a leg with no booking yet
 * is still drawn, quietly, because the journey happens whether or not it's booked.
 */

export type RouteStyle = 'solid' | 'dashed' | 'dotted' | 'faint';

export interface Route {
  id: string;
  tripId: string;
  fromCityId: string;
  toCityId: string;
  fromName: string;
  toName: string;
  /** Null when no transport booking explains this leg. */
  mode: CategoryKey | null;
  label: string;
  style: RouteStyle;
  /** The itinerary day this leg is traveled on, when known — what the day filter matches. */
  dayId: string | null;
  /** Great-circle path; longitudes may run past ±180 so a leg never jumps the antimeridian. */
  coordinates: [number, number][];
}

export function routeStyle(mode: CategoryKey | null): RouteStyle {
  if (mode === null) return 'faint';
  if (mode === 'flight') return 'dashed';
  if (mode === 'boat_ferry') return 'dotted';
  return 'solid';
}

/** Key into the palette's route colors (`mapPalettes[…].route`). */
export function routeColorKey(mode: CategoryKey | null): string {
  return mode ?? 'unknown';
}

const SEGMENTS = 48;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

interface Point {
  lat: number;
  lng: number;
}

/** Shortest east/west difference between two longitudes, in degrees. */
function lngDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

export function greatCircle(from: Point, to: Point, segments = SEGMENTS): [number, number][] {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const lng1 = toRad(from.lng);
  const lng2 = toRad(from.lng + lngDelta(from.lng, to.lng));

  const haversine =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2;
  const arc = 2 * Math.asin(Math.min(1, Math.sqrt(haversine)));
  if (!(arc > 1e-9)) {
    return [
      [from.lng, from.lat],
      [toDeg(lng2), to.lat],
    ];
  }

  const points: [number, number][] = [];
  let previousLng = from.lng;
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const a = Math.sin((1 - f) * arc) / Math.sin(arc);
    const b = Math.sin(f * arc) / Math.sin(arc);
    const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
    const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    // atan2 wraps to ±180; keep walking in the same direction so the line stays in one piece.
    const lng = previousLng + lngDelta(previousLng, toDeg(Math.atan2(y, x)));
    previousLng = lng;
    points.push([lng, lat]);
  }
  return points;
}

function dateOf(booking: Booking, dayDate: Map<string, string>): string | null {
  if (booking.startAt) return booking.startAt.slice(0, 10);
  return booking.dayId ? (dayDate.get(booking.dayId) ?? null) : null;
}

/** Cities in the order they're traveled: by arrival date when they have one, then by the order
 * they were added (which is how the itinerary shows them). */
export function travelOrder(cities: City[]): City[] {
  return [...cities].sort(
    (a, b) =>
      (a.arrivalDate ?? '9999-12-31').localeCompare(b.arrivalDate ?? '9999-12-31') ||
      a.orderIndex - b.orderIndex,
  );
}

export function buildRoutes(cities: City[], bookings: Booking[], days: ItineraryDay[]): Route[] {
  const dayDate = new Map(days.map((d) => [d.id, d.date]));
  const dayByDate = new Map(days.map((d) => [d.date, d.id]));
  const placed = travelOrder(cities.filter((c) => c.lat != null && c.lng != null));

  const transports = bookings
    .filter((b) => isTransportCategory(b.categoryKey) && b.status !== 'cancelled')
    .map((booking) => ({ booking, date: dateOf(booking, dayDate) }))
    .filter((t): t is { booking: Booking; date: string } => t.date !== null)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.booking.startAt ?? '').localeCompare(b.booking.startAt ?? '') ||
        a.booking.orderIndex - b.booking.orderIndex,
    );

  const used = new Set<string>();
  const routes: Route[] = [];

  for (let i = 0; i < placed.length - 1; i++) {
    const from = placed[i]!;
    const to = placed[i + 1]!;
    // You travel on the day you reach the next city; some itineraries date the leg on the day you
    // leave the previous one instead.
    const legDates = [to.arrivalDate, from.departureDate].filter((d): d is string => !!d);
    const leg = transports.find((t) => !used.has(t.booking.id) && legDates.includes(t.date));
    if (leg) used.add(leg.booking.id);

    const mode = leg ? leg.booking.categoryKey : null;
    const dayId = leg?.booking.dayId ?? (legDates[0] ? (dayByDate.get(legDates[0]) ?? null) : null);

    routes.push({
      id: `${from.id}-${to.id}`,
      tripId: from.tripId,
      fromCityId: from.id,
      toCityId: to.id,
      fromName: from.name,
      toName: to.name,
      mode,
      label: mode ? getCategory(mode).label : 'Way there not booked yet',
      style: routeStyle(mode),
      dayId,
      coordinates: greatCircle({ lat: from.lat!, lng: from.lng! }, { lat: to.lat!, lng: to.lng! }),
    });
  }

  return routes;
}

export function routesOnDay(routes: Route[], dayId: string): Route[] {
  return routes.filter((r) => r.dayId === dayId);
}
