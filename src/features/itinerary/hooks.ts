import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addCity,
  createBooking,
  createExpense,
  deleteBooking,
  deleteExpense,
  listBookings,
  listCities,
  listExpenses,
  listItineraryDays,
  updateBooking,
  type BookingUpdate,
} from './api';
import type { NewBookingInput, NewCityInput, NewExpenseInput } from './types';

const citiesKey = (tripId: string) => ['trips', tripId, 'cities'] as const;
const daysKey = (tripId: string) => ['trips', tripId, 'days'] as const;
const bookingsKey = (tripId: string) => ['trips', tripId, 'bookings'] as const;
const expensesKey = (tripId: string) => ['trips', tripId, 'expenses'] as const;

function invalidateTripItinerary(queryClient: ReturnType<typeof useQueryClient>, tripId: string) {
  queryClient.invalidateQueries({ queryKey: citiesKey(tripId) });
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

export function useBookings(tripId: string) {
  return useQuery({
    queryKey: bookingsKey(tripId),
    queryFn: () => listBookings(tripId),
    enabled: !!tripId,
  });
}

export function useAddCity(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCityInput) => addCity(tripId, input),
    onSuccess: () => invalidateTripItinerary(queryClient, tripId),
  });
}

export function useCreateBooking(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBookingInput) => createBooking(tripId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingsKey(tripId) }),
  });
}

export function useUpdateBooking(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: BookingUpdate }) =>
      updateBooking(id, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingsKey(tripId) }),
  });
}

export function useDeleteBooking(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingsKey(tripId) }),
  });
}

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: expensesKey(tripId),
    queryFn: () => listExpenses(tripId),
    enabled: !!tripId,
  });
}

export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewExpenseInput) => createExpense(tripId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesKey(tripId) }),
  });
}

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesKey(tripId) }),
  });
}
