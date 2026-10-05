import { getDb } from '@/lib/db/client';
import { generateId } from '@/lib/id';

import { newTripInputSchema, type NewTripInput, type Trip, type TripParticipant } from './types';

interface TripRow {
  id: string;
  name: string;
  description: string | null;
  status: Trip['status'];
  start_date: string | null;
  end_date: string | null;
  default_currency: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToTrip(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    defaultCurrency: row.default_currency,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

/** Trips not in the trash, newest first. */
export async function listTrips(): Promise<Trip[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TripRow>(
    'select * from trips where deleted_at is null order by start_date is null, start_date asc',
  );
  return rows.map(rowToTrip);
}

export async function listTrashedTrips(): Promise<Trip[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TripRow>(
    'select * from trips where deleted_at is not null order by deleted_at desc',
  );
  return rows.map(rowToTrip);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TripRow>('select * from trips where id = ?', id);
  return row ? rowToTrip(row) : null;
}

export async function createTrip(input: NewTripInput): Promise<Trip> {
  const parsed = newTripInputSchema.parse(input);
  const db = await getDb();
  const now = new Date().toISOString();
  const id = generateId();
  const status: Trip['status'] = parsed.startDate && parsed.endDate ? 'upcoming' : 'draft';

  await db.runAsync(
    `insert into trips (id, name, description, status, start_date, end_date, default_currency, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    parsed.name,
    parsed.description ?? null,
    status,
    parsed.startDate ?? null,
    parsed.endDate ?? null,
    parsed.defaultCurrency,
    now,
    now,
  );

  const trip = await getTrip(id);
  if (!trip) throw new Error('Failed to create trip');
  return trip;
}

export type TripUpdate = Partial<
  Pick<
    Trip,
    | 'name'
    | 'description'
    | 'status'
    | 'startDate'
    | 'endDate'
    | 'defaultCurrency'
    | 'coverImageUrl'
  >
>;

export async function updateTrip(id: string, update: TripUpdate): Promise<Trip> {
  const db = await getDb();
  const current = await getTrip(id);
  if (!current) throw new Error(`Trip ${id} not found`);

  const next = { ...current, ...update, updatedAt: new Date().toISOString() };

  await db.runAsync(
    `update trips set name = ?, description = ?, status = ?, start_date = ?, end_date = ?,
       default_currency = ?, cover_image_url = ?, updated_at = ? where id = ?`,
    next.name,
    next.description,
    next.status,
    next.startDate,
    next.endDate,
    next.defaultCurrency,
    next.coverImageUrl,
    next.updatedAt,
    id,
  );

  const updated = await getTrip(id);
  if (!updated) throw new Error('Failed to update trip');
  return updated;
}

/** Soft delete — moves the trip to the trash. Permanently purged after 30 days (see trashCleanup). */
export async function trashTrip(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('update trips set deleted_at = ? where id = ?', new Date().toISOString(), id);
}

export async function restoreTrip(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('update trips set deleted_at = null where id = ?', id);
}

export async function permanentlyDeleteTrip(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('delete from trips where id = ?', id);
}

/** Purges trips that have been in the trash for more than 30 days. Call on app start. */
export async function purgeExpiredTrash(): Promise<number> {
  const db = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const result = await db.runAsync(
    'delete from trips where deleted_at is not null and deleted_at < ?',
    cutoff.toISOString(),
  );
  return result.changes;
}

function rowToParticipant(row: {
  id: string;
  trip_id: string;
  display_name: string;
  created_at: string;
}): TripParticipant {
  return {
    id: row.id,
    tripId: row.trip_id,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

export async function listParticipants(tripId: string): Promise<TripParticipant[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    trip_id: string;
    display_name: string;
    created_at: string;
  }>('select * from trip_participants where trip_id = ? order by created_at asc', tripId);
  return rows.map(rowToParticipant);
}

export async function addParticipant(
  tripId: string,
  displayName: string,
): Promise<TripParticipant> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    'insert into trip_participants (id, trip_id, display_name, created_at) values (?, ?, ?, ?)',
    id,
    tripId,
    displayName,
    now,
  );
  return { id, tripId, displayName, createdAt: now };
}

export async function removeParticipant(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('delete from trip_participants where id = ?', id);
}
