import { useFonts } from 'expo-font';
import Head from 'expo-router/head';
import {
  Redirect,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  useSegments,
  type Theme as NavigationTheme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { env } from '@/config/env';
import { fontAssets } from '@/theme/tokens';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const theme = useTheme();
  const { session, loading } = useAuth();
  const segments = useSegments();

  const navigationTheme: NavigationTheme = {
    dark: theme.scheme === 'dark',
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.warn,
    },
    fonts: {
      regular: { fontFamily: theme.fontFamily.body, fontWeight: '400' },
      medium: { fontFamily: theme.fontFamily.bodyMedium, fontWeight: '500' },
      bold: { fontFamily: theme.fontFamily.bodyBold, fontWeight: '700' },
      heavy: { fontFamily: theme.fontFamily.bodyBold, fontWeight: '700' },
    },
  };

  // No forced login: trips live on-device by default (see CLAUDE.md "Modelo
  // local-first"). /login stays reachable but unused for now — it's ready
  // for whenever sharing needs an account, which will likely be a
  // short-lived QR/code pairing flow rather than email, per product
  // direction captured 2026-10-05.
  const onLoginScreen = segments[0] === 'login';

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {/* Default document title (web). Without one, iOS "Add to Home Screen"
          has nothing to name the bookmark and falls back to a generic
          lettered icon even when apple-touch-icon is set. Individual
          screens can render their own <Head><title>...</title></Head> to
          override this later. */}
      <Head>
        <title>{env.appName}</title>
      </Head>
      {!loading && session && onLoginScreen ? <Redirect href="/" /> : null}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', title: 'Add' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
