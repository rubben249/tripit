/**
 * Single source of truth for environment-driven configuration.
 * Nothing in the app reads `process.env` directly outside this file —
 * see CLAUDE.md "Arquitectura modular y configuración centralizada".
 */
export const env = {
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'TripIt',
  defaultCurrency: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY ?? 'EUR',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;
