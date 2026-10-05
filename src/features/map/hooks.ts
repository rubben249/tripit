import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { listAllCities } from '@/features/itinerary/api';
import { geocodePendingPlaces } from '@/features/places/api';
import { mapTripDataKey } from '@/features/places/hooks';

import { geocodeMissingCities } from './geocodeCities';

const allCitiesKey = ['cities', 'all'] as const;

export function useAllCities() {
  return useQuery({ queryKey: allCitiesKey, queryFn: listAllCities });
}

let backfillRunning = false;

/** Each time the Map tab comes into view: refresh its data (bookings may have changed elsewhere)
 * and locate whatever is still unplaced — cities first (places fall back on them), then booked
 * places. Both only send queries for what's pending, so a quiet visit costs nothing. */
export function useMapBackfill() {
  const queryClient = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: mapTripDataKey });
      if (backfillRunning) return;
      backfillRunning = true;
      (async () => {
        const cities = await geocodeMissingCities();
        if (cities > 0) {
          queryClient.invalidateQueries({ queryKey: allCitiesKey });
          queryClient.invalidateQueries({ queryKey: ['trips'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
        const places = await geocodePendingPlaces();
        if (places > 0) {
          queryClient.invalidateQueries({ queryKey: mapTripDataKey });
          queryClient.invalidateQueries({ queryKey: ['trips'] });
        }
      })()
        .catch((err: unknown) => console.warn('Map geocoding failed', err))
        .finally(() => {
          backfillRunning = false;
        });
    }, [queryClient]),
  );
}
