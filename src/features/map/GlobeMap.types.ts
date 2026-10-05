import type { MapColors } from '@/theme/tokens';

import type { Bounds, MapCity, MapCountry } from './mapData';

/** A camera move asked for by the screen. `key` changes on every request, so asking for the same
 * place twice still flies there again. */
export interface FocusRequest {
  key: number;
  /** The whole globe, sized to the screen. */
  world?: boolean;
  bounds?: Bounds;
  center?: [number, number];
  zoom?: number;
}

export interface GlobeMapProps {
  colors: MapColors;
  countries: MapCountry[];
  cities: MapCity[];
  focus: FocusRequest | null;
  onCityPress: (cityId: string) => void;
  onBackgroundPress: () => void;
}
