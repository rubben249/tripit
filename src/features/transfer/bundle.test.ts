import { describe, expect, it } from '@jest/globals';

import { bundleSchema, emptyTables, pickColumns, remapIds, summarizeBundle } from './bundle';

function sampleTables() {
  const tables = emptyTables();
  tables.trips = [{ id: 'trip', name: 'Rome' }];
  tables.cities = [{ id: 'city', trip_id: 'trip', name: 'Rome' }];
  tables.itinerary_days = [{ id: 'day', trip_id: 'trip', city_id: 'city', date: '2026-10-09' }];
  tables.bookings = [
    { id: 'lunch', trip_id: 'trip', city_id: 'city', day_id: 'day', category_key: 'restaurant' },
    { id: 'note', trip_id: 'trip', city_id: null, day_id: null, category_key: 'note' },
    { id: 'task', trip_id: 'trip', category_key: 'task' },
  ];
  tables.note_photos = [{ id: 'photo', note_id: 'note', name: 'pic' }];
  return tables;
}

describe('remapIds', () => {
  it('gives every row a new id and keeps references consistent', () => {
    let n = 0;
    const out = remapIds(sampleTables(), () => `new-${++n}`);
    const trip = out.trips[0]!;
    const city = out.cities[0]!;
    const day = out.itinerary_days[0]!;
    const note = out.bookings[1]!;

    expect(trip.id).not.toBe('trip');
    expect(city.trip_id).toBe(trip.id);
    expect(day.city_id).toBe(city.id);
    expect(out.bookings[0]!.day_id).toBe(day.id);
    expect(out.note_photos[0]!.note_id).toBe(note.id);
    expect(note.city_id).toBeNull();
  });

  it('leaves references to rows outside the bundle untouched', () => {
    const tables = emptyTables();
    tables.bookings = [{ id: 'b', trip_id: 'elsewhere', category_key: 'note' }];
    const out = remapIds(tables, () => 'x');
    expect(out.bookings[0]!.trip_id).toBe('elsewhere');
  });
});

describe('pickColumns', () => {
  it('drops unknown keys and fills missing columns with null, in schema order', () => {
    const values = pickColumns('trip_participants', {
      display_name: 'Ana',
      id: 'p',
      'id); drop table trips; --': 'x',
    });
    expect(values).toEqual(['p', null, 'Ana', null]);
  });
});

describe('bundleSchema', () => {
  it('rejects files that are not TripIt bundles', () => {
    expect(bundleSchema.safeParse({ format: 'other' }).success).toBe(false);
  });

  it('accepts a well-formed bundle', () => {
    const bundle = {
      format: 'tripit',
      version: 1,
      kind: 'backup',
      exportedAt: '2026-10-05T00:00:00Z',
      tables: sampleTables(),
    };
    expect(bundleSchema.safeParse(bundle).success).toBe(true);
  });
});

describe('summarizeBundle', () => {
  it('counts reservations separately from notes and tasks', () => {
    expect(summarizeBundle(sampleTables())).toEqual({
      trips: 1,
      cities: 1,
      reservations: 1,
      notes: 1,
      tasks: 1,
      photos: 1,
    });
  });
});
