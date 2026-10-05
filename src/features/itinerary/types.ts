import { z } from 'zod';

import { categoryKeys, type CategoryKey } from '@/features/bookings/categories';

export const citySchema = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string().min(1),
  countryCode: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  arrivalDate: z.string().nullable(),
  departureDate: z.string().nullable(),
  orderIndex: z.number(),
});
export type City = z.infer<typeof citySchema>;

export const newCityInputSchema = z.object({
  name: z.string().min(1),
  countryCode: z.string().optional(),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
});
export type NewCityInput = z.infer<typeof newCityInputSchema>;

export const itineraryDaySchema = z.object({
  id: z.string(),
  tripId: z.string(),
  cityId: z.string().nullable(),
  date: z.string(),
  dayIndex: z.number(),
  notes: z.string().nullable(),
});
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;

export const bookingStatusSchema = z.enum(['idea', 'to_book', 'booked', 'paid', 'cancelled']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const BOOKING_STATUS_OPTIONS: { key: BookingStatus; label: string }[] = [
  { key: 'idea', label: 'Idea' },
  { key: 'to_book', label: 'To book' },
  { key: 'booked', label: 'Booked' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

// Cast to a literal tuple (not just [string, ...string[]]) so z.enum infers
// the actual CategoryKey union instead of widening every category to `string`
// — that widening previously forced `as CategoryKey` casts everywhere a
// booking's category was read.
export const categoryKeySchema = z.enum(categoryKeys as [CategoryKey, ...CategoryKey[]]);

export const bookingSchema = z.object({
  id: z.string(),
  /** Null only for general notes (created from the Now tab), which belong to no trip. */
  tripId: z.string().nullable(),
  cityId: z.string().nullable(),
  dayId: z.string().nullable(),
  categoryKey: categoryKeySchema,
  status: bookingStatusSchema,
  title: z.string().min(1),
  startAt: z.string().nullable(),
  endAt: z.string().nullable(),
  timezone: z.string().nullable(),
  locationName: z.string().nullable(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  notes: z.string().nullable(),
  orderIndex: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const newBookingInputSchema = z.object({
  dayId: z.string().nullable().optional(),
  cityId: z.string().nullable().optional(),
  categoryKey: categoryKeySchema,
  title: z.string().min(1, 'Title is required'),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  timezone: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  status: bookingStatusSchema.default('idea'),
});
export type NewBookingInput = z.infer<typeof newBookingInputSchema>;
