import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addCity,
  createBooking,
  deleteBooking,
  listBookings,
  listCities,
  listGeneralNotes,
  listItineraryDays,
  setItineraryDayNotes,
  updateBooking,
  type BookingUpdate,
} from './api';
import type { NewBookingInput, NewCityInput } from './types';

const citiesKey = (tripId: string) => ['trips', tripId, 'cities'] as const;
/** Every trip's cities at once — what the world map draws. */
export const allCitiesKey = ['cities', 'all'] as const;
const daysKey = (tripId: string) => ['trips', tripId, 'days'] as const;
const bookingsKey = (tripId: string) => ['trips', tripId, 'bookings'] as const;
const generalNotesKey = ['notes', 'general'] as const;

/** Bookings are cached per trip; general notes (tripId null) have their own cache entry. */
function invalidateBookings(queryClient: ReturnType<typeof useQueryClient>, tripId: string | null) {
  queryClient.invalidateQueries({ queryKey: tripId ? bookingsKey(tripId) : generalNotesKey });
}

function invalidateTripItinerary(queryClient: ReturnType<typeof useQueryClient>, tripId: string) {
  queryClient.invalidateQueries({ queryKey: citiesKey(tripId) });
  queryClient.invalidateQueries({ queryKey: allCitiesKey });
  queryClient.invalidateQueries({ queryKey: daysKey(tripId) });
  queryClient.invalidateQueries({ queryKey: bookingsKey(tripId) });
}

export function useCities(tripId: string) {
  return useQuery({
    queryKey: citiesKey(tripId),
    queryFn: () => listCities(tripId),
    enabled: !!tripId,
  });
}

export function useItineraryDays(tripId: string) {
  return useQuery({
    queryKey: daysKey(tripId),
    queryFn: () => listItineraryDays(tripId),
    enabled: !!tripId,
  });
}

export function useSetDayNotes(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, notes }: { dayId: string; notes: string | null }) =>
      setItineraryDayNotes(dayId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: daysKey(tripId) });
    },
  });
}

export function useBookings(tripId: string) {
  return useQuery({
    queryKey: bookingsKey(tripId),
    queryFn: () => listBookings(tripId),
    enabled: !!tripId,
  });
}

export function useBookingsForTrips(tripIds: string[]) {
  return useQueries({
    queries: tripIds.map((tripId) => ({
      queryKey: bookingsKey(tripId),
      queryFn: () => listBookings(tripId),
    })),
  });
}

export function useGeneralNotes() {
  return useQuery({ queryKey: generalNotesKey, queryFn: listGeneralNotes });
}

export function useAddCity(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCityInput) => addCity(tripId, input),
    onSuccess: () => invalidateTripItinerary(queryClient, tripId),
  });
}

export function useCreateBooking(tripId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBookingInput) => createBooking(tripId, input),
    onSuccess: () => invalidateBookings(queryClient, tripId),
  });
}

/** Like useCreateBooking, but the destination (a trip or none) is chosen per call — for the Now
 * tab, where a new note can go to any trip in focus or be a general note. */
export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, title }: { tripId: string | null; title: string }) =>
      createBooking(tripId, { categoryKey: 'note', title, status: 'idea' }),
    onSuccess: (_created, { tripId }) => invalidateBookings(queryClient, tripId),
  });
}

export function useUpdateBooking(tripId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: BookingUpdate }) =>
      updateBooking(id, update),
    onSuccess: () => invalidateBookings(queryClient, tripId),
  });
}

export function useDeleteBooking(tripId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onSuccess: () => invalidateBookings(queryClient, tripId),
  });
}
