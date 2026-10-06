import { describe, expect, it } from '@jest/globals';

import { makeBooking, makeCity, makeDay } from '@/test/factories';

import { buildRoutes, greatCircle, routesOnDay, routeStyle, travelOrder } from './routes';

const rome = makeCity({
  id: 'rome',
  name: 'Rome',
  lat: 41.9,
  lng: 12.5,
  arrivalDate: '2026-08-28',
  departureDate: '2026-08-30',
  orderIndex: 0,
});
const florence = makeCity({
  id: 'florence',
  name: 'Florence',
  lat: 43.77,
  lng: 11.26,
  arrivalDate: '2026-08-30',
  departureDate: '2026-09-01',
  orderIndex: 1,
});
const venice = makeCity({
  id: 'venice',
  name: 'Venice',
  lat: 45.44,
  lng: 12.33,
  arrivalDate: '2026-09-01',
  departureDate: '2026-09-03',
  orderIndex: 2,
});

const days = [
  makeDay({ id: 'd1', date: '2026-08-28', dayIndex: 0, cityId: 'rome' }),
  makeDay({ id: 'd3', date: '2026-08-30', dayIndex: 2, cityId: 'florence' }),
  makeDay({ id: 'd5', date: '2026-09-01', dayIndex: 4, cityId: 'venice' }),
];

describe('travelOrder', () => {
  it('orders cities by arrival date, undated ones last', () => {
    const undated = makeCity({ id: 'extra', name: 'Pisa', orderIndex: 0 });
    const order = travelOrder([venice, undated, rome, florence]).map((c) => c.id);
    expect(order).toEqual(['rome', 'florence', 'venice', 'extra']);
  });
});

describe('buildRoutes', () => {
  it('links consecutive cities and takes the mode from the transport booked that day', () => {
    const train = makeBooking({
      id: 'train1',
      categoryKey: 'train',
      status: 'booked',
      dayId: 'd3',
      startAt: '2026-08-30T09:10',
    });
    const flight = makeBooking({
      id: 'flight1',
      categoryKey: 'flight',
      status: 'booked',
      dayId: 'd5',
      startAt: '2026-09-01T18:00',
    });
    const routes = buildRoutes([rome, florence, venice], [train, flight], days);

    expect(routes).toHaveLength(2);
    expect(routes[0]).toMatchObject({
      fromCityId: 'rome',
      toCityId: 'florence',
      mode: 'train',
      style: 'solid',
      dayId: 'd3',
      label: 'Train',
    });
    expect(routes[1]).toMatchObject({
      fromCityId: 'florence',
      toCityId: 'venice',
      mode: 'flight',
      style: 'dashed',
      dayId: 'd5',
    });
  });

  it('still draws a leg with no transport booked, and dates it from the arrival day', () => {
    const [leg] = buildRoutes([rome, florence], [], days);
    expect(leg).toMatchObject({ mode: null, style: 'faint', dayId: 'd3' });
    expect(leg!.label).toMatch(/not booked/i);
  });

  it('ignores cancelled transport and non-transport bookings', () => {
    const cancelled = makeBooking({
      id: 'x',
      categoryKey: 'train',
      status: 'cancelled',
      dayId: 'd3',
    });
    const dinner = makeBooking({
      id: 'y',
      categoryKey: 'restaurant',
      status: 'booked',
      dayId: 'd3',
    });
    const [leg] = buildRoutes([rome, florence], [cancelled, dinner], days);
    expect(leg!.mode).toBeNull();
  });

  it('never reuses one booking for two legs', () => {
    const train = makeBooking({
      id: 'train1',
      categoryKey: 'train',
      status: 'booked',
      dayId: 'd3',
      startAt: '2026-08-30T09:10',
    });
    // Rome→Florence and Florence→Venice both have a candidate date of 2026-08-30 only for the
    // first leg; the second must not borrow that train.
    const routes = buildRoutes([rome, florence, venice], [train], days);
    expect(routes.map((r) => r.mode)).toEqual(['train', null]);
  });

  it('leaves out cities with no coordinates', () => {
    const unplaced = makeCity({ id: 'nowhere', name: 'Nowhere', orderIndex: 5 });
    const routes = buildRoutes([rome, florence, unplaced], [], days);
    expect(routes.map((r) => r.id)).toEqual(['rome-florence']);
  });

  it('has no legs with fewer than two placed cities', () => {
    expect(buildRoutes([rome], [], days)).toEqual([]);
  });
});

describe('greatCircle', () => {
  it('starts and ends on its cities and bends in between', () => {
    const path = greatCircle({ lat: 40.4, lng: -3.7 }, { lat: 41.9, lng: 12.5 }, 8);
    expect(path).toHaveLength(9);
    expect(path[0]![0]).toBeCloseTo(-3.7, 6);
    expect(path[0]![1]).toBeCloseTo(40.4, 6);
    expect(path[8]![0]).toBeCloseTo(12.5, 6);
    expect(path[8]![1]).toBeCloseTo(41.9, 6);
    // A great circle between two northern points arcs poleward of the straight line.
    const middle = path[4]!;
    expect(middle[1]).toBeGreaterThan((40.4 + 41.9) / 2);
  });

  it('crosses the antimeridian the short way, with longitudes left unwrapped', () => {
    const path = greatCircle({ lat: 35.7, lng: 139.7 }, { lat: 37.6, lng: -122.4 }, 12);
    const longitudes = path.map(([lng]) => lng);
    expect(Math.max(...longitudes)).toBeGreaterThan(180);
    // One continuous run eastwards: no jump back across the whole globe.
    for (let i = 1; i < longitudes.length; i++) {
      expect(Math.abs(longitudes[i]! - longitudes[i - 1]!)).toBeLessThan(90);
    }
  });

  it('survives two cities on the same spot', () => {
    const path = greatCircle({ lat: 41.9, lng: 12.5 }, { lat: 41.9, lng: 12.5 });
    expect(path.every(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat))).toBe(true);
  });
});

describe('routeStyle', () => {
  it('tells transport apart by line style', () => {
    expect(routeStyle('flight')).toBe('dashed');
    expect(routeStyle('boat_ferry')).toBe('dotted');
    expect(routeStyle('train')).toBe('solid');
    expect(routeStyle('bus')).toBe('solid');
    expect(routeStyle(null)).toBe('faint');
  });
});

describe('routesOnDay', () => {
  it('keeps only the legs traveled that day', () => {
    const routes = buildRoutes([rome, florence, venice], [], days);
    expect(routesOnDay(routes, 'd3').map((r) => r.id)).toEqual(['rome-florence']);
    expect(routesOnDay(routes, 'd1')).toEqual([]);
  });
});
