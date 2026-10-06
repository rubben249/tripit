import type { MapColors } from '@/theme/tokens';

import type { Bounds, MapCity, MapCountry, MapPlace } from './mapData';
import type { Route } from './routes';

/** A camera move asked for by the screen. `key` changes on every request, so asking for the same
 * place twice still flies there again. */
export interface FocusRequest {
  key: number;
  /** The whole globe, sized to the screen. */
  world?: boolean;
  bounds?: Bounds;
  center?: [number, number];
  zoom?: number;
  /** Cap for `bounds`, so a single point doesn't zoom to street level unless asked. */
  maxZoom?: number;
}

export interface GlobeMapProps {
  colors: MapColors;
  countries: MapCountry[];
  cities: MapCity[];
  /** Trips being looked at: their cities are drawn in the focus color. */
  highlightTripIds: string[];
  /** Numbered booked places to draw (those of the trips being looked at). */
  places: MapPlace[];
  /** Legs between the cities of the trips being looked at. */
  routes: Route[];
  focus: FocusRequest | null;
  onCityPress: (cityId: string) => void;
  onPlacePress: (bookingId: string) => void;
  /** A country with a trip was tapped; `bounds` frames its mainland. */
  onCountryPress: (iso: string, bounds: Bounds | null) => void;
  onBackgroundPress: () => void;
}
