import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listAllCities } from '@/features/itinerary/api';

import { geocodeMissingCities } from './geocodeCities';

const allCitiesKey = ['cities', 'all'] as const;

export function useAllCities() {
  return useQuery({ queryKey: allCitiesKey, queryFn: listAllCities });
}

let backfillStarted = false;

/** Once per app session, locates cities saved without coordinates, then refreshes everything that
 * shows them (the map, each trip's cities, travel stats). */
export function useGeocodeMissingCities() {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (backfillStarted) return;
    backfillStarted = true;
    geocodeMissingCities()
      .then((located) => {
        if (located === 0) return;
        queryClient.invalidateQueries({ queryKey: allCitiesKey });
        queryClient.invalidateQueries({ queryKey: ['trips'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
      })
      .catch((err: unknown) => console.warn('City geocoding failed', err));
  }, [queryClient]);
}
