import { format, parseISO } from 'date-fns';

import type { Place } from './places';

/** "Fri 9 Oct · 13:00", or just the day for untimed places (hotel stays, all-day tickets). */
export function formatPlaceWhen(place: Place): string {
  const start = place.booking.startAt;
  if (start?.includes('T')) return format(parseISO(start), 'EEE d MMM · HH:mm');
  return place.when.startsWith('9999') ? 'No date' : format(parseISO(place.when), 'EEE d MMM');
}
