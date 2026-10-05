import { z } from 'zod';

import { env } from '@/config/env';

export const themePreferenceSchema = z.enum(['system', 'light', 'dark']);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

/** Every stored value is validated on read and falls back to its default, so a bad or missing row
 * never breaks the app. `env.defaultCurrency` stays the out-of-the-box default (CLAUDE.md
 * "Configuración por variable de entorno"); the user can override it from the You tab. */
export const settingsSchema = z.object({
  displayName: z.string().catch(''),
  defaultCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .catch(env.defaultCurrency),
  theme: themePreferenceSchema.catch('system'),
});
export type Settings = z.infer<typeof settingsSchema>;
export type SettingKey = keyof Settings;
/** Every setting is stored as text, so one update shape covers them all. */
export type SettingUpdate = { [K in SettingKey]: { key: K; value: Settings[K] } }[SettingKey];
