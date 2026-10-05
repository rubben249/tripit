import { getDb } from '@/lib/db/client';

import { settingsSchema, type SettingUpdate, type Settings } from './types';

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'select key, value from settings',
  );
  const raw: Record<string, unknown> = {};
  for (const row of rows) raw[row.key] = row.value;
  return settingsSchema.parse(raw);
}

export async function setSetting(update: SettingUpdate): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'insert into settings (key, value) values (?, ?) on conflict(key) do update set value = excluded.value',
    update.key,
    update.value,
  );
}
