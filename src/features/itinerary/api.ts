import { getDb } from '@/lib/db/client';
import { generateId } from '@/lib/id';
import { eachDateBetween } from '@/lib/dates';

import type { Booking, City, ItineraryDay, NewBookingInput, NewCityInput } from './types';

// --- Cities -----------------------------------------------------------

interface CityRow {
  id: string;
  trip_id: string;
  name: string;
  country_code: string | null;
  lat: number | null;
  lng: number | null;
  arrival_date: string | null;
  departure_date: string | null;
  order_index: number;
}

function rowToCity(row: CityRow): City {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    countryCode: row.country_code,
    lat: row.lat,
    lng: row.lng,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    orderIndex: row.order_index,
  };
}

export async function listCities(tripId: string): Promise<City[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CityRow>(
    'select * from cities where trip_id = ? order by order_index asc',
    tripId,
  );
  return rows.map(rowToCity);
}

export async function addCity(tripId: string, input: NewCityInput): Promise<City> {
  const db = await getDb();
  const id = generateId();
  const countRow = await db.getFirstAsync<{ n: number }>(
    'select count(*) as n from cities where trip_id = ?',
    tripId,
  );
  const orderIndex = countRow?.n ?? 0;

  await db.runAsync(
    `insert into cities (id, trip_id, name, country_code, lat, lng, arrival_date, departure_date, order_index)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    tripId,
    input.name,
    input.countryCode ?? null,
    input.lat ?? null,
    input.lng ?? null,
    input.arrivalDate ?? null,
    input.departureDate ?? null,
    orderIndex,
  );

  if (input.arrivalDate && input.departureDate) {
    await ensureItineraryDays(tripId, id, input.arrivalDate, input.departureDate);
  }

  const cities = await listCities(tripId);
  const created = cities.find((c) => c.id === id);
  if (!created) throw new Error('Failed to create city');
  return created;
}

export async function setCityLocation(
  id: string,
  location: { lat: number; lng: number; countryCode: string | null },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'update cities set lat = ?, lng = ?, country_code = ? where id = ?',
    location.lat,
    location.lng,
    location.countryCode,
    id,
  );
}

/** Cities (of trips not in the trash) that have no coordinates yet — added before geocoding
 * existed, or while offline. */
export async function listCitiesWithoutLocation(): Promise<City[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CityRow>(
    `select c.* from cities c join trips t on t.id = c.trip_id
     where t.deleted_at is null and (c.lat is null or c.lng is null)`,
  );
  return rows.map(rowToCity);
}

/** Every city of every trip not in the trash — for the world map. */
export async function listAllCities(): Promise<City[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CityRow>(
    `select c.* from cities c join trips t on t.id = c.trip_id
     where t.deleted_at is null order by c.trip_id, c.order_index`,
  );
  return rows.map(rowToCity);
}

// --- Itinerary days -----------------------------------------------------

interface DayRow {
  id: string;
  trip_id: string;
  city_id: string | null;
  date: string;
  day_index: number;
  notes: string | null;
}

function rowToDay(row: DayRow): ItineraryDay {
  return {
    id: row.id,
    tripId: row.trip_id,
    cityId: row.city_id,
    date: row.date,
    dayIndex: row.day_index,
    notes: row.notes,
  };
}

/**
 * `day_index` is recomputed here from chronological order rather than trusted
 * from storage: cities can be added out of date order (e.g. a later city
 * added before an earlier one), so the insertion-order value written by
 * ensureItineraryDays below cannot be relied on for display/ordering.
 */
export async function listItineraryDays(tripId: string): Promise<ItineraryDay[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DayRow>(
    'select * from itinerary_days where trip_id = ? order by date asc',
    tripId,
  );
  return rows.map((row, index) => ({ ...rowToDay(row), dayIndex: index }));
}

/** Creates one itinerary_days row per date in range that doesn't already exist, linked to the given city. */
export async function ensureItineraryDays(
  tripId: string,
  cityId: string | null,
  startDate: string,
  endDate: string,
): Promise<void> {
  const db = await getDb();
  const dates = eachDateBetween(startDate, endDate);
  const existing = await db.getAllAsync<{ date: string }>(
    'select date from itinerary_days where trip_id = ?',
    tripId,
  );
  const existingDates = new Set(existing.map((r) => r.date));

  for (const date of dates) {
    if (existingDates.has(date)) continue;
    // day_index here is just a placeholder — listItineraryDays recomputes it
    // from sorted dates on every read, since insertion order isn't reliable.
    await db.runAsync(
      'insert into itinerary_days (id, trip_id, city_id, date, day_index) values (?, ?, ?, ?, 0)',
      generateId(),
      tripId,
      cityId,
      date,
    );
  }
}

// --- Bookings -------------------------------------------------------------

interface BookingRow {
  id: string;
  trip_id: string | null;
  city_id: string | null;
  day_id: string | null;
  category_key: string;
  status: Booking['status'];
  title: string;
  start_at: string | null;
  end_at: string | null;
  timezone: string | null;
  location_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  details: string | null;
  price: number | null;
  currency: string | null;
  notes: string | null;
  order_index: number;
  visited_at: string | null;
  geocoded_query: string | null;
  created_at: string;
  updated_at: string;
}

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    tripId: row.trip_id,
    cityId: row.city_id,
    dayId: row.day_id,
    categoryKey: row.category_key as Booking['categoryKey'],
    status: row.status,
    title: row.title,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    locationName: row.location_name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    details: row.details ? JSON.parse(row.details) : null,
    price: row.price,
    currency: row.currency,
    notes: row.notes,
    orderIndex: row.order_index,
    visitedAt: row.visited_at,
    geocodedQuery: row.geocoded_query,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBookings(tripId: string): Promise<Booking[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookingRow>(
    'select * from bookings where trip_id = ? order by day_id, order_index asc',
    tripId,
  );
  return rows.map(rowToBooking);
}

/** Notes that belong to no trip — created from the Now tab. */
export async function listGeneralNotes(): Promise<Booking[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookingRow>(
    "select * from bookings where trip_id is null and category_key = 'note' order by updated_at desc",
  );
  return rows.map(rowToBooking);
}

export async function createBooking(
  tripId: string | null,
  input: NewBookingInput,
): Promise<Booking> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  const countRow = await db.getFirstAsync<{ n: number }>(
    'select count(*) as n from bookings where trip_id is ? and day_id is ?',
    tripId,
    input.dayId ?? null,
  );
  const orderIndex = countRow?.n ?? 0;

  await db.runAsync(
    `insert into bookings
       (id, trip_id, city_id, day_id, category_key, status, title, start_at, end_at, timezone,
        location_name, address, details, price, currency, notes, order_index, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    tripId,
    input.cityId ?? null,
    input.dayId ?? null,
    input.categoryKey,
    input.status,
    input.title,
    input.startAt ?? null,
    input.endAt ?? null,
    input.timezone ?? null,
    input.locationName ?? null,
    input.address ?? null,
    input.details ? JSON.stringify(input.details) : null,
    input.price ?? null,
    input.currency ?? null,
    input.notes ?? null,
    orderIndex,
    now,
    now,
  );

  const rows = await db.getAllAsync<BookingRow>('select * from bookings where id = ?', id);
  const created = rows[0];
  if (!created) throw new Error('Failed to create booking');
  return rowToBooking(created);
}

export type BookingUpdate = Partial<
  Pick<
    Booking,
    | 'title'
    | 'status'
    | 'categoryKey'
    | 'dayId'
    | 'cityId'
    | 'startAt'
    | 'endAt'
    | 'timezone'
    | 'locationName'
    | 'address'
    | 'details'
    | 'price'
    | 'currency'
    | 'notes'
    | 'orderIndex'
    | 'lat'
    | 'lng'
    | 'visitedAt'
    | 'geocodedQuery'
  >
>;

export async function getBooking(id: string): Promise<Booking | null> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookingRow>('select * from bookings where id = ?', id);
  return rows[0] ? rowToBooking(rows[0]) : null;
}

export async function updateBooking(id: string, update: BookingUpdate): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookingRow>('select * from bookings where id = ?', id);
  const current = rows[0];
  if (!current) throw new Error(`Booking ${id} not found`);
  const existing = rowToBooking(current);
  const next = { ...existing, ...update, updatedAt: new Date().toISOString() };

  await db.runAsync(
    `update bookings set title = ?, status = ?, category_key = ?, day_id = ?, city_id = ?,
       start_at = ?, end_at = ?, timezone = ?, location_name = ?, address = ?, details = ?,
       price = ?, currency = ?, notes = ?, order_index = ?, lat = ?, lng = ?, visited_at = ?,
       geocoded_query = ?, updated_at = ? where id = ?`,
    next.title,
    next.status,
    next.categoryKey,
    next.dayId,
    next.cityId,
    next.startAt,
    next.endAt,
    next.timezone,
    next.locationName,
    next.address,
    next.details ? JSON.stringify(next.details) : null,
    next.price,
    next.currency,
    next.notes,
    next.orderIndex,
    next.lat,
    next.lng,
    next.visitedAt,
    next.geocodedQuery,
    next.updatedAt,
    id,
  );
}

export async function deleteBooking(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('delete from bookings where id = ?', id);
}
