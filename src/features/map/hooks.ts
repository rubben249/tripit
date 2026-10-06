import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listAllCities } from '@/features/itinerary/api';
import { allCitiesKey } from '@/features/itinerary/hooks';
import { geocodePendingPlaces } from '@/features/places/api';
import { mapTripDataKey } from '@/features/places/hooks';

import { geocodeMissingCities } from './geocodeCities';

export function useAllCities() {
  return useQuery({ queryKey: allCitiesKey, queryFn: listAllCities });
}

type QueryClient = ReturnType<typeof useQueryClient>;

/** Everything the map draws: trips, every trip's cities, and their bookings/days. */
function reloadMapData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['trips'] }),
    queryClient.invalidateQueries({ queryKey: allCitiesKey }),
    queryClient.invalidateQueries({ queryKey: mapTripDataKey }),
  ]);
}

let backfill: Promise<void> | null = null;

/** Locates whatever is still unplaced — cities first (places fall back on them), then booked
 * places. Both only send queries for what's pending, so a quiet run costs nothing. Concurrent
 * callers share the run in progress. */
function runBackfill(queryClient: QueryClient): Promise<void> {
  backfill ??= (async () => {
    const cities = await geocodeMissingCities();
    if (cities > 0) {
      await reloadMapData(queryClient);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
    if ((await geocodePendingPlaces()) > 0) await reloadMapData(queryClient);
  })()
    .catch((err: unknown) => console.warn('Map geocoding failed', err))
    .finally(() => {
      backfill = null;
    });
  return backfill;
}

/** Each time the Map tab comes into view: reload its data (trips, cities and bookings may have
 * changed on other tabs) and place anything new. */
export function useMapBackfill() {
  const queryClient = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      reloadMapData(queryClient);
      runBackfill(queryClient);
    }, [queryClient]),
  );
}

/** The map's refresh button: reload everything and retry placing what's still unplaced. */
export function useRefreshMap() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await reloadMapData(queryClient);
      await runBackfill(queryClient);
    } finally {
      setRefreshing(false);
    }
  };
  return { refresh, refreshing };
}
