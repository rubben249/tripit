import type { City } from '@/features/itinerary/types';
import { getEffectiveStatus } from '@/features/trips/status';
import type { Trip } from '@/features/trips/types';

/** Traveled = already happened or happening now; planned = still ahead (upcoming or draft). */
export type TripKind = 'traveled' | 'planned';

export interface MapCity {
  id: string;
  tripId: string;
  tripName: string;
  name: string;
  countryCode: string | null;
  lat: number;
  lng: number;
  arrivalDate: string | null;
  departureDate: string | null;
  kind: TripKind;
}

export interface MapCountry {
  iso: string;
  kind: TripKind;
}

/** [[west, south], [east, north]] */
export type Bounds = [[number, number], [number, number]];

export interface MapTrip {
  id: string;
  name: string;
  kind: TripKind;
  bounds: Bounds;
  cityCount: number;
}

export interface MapData {
  cities: MapCity[];
  countries: MapCountry[];
  trips: MapTrip[];
}

export function tripKind(trip: Trip, now: Date = new Date()): TripKind {
  const status = getEffectiveStatus(trip, now);
  return status === 'past' || status === 'ongoing' || status === 'archived'
    ? 'traveled'
    : 'planned';
}

export function boundsOf(points: { lat: number; lng: number }[]): Bounds {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/** Everything the world map draws, from trips and their geocoded cities. A country visited on any
 * trip counts as traveled even if another, future trip also goes there. */
export function buildMapData(trips: Trip[], cities: City[], now: Date = new Date()): MapData {
  const tripById = new Map(trips.map((t) => [t.id, t]));

  const mapCities: MapCity[] = [];
  for (const city of cities) {
    const trip = tripById.get(city.tripId);
    if (!trip || city.lat == null || city.lng == null) continue;
    mapCities.push({
      id: city.id,
      tripId: trip.id,
      tripName: trip.name,
      name: city.name,
      countryCode: city.countryCode,
      lat: city.lat,
      lng: city.lng,
      arrivalDate: city.arrivalDate,
      departureDate: city.departureDate,
      kind: tripKind(trip, now),
    });
  }

  const countryKinds = new Map<string, TripKind>();
  for (const city of mapCities) {
    if (!city.countryCode) continue;
    if (countryKinds.get(city.countryCode) !== 'traveled') {
      countryKinds.set(city.countryCode, city.kind);
    }
  }

  const mapTrips: MapTrip[] = [];
  for (const trip of trips) {
    const tripCities = mapCities.filter((c) => c.tripId === trip.id);
    if (tripCities.length === 0) continue;
    mapTrips.push({
      id: trip.id,
      name: trip.name,
      kind: tripKind(trip, now),
      bounds: boundsOf(tripCities),
      cityCount: tripCities.length,
    });
  }

  return {
    cities: mapCities,
    countries: [...countryKinds].map(([iso, kind]) => ({ iso, kind })),
    trips: mapTrips,
  };
}

/** A numbered place as drawn on the globe. */
export interface MapPlace {
  id: string;
  tripId: string;
  number: number;
  lat: number;
  lng: number;
  seen: boolean;
}

type Ring = [number, number][];

function ringArea(ring: Ring): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j]![0] + ring[i]![0]) * (ring[j]![1] - ring[i]![1]);
  }
  return Math.abs(area / 2);
}

/** Bounds of a country's largest landmass, so framing France doesn't swing out to French Guiana
 * or the US to Hawaii. */
export function mainlandBounds(geometry: { type: string; coordinates?: unknown }): Bounds | null {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as Ring[]]
      : geometry.type === 'MultiPolygon'
        ? (geometry.coordinates as Ring[][])
        : [];
  const outer = polygons
    .map((rings) => rings[0])
    .filter((ring): ring is Ring => !!ring && ring.length > 2)
    .sort((a, b) => ringArea(b) - ringArea(a))[0];
  if (!outer) return null;
  return boundsOf(outer.map(([lng, lat]) => ({ lat, lng })));
}

export function unionBounds(...all: (Bounds | null | undefined)[]): Bounds | null {
  const present = all.filter((b): b is Bounds => !!b);
  if (present.length === 0) return null;
  return [
    [Math.min(...present.map((b) => b[0][0])), Math.min(...present.map((b) => b[0][1]))],
    [Math.max(...present.map((b) => b[1][0])), Math.max(...present.map((b) => b[1][1]))],
  ];
}
