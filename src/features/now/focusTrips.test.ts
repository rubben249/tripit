import { describe, expect, it } from '@jest/globals';

import { makeTrip } from '@/test/factories';

import { getFocusTrips, getNextTrip } from './focusTrips';

const now = new Date(2026, 9, 5, 12, 0); // 5 Oct 2026, local time

describe('getFocusTrips', () => {
  it('includes ongoing trips first, then trips starting within a week', () => {
    const soon = makeTrip({ id: 'soon', startDate: '2026-10-10', endDate: '2026-10-15' });
    const ongoing = makeTrip({ id: 'ongoing', startDate: '2026-10-01', endDate: '2026-10-08' });
    const far = makeTrip({ id: 'far', startDate: '2026-11-20', endDate: '2026-11-25' });
    expect(getFocusTrips([soon, far, ongoing], now).map((t) => t.id)).toEqual(['ongoing', 'soon']);
  });

  it('counts a trip starting exactly seven days ahead, but not eight', () => {
    const seven = makeTrip({ id: 'seven', startDate: '2026-10-12', endDate: '2026-10-14' });
    const eight = makeTrip({ id: 'eight', startDate: '2026-10-13', endDate: '2026-10-14' });
    expect(getFocusTrips([seven, eight], now).map((t) => t.id)).toEqual(['seven']);
  });

  it('ignores drafts, past and archived trips', () => {
    const trips = [
      makeTrip({ id: 'draft', status: 'draft', startDate: '2026-10-06', endDate: '2026-10-07' }),
      makeTrip({ id: 'past', startDate: '2026-09-01', endDate: '2026-09-05' }),
      makeTrip({ id: 'arch', status: 'archived', startDate: '2026-10-04', endDate: '2026-10-07' }),
    ];
    expect(getFocusTrips(trips, now)).toEqual([]);
  });
});

describe('getNextTrip', () => {
  it('returns the earliest upcoming trip', () => {
    const a = makeTrip({ id: 'a', startDate: '2026-12-01', endDate: '2026-12-03' });
    const b = makeTrip({ id: 'b', startDate: '2026-11-01', endDate: '2026-11-03' });
    expect(getNextTrip([a, b], now)?.id).toBe('b');
  });

  it('returns null when nothing is upcoming', () => {
    expect(getNextTrip([], now)).toBeNull();
  });
});
