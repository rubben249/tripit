import { useFonts } from 'expo-font';
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

  const inAuthFlow = segments[0] === 'login' || segments[0] === 'auth';

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {!loading && !session && !inAuthFlow ? <Redirect href="/login" /> : null}
      {!loading && session && segments[0] === 'login' ? <Redirect href="/" /> : null}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', title: 'Add' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
