import { getDb } from '@/lib/db/client';
import { generateId } from '@/lib/id';

import {
  BUNDLE_TABLES,
  TABLE_ORDER,
  emptyTables,
  pickColumns,
  remapIds,
  type BundleRow,
  type BundleTables,
  type DataBundle,
} from './bundle';

/** Everything on this device: every trip (trashed ones too, so a restore is faithful) and every
 * note, including general notes that belong to no trip. */
export async function exportAll(): Promise<DataBundle> {
  const db = await getDb();
  const tables = emptyTables();
  for (const table of TABLE_ORDER) {
    const columns = BUNDLE_TABLES[table].join(', ');
    tables[table] = await db.getAllAsync<BundleRow>(`select ${columns} from ${table}`);
  }
  return {
    format: 'tripit',
    version: 1,
    kind: 'backup',
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** One trip with everything that hangs off it — the raw material for sharing (before filtering). */
export async function exportTrip(tripId: string): Promise<BundleTables> {
  const db = await getDb();
  const tables = emptyTables();
  const cols = (table: keyof typeof BUNDLE_TABLES) => BUNDLE_TABLES[table].join(', ');
  tables.trips = await db.getAllAsync<BundleRow>(
    `select ${cols('trips')} from trips where id = ?`,
    tripId,
  );
  for (const table of ['trip_participants', 'cities', 'itinerary_days', 'bookings'] as const) {
    tables[table] = await db.getAllAsync<BundleRow>(
      `select ${cols(table)} from ${table} where trip_id = ?`,
      tripId,
    );
  }
  tables.note_photos = await db.getAllAsync<BundleRow>(
    `select ${BUNDLE_TABLES.note_photos.map((c) => `p.${c}`).join(', ')} from note_photos p
       join bookings b on b.id = p.note_id where b.trip_id = ?`,
    tripId,
  );
  return tables;
}

export type ImportMode =
  /** Restore a backup: rows keep their ids, and anything already on the device is left as is. */
  | 'keepIds'
  /** Receive a copy: every row gets a new id, so it never touches existing data. */
  | 'freshIds';

/** Inserts a bundle in one transaction — all of it lands, or none of it does. Returns the rows as
 * inserted (with their new ids, for 'freshIds'). */
export async function importBundle(tables: BundleTables, mode: ImportMode): Promise<BundleTables> {
  const db = await getDb();
  const source = mode === 'freshIds' ? remapIds(tables, generateId) : tables;
  await db.withTransactionAsync(async () => {
    for (const table of TABLE_ORDER) {
      const columns = BUNDLE_TABLES[table];
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `insert or ignore into ${table} (${columns.join(', ')}) values (${placeholders})`;
      for (const row of source[table]) {
        await db.runAsync(sql, pickColumns(table, row));
      }
    }
  });
  return source;
}
