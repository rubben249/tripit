import { getDb } from '@/lib/db/client';

import type { StatsBooking, StatsCity } from './stats';

/** Cities and priced bookings across every trip not in the trash. */
export async function loadStatsData(): Promise<{ cities: StatsCity[]; bookings: StatsBooking[] }> {
  const db = await getDb();
  const cities = await db.getAllAsync<{
    trip_id: string;
    name: string;
    country_code: string | null;
  }>(
    `select c.trip_id, c.name, c.country_code from cities c
       join trips t on t.id = c.trip_id where t.deleted_at is null`,
  );
  const bookings = await db.getAllAsync<{
    trip_id: string;
    price: number;
    currency: string | null;
  }>(
    `select b.trip_id, b.price, b.currency from bookings b
       join trips t on t.id = b.trip_id where t.deleted_at is null and b.price is not null`,
  );
  return {
    cities: cities.map((c) => ({ tripId: c.trip_id, name: c.name, countryCode: c.country_code })),
    bookings: bookings.map((b) => ({ tripId: b.trip_id, price: b.price, currency: b.currency })),
  };
}
