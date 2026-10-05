import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/features/settings/hooks';

import {
  palettes,
  mapPalettes,
  space,
  radius,
  type,
  fontFamily,
  type ColorScheme,
  type ThemeColors,
  type MapColors,
} from './tokens';

interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  map: MapColors;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  fontFamily: typeof fontFamily;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const { theme: preference } = useSettings();
  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<Theme>(
    () => ({
      scheme,
      colors: palettes[scheme],
      map: mapPalettes[scheme],
      space,
      radius,
      type,
      fontFamily,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
