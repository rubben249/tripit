/**
 * Versioned local-database migrations (SQLite via expo-sqlite — same engine
 * on iOS/Android/web, see CLAUDE.md "Modelo local-first"). Each entry runs
 * once, in order, tracked via `PRAGMA user_version`. Never edit a migration
 * that has already shipped — add a new one instead.
 *
 * Scope for Fase 2: trips, participants, cities, itinerary days, bookings.
 * Expenses/tasks/packing/documents/activity log land with the phases that
 * actually need them (see docs/PLAN.md section 4) — no point modelling
 * tables nothing reads or writes yet.
 */
export const migrations: string[] = [
  // v1 — core trip + itinerary tables
  `
  create table trips (
    id text primary key,
    name text not null,
    description text,
    status text not null default 'draft'
      check (status in ('draft','upcoming','ongoing','past','archived')),
    start_date text,
    end_date text,
    default_currency text not null default 'EUR',
    cover_image_url text,
    created_at text not null,
    updated_at text not null,
    deleted_at text
  );

  create table trip_participants (
    id text primary key,
    trip_id text not null references trips(id) on delete cascade,
    display_name text not null,
    created_at text not null
  );

  create table cities (
    id text primary key,
    trip_id text not null references trips(id) on delete cascade,
    name text not null,
    country_code text,
    lat real,
    lng real,
    arrival_date text,
    departure_date text,
    order_index integer not null default 0
  );

  create table itinerary_days (
    id text primary key,
    trip_id text not null references trips(id) on delete cascade,
    city_id text references cities(id) on delete set null,
    date text not null,
    day_index integer not null,
    notes text
  );

  create table bookings (
    id text primary key,
    trip_id text not null references trips(id) on delete cascade,
    city_id text references cities(id) on delete set null,
    day_id text references itinerary_days(id) on delete set null,
    category_key text not null,
    status text not null default 'idea'
      check (status in ('idea','to_book','booked','paid','cancelled')),
    title text not null,
    start_at text,
    end_at text,
    timezone text,
    location_name text,
    address text,
    lat real,
    lng real,
    details text,
    price real,
    currency text,
    notes text,
    order_index integer not null default 0,
    created_at text not null,
    updated_at text not null
  );

  create index idx_trip_participants_trip on trip_participants(trip_id);
  create index idx_cities_trip on cities(trip_id);
  create index idx_itinerary_days_trip on itinerary_days(trip_id);
  create index idx_bookings_trip_day on bookings(trip_id, day_id, order_index);
  `,
];
