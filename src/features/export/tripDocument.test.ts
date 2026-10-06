import { describe, expect, it } from '@jest/globals';

import { makeBooking, makeCity, makeDay, makeTrip } from '@/test/factories';

import { buildTripDocument, documentFileName } from './tripDocument';

const trip = makeTrip({
  id: 't1',
  name: 'Italy legs',
  startDate: '2026-10-08',
  endDate: '2026-10-10',
  defaultCurrency: 'EUR',
});
const cities = [makeCity({ id: 'rome', name: 'Rome' })];
const days = [
  makeDay({ id: 'd1', date: '2026-10-08', dayIndex: 0, cityId: 'rome', notes: 'Light day.' }),
  makeDay({ id: 'd2', date: '2026-10-09', dayIndex: 1, cityId: 'rome' }),
];

const flight = makeBooking({
  id: 'f1',
  categoryKey: 'flight',
  status: 'booked',
  title: 'Madrid → Rome',
  dayId: 'd1',
  startAt: '2026-10-08T17:40',
  endAt: '2026-10-08T20:05',
  price: 86.5,
  currency: 'EUR',
  details: { carrierNumber: 'FR9685', departureLocation: 'MAD', arrivalLocation: 'FCO' },
  orderIndex: 1,
});
const dinner = makeBooking({
  id: 'r1',
  categoryKey: 'restaurant',
  status: 'booked',
  title: 'Tonarello',
  dayId: 'd1',
  startAt: '2026-10-08T21:30',
  locationName: 'Tonarello',
  address: 'Via della Paglia 1, Rome',
  orderIndex: 2,
});
const hotel = makeBooking({
  id: 'h1',
  categoryKey: 'accommodation',
  status: 'paid',
  title: 'Viennese Due',
  dayId: 'd1',
  startAt: '2026-10-08',
  endAt: '2026-10-10',
  price: 210,
  orderIndex: 0,
});
const note = makeBooking({
  id: 'n1',
  categoryKey: 'note',
  title: 'Metro',
  notes: 'Line B\nTermini',
});
const task = makeBooking({ id: 'k1', categoryKey: 'task', title: 'Check in online' });

const doc = buildTripDocument(trip, days, cities, [dinner, flight, hotel, note, task]);

describe('buildTripDocument', () => {
  it('heads the document with the trip, its dates and its cities', () => {
    expect(doc.title).toBe('Italy legs');
    expect(doc.subtitle).toContain('Rome');
    expect(doc.total).toBe('296.50 EUR');
  });

  it('puts every day in order, with its city and its own notes', () => {
    expect(doc.days.map((d) => d.heading)).toEqual(['Day 1 · Thu 8 Oct', 'Day 2 · Fri 9 Oct']);
    expect(doc.days[0]!.city).toBe('Rome');
    expect(doc.days[0]!.notes).toBe('Light day.');
    expect(doc.days[1]!.items).toEqual([]);
  });

  it('orders a day by time, untimed plans last', () => {
    expect(doc.days[0]!.items.map((i) => i.title)).toEqual([
      'Madrid → Rome',
      'Tonarello',
      'Viennese Due',
    ]);
  });

  it('writes a transport leg with its number, route and fare', () => {
    const leg = doc.days[0]!.items[0]!;
    expect(leg.time).toBe('17:40 – 20:05');
    expect(leg.status).toBe('Booked');
    expect(leg.lines).toEqual([
      { label: 'Flight number', text: 'FR9685' },
      { label: 'Route', text: 'MAD → FCO' },
      { label: 'Fare', text: '86.50 EUR' },
    ]);
  });

  it('writes where a place is, and a stay as its nights', () => {
    expect(doc.days[0]!.items[1]!.lines).toContainEqual({
      label: 'Where',
      text: 'Tonarello · Via della Paglia 1, Rome',
    });
    const stay = doc.days[0]!.items[2]!;
    expect(stay.time).toBeNull();
    expect(stay.lines[0]!.label).toBe('Dates');
    expect(stay.lines[0]!.text).toContain('check-in');
  });

  it('keeps notes in their own section and leaves tasks out', () => {
    expect(doc.notes).toEqual([{ title: 'Metro', body: 'Line B\nTermini' }]);
    const titles = doc.days.flatMap((d) => d.items.map((i) => i.title));
    expect(titles).not.toContain('Check in online');
    expect(titles).not.toContain('Metro');
  });

  it('keeps bookings with no day instead of dropping them', () => {
    const loose = makeBooking({ id: 'x', categoryKey: 'ticket_activity', title: 'Colosseum' });
    const withLoose = buildTripDocument(trip, days, cities, [loose]);
    expect(withLoose.undated.map((i) => i.title)).toEqual(['Colosseum']);
  });

  it('marks an overnight arrival instead of showing a backwards time', () => {
    const redEye = makeBooking({
      id: 'f2',
      categoryKey: 'flight',
      dayId: 'd1',
      startAt: '2026-10-08T23:30',
      endAt: '2026-10-09T06:10',
    });
    const [item] = buildTripDocument(trip, days, cities, [redEye]).days[0]!.items;
    expect(item!.time).toBe('23:30 → 06:10 (next day)');
  });
});

describe('documentFileName', () => {
  it('strips what a file system would choke on', () => {
    expect(documentFileName('Italy: Rome/Florence')).toBe('Italy RomeFlorence.docx');
    expect(documentFileName('***')).toBe('Trip.docx');
  });
});
