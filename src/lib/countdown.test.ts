import { describe, expect, it } from '@jest/globals';

import { formatCountdown, getCountdownParts } from './countdown';

describe('getCountdownParts', () => {
  it('returns null once the start day has arrived', () => {
    const now = new Date('2026-01-05T10:00:00');
    expect(getCountdownParts('2026-01-05', now)).toBeNull();
  });

  it('returns null for a past date', () => {
    const now = new Date('2026-01-05T10:00:00');
    expect(getCountdownParts('2026-01-01', now)).toBeNull();
  });

  it('breaks down days/hours/minutes for a near date', () => {
    const now = new Date('2026-01-01T10:00:00');
    expect(getCountdownParts('2026-01-05', now)).toEqual({
      months: 0,
      days: 3,
      hours: 14,
      minutes: 0,
    });
  });

  it('folds years into months', () => {
    const now = new Date('2026-01-01T00:00:00');
    expect(getCountdownParts('2027-04-01', now)).toEqual({
      months: 15,
      days: 0,
      hours: 0,
      minutes: 0,
    });
  });
});

describe('formatCountdown', () => {
  it('includes months only when a month or more remains', () => {
    const now = new Date('2026-01-01T00:00:00');
    expect(formatCountdown('2026-03-10', now)).toBe('2 months, 9 days');
  });

  it('omits zero-valued units', () => {
    const now = new Date('2026-01-01T10:00:00');
    expect(formatCountdown('2026-01-05', now)).toBe('3 days, 14 hours');
  });

  it('uses singular units correctly', () => {
    const now = new Date('2026-01-01T00:00:00');
    expect(formatCountdown('2026-01-02', now)).toBe('1 day');
  });

  it('drops to minutes-only in the final hour', () => {
    const now = new Date('2026-01-04T23:45:00');
    expect(formatCountdown('2026-01-05', now)).toBe('15 minutes');
  });

  it('returns null once the trip has started', () => {
    const now = new Date('2026-01-05T00:00:00');
    expect(formatCountdown('2026-01-05', now)).toBeNull();
  });
});
