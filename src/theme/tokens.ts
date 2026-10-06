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
  /** Text that is present but deliberately recessive — disabled days, out-of-month dates,
   * placeholder hints. Still readable (≥3:1), unlike using `border` as a text color. */
  textFaint: string;
  border: string;
  /** A hairline that only separates, where `border` would draw a box. */
  borderSoft: string;
  ink: string;
  steel: string;
  mist: string;
  /** The filled state — primary buttons, the selected day, the active filter.
   * `ink` plays this role on paper, but in the dark scheme ink *is* nearly the
   * background, so the fill becomes accent there. Components read `solid`, never
   * `ink`, when they mean "filled". */
  solid: string;
  onSolid: string;
  accent: string;
  /** Accent at surface strength: selected rows, icon wells, today's marker. */
  accentSoft: string;
  good: string;
  warn: string;
  onInk: string;
  /** Keyboard focus ring — the one browser surface react-native-web leaves unthemed. */
  focus: string;
  /** Backdrop behind modals and sheets. */
  scrim: string;
}

const light: ThemeColors = {
  background: brand.paper,
  surface: '#FFFBF4',
  surfaceAlt: '#FAF1E1',
  text: brand.ink,
  textMuted: '#705B48',
  textFaint: '#A58F76',
  border: '#E3D5BE',
  borderSoft: '#EDE2CF',
  ink: brand.ink,
  steel: brand.steel,
  mist: brand.mist,
  solid: brand.ink,
  onSolid: brand.paper,
  accent: brand.accent,
  accentSoft: '#F1E2CB',
  good: brand.good,
  warn: brand.warn,
  onInk: brand.paper,
  focus: brand.accent,
  scrim: 'rgba(23,17,11,0.52)',
};

const dark: ThemeColors = {
  background: '#17110B',
  surface: '#241B12',
  surfaceAlt: '#1D160F',
  text: '#EFE6D8',
  textMuted: '#BCAB95',
  textFaint: '#8A7762',
  border: '#3B2D1E',
  borderSoft: '#2E2317',
  ink: brand.ink,
  steel: brand.steel,
  mist: brand.mist,
  solid: '#C99455',
  onSolid: '#1A120A',
  accent: '#C99455',
  accentSoft: '#3A2A19',
  good: brand.good,
  warn: brand.warn,
  onInk: '#EFE6D8',
  focus: '#C99455',
  scrim: 'rgba(8,5,3,0.66)',
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
  /** Legs between cities, by how you travel them (`unknown` = no transport booked yet). */
  route: Record<RouteColorKey, string>;
}

export type RouteColorKey = 'flight' | 'train' | 'bus' | 'boat_ferry' | 'unknown';

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
    route: {
      flight: '#8A5A34',
      train: '#4A3222',
      bus: '#A9825A',
      boat_ferry: '#5E7A6B',
      unknown: '#9C8B76',
    },
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
    route: {
      flight: '#E0A86B',
      train: '#C9AE8C',
      bus: '#E0B57E',
      boat_ferry: '#8FB3A2',
      unknown: '#9C8B76',
    },
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

/**
 * Type scale from the approved design proposal (section "02 — Tipografía").
 * `headline` names the screen; `section` names a block inside it — they must stay
 * two clearly different steps, or a screen reads as a flat list of equal shouts.
 * Display sizes carry slight negative tracking because Fraunces sets loose at scale.
 */
export const type: Record<
  'display' | 'headline' | 'section' | 'title' | 'body' | 'caption' | 'label' | 'data',
  TypeStyle
> = {
  display: { fontFamily: fontFamily.display, fontSize: 38, lineHeight: 44, letterSpacing: -0.4 },
  headline: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  section: { fontFamily: fontFamily.displayMedium, fontSize: 20, lineHeight: 26 },
  title: { fontFamily: fontFamily.bodySemiBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12.5,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  /** Field and group labels: small, uppercase at the call site, widely tracked. */
  label: { fontFamily: fontFamily.monoMedium, fontSize: 11, lineHeight: 15, letterSpacing: 0.8 },
  data: { fontFamily: fontFamily.mono, fontSize: 13.5, lineHeight: 19 },
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * `sm` is the control radius (buttons, inputs, rows), `md` the card radius, `lg` the
 * modal radius. They were 3/8/16: a 3px corner on a 48px control reads as unfinished
 * rather than as sharp, so the whole ladder moved up one step while keeping the
 * same three roles.
 */
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export interface Elevation {
  boxShadow: string;
  elevation: number;
}

/**
 * Three depths, all with a real downward offset and a soft blur — a glow with no
 * offset is decoration, not depth. Shadows are warm-black rather than neutral so
 * they sit in the Atlas Umber family instead of graying the paper.
 */
export const elevation: Record<'raised' | 'floating' | 'overlay', Elevation> = {
  raised: { boxShadow: '0px 1px 2px rgba(43,30,18,0.07)', elevation: 1 },
  floating: { boxShadow: '0px 4px 12px rgba(43,30,18,0.14)', elevation: 5 },
  overlay: { boxShadow: '0px 16px 40px rgba(23,17,11,0.26)', elevation: 16 },
} as const;

/**
 * Motion scale. Durations are in ms; the spring configs feed Reanimated's
 * `withSpring`. Nothing in the app animates longer than `slow` — above ~320ms a
 * phone interaction stops feeling like a response and starts feeling like a wait.
 * See `src/lib/motion.ts` for the easings and the reduced-motion gate.
 */
export const motion = {
  duration: { instant: 90, fast: 140, base: 200, slow: 320 },
  /** Pressed scale for controls (buttons, rows) and for large surfaces (cards). */
  pressScale: { control: 0.97, surface: 0.985 },
  spring: {
    /** Snappy, no visible overshoot — presses and toggles. */
    press: { damping: 26, stiffness: 420, mass: 0.7 },
    /** A single soft overshoot — modals, sheets, things that arrive. */
    enter: { damping: 20, stiffness: 240, mass: 0.9 },
  },
} as const;

/**
 * Layout constants shared by the shell. `contentMaxWidth` keeps a reading column
 * on a desktop browser — react-native-web will happily stretch a card to 1200px
 * otherwise. `tabBarHeight` is the bar's own height without the safe-area inset,
 * which `Screen` reserves so scrolled content never ends underneath it.
 */
export const layout = {
  contentMaxWidth: 760,
  tabBarHeight: 64,
} as const;
