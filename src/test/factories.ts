import type { Booking, City, ItineraryDay } from '@/features/itinerary/types';
import type { Trip } from '@/features/trips/types';

export function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    name: 'Test trip',
    description: null,
    status: 'upcoming',
    startDate: null,
    endDate: null,
    defaultCurrency: 'EUR',
    coverImageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    tripId: 't1',
    cityId: null,
    dayId: null,
    categoryKey: 'restaurant',
    status: 'idea',
    title: 'Booking',
    startAt: null,
    endAt: null,
    timezone: null,
    locationName: null,
    address: null,
    lat: null,
    lng: null,
    details: null,
    price: null,
    currency: null,
    notes: null,
    orderIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeDay(overrides: Partial<ItineraryDay> = {}): ItineraryDay {
  return {
    id: 'd1',
    tripId: 't1',
    cityId: null,
    date: '2026-10-09',
    dayIndex: 0,
    notes: null,
    ...overrides,
  };
}

export function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: 'c1',
    tripId: 't1',
    name: 'Rome',
    countryCode: null,
    lat: null,
    lng: null,
    arrivalDate: null,
    departureDate: null,
    orderIndex: 0,
    ...overrides,
  };
}
