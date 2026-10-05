import { describe, expect, it } from '@jest/globals';

import { eachDateBetween, formatDateRange, formatDayLabel, tripDurationNights } from './dates';

describe('eachDateBetween', () => {
  it('returns an inclusive list of ISO dates', () => {
    expect(eachDateBetween('2024-08-28', '2024-09-03')).toEqual([
      '2024-08-28',
      '2024-08-29',
      '2024-08-30',
      '2024-08-31',
      '2024-09-01',
      '2024-09-02',
      '2024-09-03',
    ]);
  });

  it('returns a single day when start equals end', () => {
    expect(eachDateBetween('2024-08-28', '2024-08-28')).toEqual(['2024-08-28']);
  });

  it('throws when endDate is before startDate', () => {
    expect(() => eachDateBetween('2024-09-03', '2024-08-28')).toThrow();
  });

  it('crosses a month boundary correctly (the PDF example trip)', () => {
    const days = eachDateBetween('2024-08-30', '2024-09-01');
    expect(days).toEqual(['2024-08-30', '2024-08-31', '2024-09-01']);
  });
});

describe('formatDayLabel', () => {
  it('formats as weekday + day + month', () => {
    expect(formatDayLabel('2024-08-28')).toBe('Wed 28 Aug');
  });
});

describe('formatDateRange', () => {
  it('collapses the month when both dates share one', () => {
    expect(formatDateRange('2024-08-28', '2024-08-30')).toBe('28 – 30 Aug');
  });

  it('shows both months when the range spans two', () => {
    expect(formatDateRange('2024-08-30', '2024-09-03')).toBe('30 Aug – 3 Sep');
  });
});

describe('tripDurationNights', () => {
  it('computes nights, not days', () => {
    expect(tripDurationNights('2024-08-28', '2024-09-03')).toBe(6);
  });

  it('is zero for a same-day trip', () => {
    expect(tripDurationNights('2024-08-28', '2024-08-28')).toBe(0);
  });
});
