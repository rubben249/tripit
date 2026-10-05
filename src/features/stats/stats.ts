import { differenceInCalendarDays, min, parseISO } from 'date-fns';

import { getEffectiveStatus } from '@/features/trips/status';
import type { Trip } from '@/features/trips/types';

export interface StatsCity {
  tripId: string;
  name: string;
  countryCode: string | null;
}

export interface StatsBooking {
  tripId: string;
  price: number | null;
  currency: string | null;
}

export interface TravelStats {
  /** Trips already taken or in progress. */
  traveledTrips: number;
  upcomingTrips: number;
  countries: string[];
  cities: number;
  daysTraveling: number;
  /** Spending on traveled trips, per currency — converting is up to the caller. */
  spentByCurrency: Record<string, number>;
}

/** Only trips that actually happened (or are happening) count toward "where you've been". */
export function computeStats(
  trips: Trip[],
  cities: StatsCity[],
  bookings: StatsBooking[],
  fallbackCurrency: string,
  now: Date = new Date(),
): TravelStats {
  const traveled = trips.filter((t) => {
    const status = getEffectiveStatus(t, now);
    return status === 'past' || status === 'ongoing';
  });
  const traveledIds = new Set(traveled.map((t) => t.id));
  const tripCurrency = new Map(trips.map((t) => [t.id, t.defaultCurrency]));

  const visitedCities = cities.filter((c) => traveledIds.has(c.tripId));
  const countries = [
    ...new Set(visitedCities.map((c) => c.countryCode).filter((c): c is string => !!c)),
  ].sort();
  const cityNames = new Set(
    visitedCities.map((c) => `${c.name.trim().toLowerCase()}|${c.countryCode ?? ''}`),
  );

  const daysTraveling = traveled.reduce((sum, t) => {
    if (!t.startDate || !t.endDate) return sum;
    const end = min([parseISO(t.endDate), now]);
    return sum + Math.max(0, differenceInCalendarDays(end, parseISO(t.startDate)) + 1);
  }, 0);

  const spentByCurrency: Record<string, number> = {};
  for (const b of bookings) {
    if (b.price == null || !traveledIds.has(b.tripId)) continue;
    const currency = b.currency ?? tripCurrency.get(b.tripId) ?? fallbackCurrency;
    spentByCurrency[currency] = (spentByCurrency[currency] ?? 0) + b.price;
  }

  return {
    traveledTrips: traveled.length,
    upcomingTrips: trips.filter((t) => getEffectiveStatus(t, now) === 'upcoming').length,
    countries,
    cities: cityNames.size,
    daysTraveling,
    spentByCurrency,
  };
}
