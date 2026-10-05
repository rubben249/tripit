import { asTaskDetails } from '@/features/bookings/details';
import type { Booking } from '@/features/itinerary/types';

/** Pending tasks first, then done ones; each group in the order they were added. */
export function sortTasks(tasks: Booking[]): Booking[] {
  const isDone = (t: Booking) => (asTaskDetails(t.details).done ? 1 : 0);
  return [...tasks].sort((a, b) => isDone(a) - isDone(b) || a.createdAt.localeCompare(b.createdAt));
}
