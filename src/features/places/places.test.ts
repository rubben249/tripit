import { describe, expect, it } from '@jest/globals';

import { makeBooking, makeCity, makeDay } from '@/test/factories';

import { buildPlaces, isNumberedPlace, placeQuery } from './places';

const days = [
  makeDay({ id: 'd1', date: '2026-10-09', cityId: 'rome' }),
  makeDay({ id: 'd2', date: '2026-10-10', cityId: 'rome' }),
];
const cities = [makeCity({ id: 'rome', lat: 41.9, lng: 12.5 })];

const booked = (overrides: Parameters<typeof makeBooking>[0]) =>
  makeBooking({ status: 'booked', locationName: 'Somewhere', ...overrides });

describe('isNumberedPlace', () => {
  it('counts booked or paid places with a location', () => {
    expect(isNumberedPlace(booked({ categoryKey: 'restaurant' }))).toBe(true);
    expect(isNumberedPlace(booked({ categoryKey: 'accommodation', status: 'paid' }))).toBe(true);
  });

  it('leaves out ideas, cancellations, transport, notes and places without a location', () => {
    expect(isNumberedPlace(booked({ status: 'idea' }))).toBe(false);
    expect(isNumberedPlace(booked({ status: 'cancelled' }))).toBe(false);
    expect(isNumberedPlace(booked({ categoryKey: 'flight' }))).toBe(false);
    expect(isNumberedPlace(booked({ categoryKey: 'local_transport' }))).toBe(false);
    expect(isNumberedPlace(booked({ categoryKey: 'note' }))).toBe(false);
    expect(isNumberedPlace(booked({ locationName: null, address: '  ' }))).toBe(false);
  });
});

describe('placeQuery', () => {
  it('joins place name and address', () => {
    expect(placeQuery(booked({ locationName: 'Roscioli', address: 'Via dei Giubbonari 21' }))).toBe(
      'Roscioli, Via dei Giubbonari 21',
    );
  });
});

describe('buildPlaces', () => {
  it('numbers places in time order, whatever order they were added in', () => {
    const places = buildPlaces(
      [
        booked({ id: 'dinner', dayId: 'd1', startAt: '2026-10-09T20:30:00' }),
        booked({ id: 'museum', dayId: 'd2', startAt: '2026-10-10T10:00:00' }),
        booked({ id: 'lunch', dayId: 'd1', startAt: '2026-10-09T13:00:00' }),
      ],
      days,
      cities,
    );
    expect(places.map((p) => [p.booking.id, p.number])).toEqual([
      ['lunch', 1],
      ['dinner', 2],
      ['museum', 3],
    ]);
  });

  it('places a date-only hotel check-in in the afternoon and untimed bookings at noon', () => {
    const places = buildPlaces(
      [
        booked({ id: 'dinner', dayId: 'd1', startAt: '2026-10-09T20:00:00' }),
        booked({ id: 'hotel', dayId: 'd1', categoryKey: 'accommodation', startAt: '2026-10-09' }),
        booked({ id: 'lunch', dayId: 'd1', startAt: '2026-10-09T13:00:00' }),
        booked({ id: 'untimed', dayId: 'd1' }),
      ],
      days,
      cities,
    );
    expect(places.map((p) => p.booking.id)).toEqual(['untimed', 'lunch', 'hotel', 'dinner']);
  });

  it('uses the booking’s own coordinates, or falls back to its city', () => {
    const [own, fallback] = buildPlaces(
      [
        booked({ id: 'own', dayId: 'd1', startAt: '2026-10-09T10:00:00', lat: 41.89, lng: 12.47 }),
        booked({ id: 'fallback', dayId: 'd1', startAt: '2026-10-09T11:00:00' }),
      ],
      days,
      cities,
    );
    expect(own).toMatchObject({ lat: 41.89, lng: 12.47, approximate: false });
    expect(fallback).toMatchObject({ lat: 41.9, lng: 12.5, approximate: true, cityId: 'rome' });
  });

  it('reports places marked as seen', () => {
    const [place] = buildPlaces(
      [booked({ dayId: 'd1', visitedAt: '2026-10-09T15:00:00Z' })],
      days,
      cities,
    );
    expect(place?.seen).toBe(true);
  });

  it('skips places that cannot be drawn anywhere, without leaving a gap in the numbers', () => {
    const places = buildPlaces(
      [
        booked({ id: 'nowhere', startAt: '2026-10-09T09:00:00' }),
        booked({ id: 'here', dayId: 'd1', startAt: '2026-10-09T10:00:00' }),
      ],
      days,
      cities,
    );
    expect(places.map((p) => [p.booking.id, p.number])).toEqual([['here', 1]]);
  });
});
