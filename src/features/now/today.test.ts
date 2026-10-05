import { describe, expect, it } from '@jest/globals';

import { makeBooking, makeCity, makeDay } from '@/test/factories';

import { getNextUp, getTodayPlan } from './today';

const days = [
  makeDay({ id: 'd1', date: '2026-10-09', cityId: 'c1' }),
  makeDay({ id: 'd2', date: '2026-10-10', cityId: 'c1' }),
  makeDay({ id: 'd3', date: '2026-10-11', cityId: 'c1' }),
];
const cities = [makeCity({ id: 'c1', name: 'Rome' })];

describe('getTodayPlan', () => {
  const now = new Date(2026, 9, 10, 13, 0); // 10 Oct, 13:00 local

  it('returns null on a date outside the itinerary', () => {
    expect(getTodayPlan(days, cities, [], new Date(2026, 9, 20))).toBeNull();
  });

  it('locates the day, its number and city', () => {
    const plan = getTodayPlan(days, cities, [], now);
    expect(plan?.dayNumber).toBe(2);
    expect(plan?.totalDays).toBe(3);
    expect(plan?.city?.name).toBe('Rome');
  });

  it('marks timed bookings as done, now or upcoming against the clock', () => {
    const bookings = [
      makeBooking({ id: 'lunch', dayId: 'd2', startAt: '2026-10-10T12:00:00' }),
      makeBooking({
        id: 'museum',
        dayId: 'd2',
        categoryKey: 'ticket_activity',
        startAt: '2026-10-10T12:30:00',
        endAt: '2026-10-10T15:00:00',
      }),
      makeBooking({ id: 'dinner', dayId: 'd2', startAt: '2026-10-10T20:30:00' }),
    ];
    const plan = getTodayPlan(days, cities, bookings, now);
    expect(plan?.items.map((i) => [i.booking.id, i.state, i.timeLabel])).toEqual([
      ['lunch', 'done', '12:00'],
      ['museum', 'now', '12:30'],
      ['dinner', 'upcoming', '20:30'],
    ]);
  });

  it('lists date-only stays first with a check-in/out label, and leaves out notes and tasks', () => {
    const bookings = [
      makeBooking({ id: 'dinner', dayId: 'd2', startAt: '2026-10-10T20:30:00' }),
      makeBooking({
        id: 'hotel',
        dayId: 'd1',
        categoryKey: 'accommodation',
        startAt: '2026-10-09',
        endAt: '2026-10-10',
      }),
      makeBooking({ id: 'note', dayId: 'd2', categoryKey: 'note' }),
    ];
    const plan = getTodayPlan(days, cities, bookings, now);
    expect(plan?.items.map((i) => [i.booking.id, i.timeLabel])).toEqual([
      ['hotel', 'Check-out'],
      ['dinner', '20:30'],
    ]);
  });
});

describe('getNextUp', () => {
  it('returns the earliest timed booking still ahead, on any day', () => {
    const now = new Date(2026, 9, 10, 21, 0);
    const bookings = [
      makeBooking({ id: 'past', startAt: '2026-10-10T20:30:00' }),
      makeBooking({ id: 'train', categoryKey: 'train', startAt: '2026-10-11T09:15:00' }),
      makeBooking({ id: 'later', startAt: '2026-10-11T19:00:00' }),
      makeBooking({ id: 'untimed', startAt: null }),
    ];
    expect(getNextUp(bookings, now)?.id).toBe('train');
  });
});
