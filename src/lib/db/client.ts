import * as SQLite from 'expo-sqlite';

import { migrations } from './schema';
import { DatabaseUnavailableError, isDatabaseBusyError } from './errors';

const DB_NAME = 'tripit.db';

/**
 * When another browser context holds the OPFS access handles, Chrome's open
 * never settles instead of rejecting — the screen would spin forever. Past this
 * point the open is treated as the conflict it almost certainly is. Opening and
 * migrating a local database takes well under a second even on a cold start.
 */
const OPEN_TIMEOUT_MS = 8000;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = result?.user_version ?? 0;

  await db.execAsync('PRAGMA foreign_keys = ON');

  for (let i = version; i < migrations.length; i++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrations[i]!);
      version = i + 1;
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DatabaseUnavailableError()), OPEN_TIMEOUT_MS);
  });

  try {
    const db = await Promise.race([
      SQLite.openDatabaseAsync(DB_NAME).then(async (opened) => {
        await migrate(opened);
        return opened;
      }),
      timeout,
    ]);
    return db;
  } catch (error) {
    // A failed open must not be cached, or a retry after closing the other tab
    // would keep replaying the same rejection.
    dbPromise = null;
    throw isDatabaseBusyError(error) ? new DatabaseUnavailableError(error) : error;
  } finally {
    clearTimeout(timer);
  }
}

/** Single shared DB connection, opened and migrated once per app session. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open();
  }
  return dbPromise;
}

/** Drop the cached connection so the next `getDb()` opens from scratch — the retry path. */
export function resetDb(): void {
  dbPromise = null;
}
