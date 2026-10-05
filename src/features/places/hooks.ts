import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { updateBooking } from '@/features/itinerary/api';
import { useBookings, useCities, useItineraryDays } from '@/features/itinerary/hooks';

import { loadMapTripData } from './api';
import { buildPlaces, placeNumbers } from './places';

export const mapTripDataKey = ['map-data'] as const;

export function useMapTripData() {
  return useQuery({ queryKey: mapTripDataKey, queryFn: loadMapTripData });
}

/** One trip's numbered places, and booking id → number for cards outside the map. */
export function useTripPlaces(tripId: string) {
  const { data: bookings } = useBookings(tripId);
  const { data: days } = useItineraryDays(tripId);
  const { data: cities } = useCities(tripId);
  return useMemo(() => {
    const places = buildPlaces(bookings ?? [], days ?? [], cities ?? []);
    return { places, numbers: placeNumbers(places) };
  }, [bookings, days, cities]);
}

/** Marks a place as seen (now) or not seen, and refreshes both the trip and the world map. */
export function useSetSeen(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, seen }: { bookingId: string; seen: boolean }) =>
      updateBooking(bookingId, { visitedAt: seen ? new Date().toISOString() : null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: mapTripDataKey });
    },
  });
}
