/**
 * Centralized design tokens — the "Atlas Blue" palette approved 2026-10-04
 * (see docs/PLAN.md and the design-proposal artifact). No component should
 * hardcode a color, font family, size or spacing value outside this file —
 * see CLAUDE.md "Arquitectura modular y configuración centralizada".
 */

export const brand = {
  ink: '#1C2B45',
  steel: '#3E5C7E',
  mist: '#90A4BC',
  paper: '#F6F3EC',
  stone: '#C9C0AE',
  accent: '#B8893B',
  good: '#4C7A5E',
  warn: '#B2552E',
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  ink: string;
  steel: string;
  mist: string;
  accent: string;
  good: string;
  warn: string;
  onInk: string;
}

const light: ThemeColors = {
  background: brand.paper,
  surface: '#FFFFFF',
  surfaceAlt: '#FBF9F4',
  text: brand.ink,
  textMuted: '#5B6B82',
  border: '#DDD5C4',
  ink: brand.ink,
  steel: brand.steel,
  mist: brand.mist,
  accent: brand.accent,
  good: brand.good,
  warn: brand.warn,
  onInk: brand.paper,
};

const dark: ThemeColors = {
  background: '#0E1626',
  surface: '#182438',
  surfaceAlt: '#131E30',
  text: '#EDE7DA',
  textMuted: '#A8B3C2',
  border: '#2A3A52',
  ink: brand.ink,
  steel: brand.steel,
  mist: brand.mist,
  accent: '#D1A454',
  good: brand.good,
  warn: brand.warn,
  onInk: '#EDE7DA',
};

export const palettes: Record<ColorScheme, ThemeColors> = { light, dark };

/** Keys expo-font is given when loading — use these in `fontFamily`, never a raw string. */
export const fontFamily = {
  display: 'Fraunces-SemiBold',
  displayMedium: 'Fraunces-Medium',
  displayItalic: 'Fraunces-MediumItalic',
  body: 'WorkSans-Regular',
  bodyMedium: 'WorkSans-Medium',
  bodySemiBold: 'WorkSans-SemiBold',
  bodyBold: 'WorkSans-Bold',
  mono: 'PlexMono-Regular',
  monoMedium: 'PlexMono-Medium',
} as const;

export const fontAssets = {
  [fontFamily.display]: require('../../assets/fonts/Fraunces-SemiBold.ttf'),
  [fontFamily.displayMedium]: require('../../assets/fonts/Fraunces-Medium.ttf'),
  [fontFamily.displayItalic]: require('../../assets/fonts/Fraunces-MediumItalic.ttf'),
  [fontFamily.body]: require('../../assets/fonts/WorkSans-Regular.ttf'),
  [fontFamily.bodyMedium]: require('../../assets/fonts/WorkSans-Medium.ttf'),
  [fontFamily.bodySemiBold]: require('../../assets/fonts/WorkSans-SemiBold.ttf'),
  [fontFamily.bodyBold]: require('../../assets/fonts/WorkSans-Bold.ttf'),
  [fontFamily.mono]: require('../../assets/fonts/IBMPlexMono-Regular.ttf'),
  [fontFamily.monoMedium]: require('../../assets/fonts/IBMPlexMono-Medium.ttf'),
};

export interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

/** Type scale from the approved design proposal (section "02 — Tipografía"). */
export const type: Record<
  'display' | 'headline' | 'title' | 'body' | 'caption' | 'data',
  TypeStyle
> = {
  display: { fontFamily: fontFamily.display, fontSize: 38, lineHeight: 44 },
  headline: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 32 },
  title: { fontFamily: fontFamily.bodySemiBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12.5,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  data: { fontFamily: fontFamily.mono, fontSize: 13.5, lineHeight: 19 },
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 3,
  md: 8,
  lg: 16,
  pill: 999,
} as const;
