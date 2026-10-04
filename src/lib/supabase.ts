import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

// On web, Expo Router statically pre-renders routes in Node during `expo
// export`/`expo start --web`, where `window`/`localStorage` don't exist.
// supabase-js reads from storage the moment the client is constructed (not
// lazily inside an effect), so the real AsyncStorage web shim would crash
// at module-load time during that server render. Fall back to a no-op
// storage there; the browser re-hydrates with the real AsyncStorage.
const storage =
  typeof window === 'undefined'
    ? {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      }
    : AsyncStorage;

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    // PKCE puts the token exchange behind a `?code=` query param instead of
    // a `#access_token=` hash fragment — that's what lets the same
    // `auth/callback` route work on both web and native deep links via
    // Expo Router's normal query-param parsing.
    flowType: 'pkce',
    detectSessionInUrl: false,
  },
});
