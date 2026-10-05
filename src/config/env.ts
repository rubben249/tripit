/**
 * Single source of truth for environment-driven configuration.
 * Nothing in the app reads `process.env` directly outside this file —
 * see CLAUDE.md "Arquitectura modular y configuración centralizada".
 */
export const env = {
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'TripIt',
  defaultCurrency: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY ?? 'EUR',
  // Falls back to a syntactically-valid placeholder (never a real backend)
  // so builds without a configured .env — a fresh checkout, CI without
  // secrets — still construct the Supabase client instead of crashing the
  // whole bundle. Any real network call will simply fail, which is correct:
  // there's no project to talk to.
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
} as const;
