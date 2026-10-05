import { describe, expect, it } from '@jest/globals';

import { getEffectiveStatus } from './status';
import type { Trip } from './types';

function makeTrip(overrides: Partial<Trip>): Trip {
  return {
    id: 't1',
    name: 'Test trip',
    description: null,
    status: 'upcoming',
    startDate: null,
    endDate: null,
    defaultCurrency: 'EUR',
    coverImageUrl: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('getEffectiveStatus', () => {
  const now = new Date('2024-08-29T12:00:00.000Z');

  it('returns draft when there are no dates yet, regardless of stored status', () => {
    const trip = makeTrip({ status: 'upcoming', startDate: null, endDate: null });
    expect(getEffectiveStatus(trip, now)).toBe('draft');
  });

  it('returns upcoming before the start date', () => {
    const trip = makeTrip({ startDate: '2024-09-01', endDate: '2024-09-05' });
    expect(getEffectiveStatus(trip, now)).toBe('upcoming');
  });

  it('returns ongoing between start and end date (inclusive)', () => {
    const trip = makeTrip({ startDate: '2024-08-28', endDate: '2024-09-03' });
    expect(getEffectiveStatus(trip, now)).toBe('ongoing');
  });

  it('treats the end date itself as still ongoing', () => {
    const trip = makeTrip({ startDate: '2024-08-20', endDate: '2024-08-29' });
    expect(getEffectiveStatus(trip, now)).toBe('ongoing');
  });

  it('returns past after the end date', () => {
    const trip = makeTrip({ startDate: '2024-01-01', endDate: '2024-01-05' });
    expect(getEffectiveStatus(trip, now)).toBe('past');
  });

  it('never overrides an explicit draft status', () => {
    const trip = makeTrip({ status: 'draft', startDate: '2024-08-20', endDate: '2024-08-29' });
    expect(getEffectiveStatus(trip, now)).toBe('draft');
  });

  it('never overrides an explicit archived status', () => {
    const trip = makeTrip({ status: 'archived', startDate: '2024-08-20', endDate: '2024-08-29' });
    expect(getEffectiveStatus(trip, now)).toBe('archived');
  });
});
