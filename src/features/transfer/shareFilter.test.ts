import { describe, expect, it } from '@jest/globals';

import { emptyTables } from './bundle';
import { DEFAULT_SHARE_OPTIONS, filterForShare } from './shareFilter';

function tripTables() {
  const t = emptyTables();
  t.trips = [{ id: 'trip', name: 'Rome', deleted_at: null }];
  t.cities = [{ id: 'city', trip_id: 'trip', name: 'Rome' }];
  t.itinerary_days = [{ id: 'day', trip_id: 'trip', date: '2026-10-09' }];
  t.trip_participants = [{ id: 'p', trip_id: 'trip', display_name: 'Ana' }];
  t.bookings = [
    {
      id: 'flight',
      trip_id: 'trip',
      category_key: 'flight',
      price: 120,
      currency: 'EUR',
      details: JSON.stringify({ carrierNumber: 'IB3240', departureLocation: 'MAD T4' }),
    },
    { id: 'note', trip_id: 'trip', category_key: 'note', price: null, details: null },
    { id: 'task', trip_id: 'trip', category_key: 'task', details: JSON.stringify({ done: true }) },
  ];
  t.note_photos = [
    { id: 'photo', note_id: 'note', data: 'data:image/jpeg;base64,xx' },
    { id: 'orphan', note_id: 'elsewhere', data: 'x' },
  ];
  return t;
}

describe('filterForShare', () => {
  it('strips booking numbers by default but keeps the rest of the details', () => {
    const out = filterForShare(tripTables(), DEFAULT_SHARE_OPTIONS);
    const details = JSON.parse(out.bookings[0]!.details as string);
    expect(details).toEqual({ departureLocation: 'MAD T4' });
    expect(JSON.stringify(out)).not.toContain('IB3240');
  });

  it('never sends the sender\'s "seen" marks', () => {
    const tables = tripTables();
    tables.bookings[0]!.visited_at = '2026-10-05T10:00:00Z';
    const out = filterForShare(tables, DEFAULT_SHARE_OPTIONS);
    expect(out.bookings[0]!.visited_at).toBeNull();
  });

  it('keeps booking numbers only when asked to', () => {
    const out = filterForShare(tripTables(), { ...DEFAULT_SHARE_OPTIONS, bookingNumbers: true });
    expect(JSON.stringify(out)).toContain('IB3240');
  });

  it('removes prices from the payload when prices are left out', () => {
    const out = filterForShare(tripTables(), { ...DEFAULT_SHARE_OPTIONS, prices: false });
    expect(out.bookings[0]).toMatchObject({ price: null, currency: null });
  });

  it('drops excluded categories, and photos of notes that do not travel', () => {
    const out = filterForShare(tripTables(), {
      ...DEFAULT_SHARE_OPTIONS,
      notes: false,
      people: false,
    });
    expect(out.bookings.map((b) => b.id)).toEqual(['flight', 'task']);
    expect(out.note_photos).toEqual([]);
    expect(out.trip_participants).toEqual([]);
  });

  it('only sends photos attached to bookings in the share', () => {
    const out = filterForShare(tripTables(), DEFAULT_SHARE_OPTIONS);
    expect(out.note_photos.map((p) => p.id)).toEqual(['photo']);
  });

  it('always sends the itinerary skeleton', () => {
    const out = filterForShare(tripTables(), {
      reservations: false,
      bookingNumbers: false,
      prices: false,
      notes: false,
      tasks: false,
      photos: false,
      people: false,
    });
    expect(out.trips).toHaveLength(1);
    expect(out.cities).toHaveLength(1);
    expect(out.itinerary_days).toHaveLength(1);
    expect(out.bookings).toEqual([]);
  });
});
