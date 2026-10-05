import * as SQLite from 'expo-sqlite';

import { migrations } from './schema';

const DB_NAME = 'tripit.db';

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

/** Single shared DB connection, opened and migrated once per app session. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}
