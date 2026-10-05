import { describe, expect, it } from '@jest/globals';

import { makeCity, makeTrip } from '@/test/factories';

import { buildMapData, mainlandBounds, unionBounds } from './mapData';

const now = new Date(2026, 9, 5, 12, 0);
const pastItaly = makeTrip({
  id: 'past',
  name: 'Italy',
  startDate: '2026-08-01',
  endDate: '2026-08-05',
});
const futureItaly = makeTrip({
  id: 'future',
  name: 'Italy again',
  startDate: '2026-12-01',
  endDate: '2026-12-05',
});
const japan = makeTrip({
  id: 'japan',
  name: 'Japan',
  startDate: '2027-04-01',
  endDate: '2027-04-10',
});

const cities = [
  makeCity({ id: 'rome', tripId: 'past', name: 'Rome', countryCode: 'IT', lat: 41.9, lng: 12.5 }),
  makeCity({ id: 'milan', tripId: 'past', name: 'Milan', countryCode: 'IT', lat: 45.5, lng: 9.2 }),
  makeCity({
    id: 'naples',
    tripId: 'future',
    name: 'Naples',
    countryCode: 'IT',
    lat: 40.8,
    lng: 14.3,
  }),
  makeCity({
    id: 'tokyo',
    tripId: 'japan',
    name: 'Tokyo',
    countryCode: 'JP',
    lat: 35.7,
    lng: 139.7,
  }),
  makeCity({ id: 'nowhere', tripId: 'japan', name: 'Unlocated', countryCode: null }),
];

describe('buildMapData', () => {
  const data = buildMapData([pastItaly, futureItaly, japan], cities, now);

  it('only draws cities that have coordinates', () => {
    expect(data.cities.map((c) => c.id)).toEqual(['rome', 'milan', 'naples', 'tokyo']);
  });

  it('marks a country traveled if any trip there already happened', () => {
    expect(data.countries).toEqual([
      { iso: 'IT', kind: 'traveled' },
      { iso: 'JP', kind: 'planned' },
    ]);
  });

  it('frames each trip around its cities', () => {
    const italy = data.trips.find((t) => t.id === 'past');
    expect(italy?.bounds).toEqual([
      [9.2, 41.9],
      [12.5, 45.5],
    ]);
    expect(italy?.cityCount).toBe(2);
  });

  it('leaves out trips without any located city', () => {
    const empty = makeTrip({ id: 'empty', startDate: '2026-11-01', endDate: '2026-11-02' });
    const withEmpty = buildMapData([empty], [makeCity({ tripId: 'empty' })], now);
    expect(withEmpty.trips).toEqual([]);
  });
});

describe('mainlandBounds', () => {
  it('frames the largest landmass of a multipolygon', () => {
    const square = (x: number, y: number, size: number): [number, number][] => [
      [x, y],
      [x + size, y],
      [x + size, y + size],
      [x, y + size],
      [x, y],
    ];
    const bounds = mainlandBounds({
      type: 'MultiPolygon',
      coordinates: [[square(-55, 2, 1)], [square(-5, 42, 10)]],
    });
    expect(bounds).toEqual([
      [-5, 42],
      [5, 52],
    ]);
  });

  it('returns null for geometry it cannot frame', () => {
    expect(mainlandBounds({ type: 'Point', coordinates: [0, 0] })).toBeNull();
  });
});

describe('unionBounds', () => {
  it('spans every box given, ignoring missing ones', () => {
    expect(
      unionBounds(
        [
          [0, 0],
          [1, 1],
        ],
        null,
        [
          [-2, 0.5],
          [0.5, 3],
        ],
      ),
    ).toEqual([
      [-2, 0],
      [1, 3],
    ]);
    expect(unionBounds(null)).toBeNull();
  });
});
