import { z } from 'zod';

/**
 * A portable snapshot of local data — the same shape for a full backup (You tab) and for a single
 * trip shared with someone else (Fase 5). Rows are kept as raw database rows: importing is then a
 * straight insert, with no per-entity mapping code to keep in sync with the schema.
 *
 * Column names are a fixed allow-list per table, never taken from the file — a tampered file can't
 * smuggle SQL through a column name, and unknown keys are simply dropped.
 */
export const BUNDLE_TABLES = {
  trips: [
    'id',
    'name',
    'description',
    'status',
    'start_date',
    'end_date',
    'default_currency',
    'cover_image_url',
    'created_at',
    'updated_at',
    'deleted_at',
  ],
  trip_participants: ['id', 'trip_id', 'display_name', 'created_at'],
  cities: [
    'id',
    'trip_id',
    'name',
    'country_code',
    'lat',
    'lng',
    'arrival_date',
    'departure_date',
    'order_index',
  ],
  itinerary_days: ['id', 'trip_id', 'city_id', 'date', 'day_index', 'notes'],
  bookings: [
    'id',
    'trip_id',
    'city_id',
    'day_id',
    'category_key',
    'status',
    'title',
    'start_at',
    'end_at',
    'timezone',
    'location_name',
    'address',
    'lat',
    'lng',
    'details',
    'price',
    'currency',
    'notes',
    'order_index',
    'visited_at',
    'geocoded_query',
    'created_at',
    'updated_at',
  ],
  note_photos: ['id', 'note_id', 'name', 'data', 'created_at'],
} as const;

export type BundleTable = keyof typeof BUNDLE_TABLES;

/** Insert order respects foreign keys: parents before children. */
export const TABLE_ORDER: BundleTable[] = [
  'trips',
  'trip_participants',
  'cities',
  'itinerary_days',
  'bookings',
  'note_photos',
];

/** Columns holding another row's id — remapped together with the ids when importing as a copy. */
const REFERENCE_COLUMNS = ['trip_id', 'city_id', 'day_id', 'note_id'] as const;

const cellSchema = z.union([z.string(), z.number(), z.null()]);
const rowSchema = z.record(z.string(), cellSchema);
export type BundleRow = z.infer<typeof rowSchema>;

export const bundleSchema = z.object({
  format: z.literal('tripit'),
  version: z.literal(1),
  kind: z.enum(['backup', 'share']),
  exportedAt: z.string(),
  sharedBy: z.string().optional(),
  tables: z.object({
    trips: z.array(rowSchema),
    trip_participants: z.array(rowSchema),
    cities: z.array(rowSchema),
    itinerary_days: z.array(rowSchema),
    bookings: z.array(rowSchema),
    note_photos: z.array(rowSchema),
  }),
});
export type DataBundle = z.infer<typeof bundleSchema>;
export type BundleTables = DataBundle['tables'];

export function emptyTables(): BundleTables {
  return {
    trips: [],
    trip_participants: [],
    cities: [],
    itinerary_days: [],
    bookings: [],
    note_photos: [],
  };
}

/** Keeps only allow-listed columns, in allow-list order, filling missing ones with null. */
export function pickColumns(table: BundleTable, row: BundleRow): (string | number | null)[] {
  return BUNDLE_TABLES[table].map((col) => row[col] ?? null);
}

/** Gives every row a fresh id and rewrites references to match, so an imported copy never
 * collides with (or overwrites) data already on the device — e.g. receiving the same shared trip
 * twice yields two independent copies. References to rows outside the bundle are left untouched. */
export function remapIds(tables: BundleTables, newId: () => string): BundleTables {
  const ids = new Map<string, string>();
  for (const table of TABLE_ORDER) {
    for (const row of tables[table]) {
      if (typeof row.id === 'string') ids.set(row.id, newId());
    }
  }
  const remap = (value: string | number | null) =>
    typeof value === 'string' ? (ids.get(value) ?? value) : value;

  const out = emptyTables();
  for (const table of TABLE_ORDER) {
    out[table] = tables[table].map((row) => {
      const next: BundleRow = { ...row, id: remap(row.id ?? null) };
      for (const col of REFERENCE_COLUMNS) {
        if (col in row) next[col] = remap(row[col] ?? null);
      }
      return next;
    });
  }
  return out;
}

export function summarizeBundle(tables: BundleTables) {
  const notes = tables.bookings.filter((b) => b.category_key === 'note').length;
  const tasks = tables.bookings.filter((b) => b.category_key === 'task').length;
  return {
    trips: tables.trips.length,
    cities: tables.cities.length,
    reservations: tables.bookings.length - notes - tasks,
    notes,
    tasks,
    photos: tables.note_photos.length,
  };
}
