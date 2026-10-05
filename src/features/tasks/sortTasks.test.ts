import { describe, expect, it } from '@jest/globals';

import type { Booking } from '@/features/itinerary/types';
import { makeBooking } from '@/test/factories';

import { sortTasks } from './sortTasks';

function task(id: string, createdAt: string, details: Booking['details']): Booking {
  return makeBooking({ id, title: id, categoryKey: 'task', createdAt, details });
}

describe('sortTasks', () => {
  it('puts pending tasks before done ones, each in creation order', () => {
    const tasks = [
      task('done-early', '2026-01-01T00:00:00Z', { done: true }),
      task('pending-late', '2026-01-03T00:00:00Z', { done: false }),
      task('pending-early', '2026-01-02T00:00:00Z', null),
      task('done-late', '2026-01-04T00:00:00Z', { done: true }),
    ];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual([
      'pending-early',
      'pending-late',
      'done-early',
      'done-late',
    ]);
  });

  it('does not mutate the input array', () => {
    const tasks = [
      task('b', '2026-01-02T00:00:00Z', { done: true }),
      task('a', '2026-01-01T00:00:00Z', null),
    ];
    sortTasks(tasks);
    expect(tasks.map((t) => t.id)).toEqual(['b', 'a']);
  });
});
