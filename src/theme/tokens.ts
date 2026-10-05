/**
 * Centralized design tokens — the "Atlas Umber" palette (brown-based,
 * replacing the original Atlas Blue; decision 2026-10-05: sober, elegant,
 * deliberately narrow range — not a wide rainbow of browns). See
 * docs/PLAN.md and CLAUDE.md "Arquitectura modular y configuración
 * centralizada": no component should hardcode a color, font family, size or
 * spacing value outside this file.
 */

export const brand = {
  ink: '#2B1E12',
  steel: '#6B4A33',
  mist: '#C9AE8C',
  paper: '#F7F1E6',
  stone: '#D9C6A8',
  accent: '#A8763E',
  good: '#6E7B4F',
  warn: '#AE5A35',
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
  surface: '#FFFBF4',
  surfaceAlt: '#FAF1E1',
  text: brand.ink,
  textMuted: '#7A6552',
  border: '#E3D5BE',
  ink: brand.ink,
  steel: brand.steel,
  mist: brand.mist,
  accent: brand.accent,
  good: brand.good,
  warn: brand.warn,
  onInk: brand.paper,
};

const dark: ThemeColors = {
  background: '#17110B',
  surface: '#241B12',
  surfaceAlt: '#1D160F',
  text: '#EFE6D8',
  textMuted: '#B6A48D',
  border: '#3B2D1E',
  ink: brand.ink,
  steel: brand.steel,
  mist: brand.mist,
  accent: '#C99455',
  good: brand.good,
  warn: brand.warn,
  onInk: '#EFE6D8',
};

export const palettes: Record<ColorScheme, ThemeColors> = { light, dark };

/** World map (Map tab) colors, kept in the Atlas Umber family. The base map comes from
 * OpenFreeMap; land and water are repainted with these so it matches the app, and trip
 * countries/cities are drawn on top. */
export interface MapColors {
  /** OpenFreeMap style to start from — a quiet, label-light base in each scheme. */
  style: string;
  land: string;
  water: string;
  /** Space around the globe. */
  space: string;
  /** Soft halo hugging the globe's edge at world zoom. */
  atmosphere: string;
  /** Countries with a trip already taken or in progress. */
  traveled: string;
  /** Countries with a trip still ahead (upcoming or draft). */
  planned: string;
  countryOutline: string;
  city: string;
  cityHalo: string;
  /** Cities of the trip being looked at (picked by country, chip or city) — terracotta, so they
   * stand apart from both the plain city dots and the country fill. */
  cityFocus: string;
  /** Numbered booked places: the disc and its number. */
  place: string;
  placeText: string;
  /** Places marked as seen: a quieter disc with a check instead of the number. */
  placeSeen: string;
  placeSeenMark: string;
}

export const mapPalettes: Record<ColorScheme, MapColors> = {
  light: {
    style: 'https://tiles.openfreemap.org/styles/positron',
    land: '#F3EADB',
    water: '#D7C6AA',
    space: light.background,
    atmosphere: '#E8D3B0',
    traveled: brand.accent,
    planned: '#D4A86E',
    countryOutline: '#8A5A34',
    city: brand.ink,
    cityHalo: '#FFFBF4',
    cityFocus: brand.warn,
    place: brand.ink,
    placeText: '#FFFBF4',
    placeSeen: '#D9C6A8',
    placeSeenMark: '#6B4A33',
  },
  dark: {
    style: 'https://tiles.openfreemap.org/styles/dark',
    land: '#2A2017',
    water: '#120D08',
    space: dark.background,
    atmosphere: '#6B4A33',
    traveled: '#C99455',
    planned: '#7A5A36',
    countryOutline: '#E0B57E',
    city: '#EFE6D8',
    cityHalo: '#17110B',
    cityFocus: '#E08A5F',
    place: '#EFE6D8',
    placeText: '#17110B',
    placeSeen: '#4A3828',
    placeSeenMark: '#C9AE8C',
  },
};

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
