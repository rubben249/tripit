import { describe, expect, it } from '@jest/globals';

import { makeTrip } from '@/test/factories';

import { computeStats, countryFlag } from './stats';

const now = new Date(2026, 9, 5, 12, 0);
const past = makeTrip({ id: 'past', startDate: '2026-08-01', endDate: '2026-08-05' });
const ongoing = makeTrip({ id: 'now', startDate: '2026-10-04', endDate: '2026-10-07' });
const upcoming = makeTrip({ id: 'soon', startDate: '2026-12-01', endDate: '2026-12-03' });

describe('computeStats', () => {
  const stats = computeStats(
    [past, ongoing, upcoming],
    [
      { tripId: 'past', name: 'Rome', countryCode: 'IT' },
      { tripId: 'past', name: 'Florence', countryCode: 'IT' },
      { tripId: 'now', name: 'rome ', countryCode: 'IT' },
      { tripId: 'soon', name: 'Tokyo', countryCode: 'JP' },
    ],
    [
      { tripId: 'past', price: 100, currency: 'EUR' },
      { tripId: 'now', price: 20, currency: null },
      { tripId: 'now', price: 50, currency: 'USD' },
      { tripId: 'soon', price: 999, currency: 'JPY' },
    ],
    'EUR',
    now,
  );

  it('counts only trips already traveled or in progress', () => {
    expect(stats.traveledTrips).toBe(2);
    expect(stats.upcomingTrips).toBe(1);
    expect(stats.countries).toEqual(['IT']);
  });

  it('counts the same city once even across trips and spelling case', () => {
    expect(stats.cities).toBe(2);
  });

  it('counts travel days, stopping at today for the trip in progress', () => {
    // 1–5 Aug = 5 days, 4–5 Oct so far = 2 days
    expect(stats.daysTraveling).toBe(7);
  });

  it('totals spending per currency, using the trip currency when a booking has none', () => {
    expect(stats.spentByCurrency).toEqual({ EUR: 120, USD: 50 });
  });
});

describe('countryFlag', () => {
  it('turns an ISO code into its flag emoji', () => {
    expect(countryFlag('it')).toBe('🇮🇹');
  });
});
