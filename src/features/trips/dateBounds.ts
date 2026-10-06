import { formatDateRange } from '@/lib/dates';

import type { Trip } from './types';

export interface TripDateBounds {
  start: string | null;
  end: string | null;
  /** Null while the trip is still a draft, so date fields stay unfenced. */
  hint: string | null;
}

/**
 * The window a trip's own dates allow. Anything dated *inside* a trip — a city
 * stay, a check-in, a flight's arrival — is only meaningful within it, so every
 * date field in a trip's screens takes its fence from here rather than deciding
 * on its own. A trip with no dates yet (a draft) fences nothing.
 */
export function tripDateBounds(
  trip: Pick<Trip, 'startDate' | 'endDate'> | null | undefined,
): TripDateBounds {
  const start = trip?.startDate ?? null;
  const end = trip?.endDate ?? null;
  if (!start || !end) return { start, end, hint: null };
  return { start, end, hint: `Within ${formatDateRange(start, end)}` };
}
