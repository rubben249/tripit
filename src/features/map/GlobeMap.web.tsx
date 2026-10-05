import 'maplibre-gl/dist/maplibre-gl.css';

import type { FeatureCollection } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { MapColors } from '@/theme/tokens';

import type { GlobeMapProps } from './GlobeMap.types';
import type { MapCity, MapCountry } from './mapData';

/**
 * The world globe, on MapLibre GL JS v5 with free OpenFreeMap tiles (no key, no card).
 * Pinned to v5 on purpose: v6 ships ESM-only and loads its web worker from a separate URL, which
 * Metro doesn't bundle; v5 inlines the worker, so it just works in the Expo web build.
 *
 * MapLibre and the country shapes are imported lazily, so they're only downloaded when the Map
 * tab is opened — not on every app start.
 */

const DEFAULT_CENTER: [number, number] = [12, 30];
/** Zoom at which the globe's diameter fills ~85% of the shorter side of the map — measured: at
 * zoom z the globe is roughly 160·2^z px across. */
function worldZoom(container: HTMLElement): number {
  const side = Math.min(container.clientWidth, container.clientHeight);
  return Math.max(0, Math.log2((side * 0.85) / 160));
}
const FLY_DURATION_MS = 2200;

type MapLibreModule = typeof import('maplibre-gl');

function citiesGeoJson(cities: MapCity[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: cities.map((c) => ({
      type: 'Feature',
      properties: { id: c.id, name: c.name, kind: c.kind },
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
    })),
  };
}

/** Paint expression for a country fill: its trip kind's color, transparent for the rest. */
function countryColorExpression(countries: MapCountry[], colors: MapColors) {
  if (countries.length === 0) return 'rgba(0,0,0,0)';
  const pairs = countries.flatMap((c) => [
    c.iso,
    c.kind === 'traveled' ? colors.traveled : colors.planned,
  ]);
  return ['match', ['get', 'iso'], ...pairs, 'rgba(0,0,0,0)'] as unknown as string;
}

function countryFilter(countries: MapCountry[]) {
  return ['in', ['get', 'iso'], ['literal', countries.map((c) => c.iso)]] as unknown as boolean;
}

/** Repaints the OpenFreeMap base in the app's palette, then adds the trip layers just under the
 * base map's labels, so place names stay readable over highlighted countries. */
function setupLayers(
  map: MapLibreMap,
  countriesGeoJson: FeatureCollection,
  colors: MapColors,
  countries: MapCountry[],
  cities: MapCity[],
) {
  map.setProjection({ type: 'globe' });
  map.setSky({
    'sky-color': colors.space,
    'horizon-color': colors.atmosphere,
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
  });

  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    if (layer.type === 'background')
      map.setPaintProperty(layer.id, 'background-color', colors.land);
    if (layer.id === 'water' && layer.type === 'fill') {
      map.setPaintProperty(layer.id, 'fill-color', colors.water);
    }
  }
  const firstLabel = layers.find((l) => l.type === 'symbol')?.id;

  map.addSource('trip-countries', { type: 'geojson', data: countriesGeoJson });
  map.addLayer(
    {
      id: 'trip-country-fill',
      type: 'fill',
      source: 'trip-countries',
      filter: countryFilter(countries),
      paint: {
        'fill-color': countryColorExpression(countries, colors),
        // 1:110m shapes are coarse up close: fade them out as the real coastline takes over.
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.75, 5, 0.3, 7, 0],
      },
    },
    firstLabel,
  );
  map.addLayer(
    {
      id: 'trip-country-outline',
      type: 'line',
      source: 'trip-countries',
      filter: countryFilter(countries),
      paint: {
        'line-color': colors.countryOutline,
        'line-width': 0.8,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.7, 6, 0],
      },
    },
    firstLabel,
  );

  map.addSource('trip-cities', { type: 'geojson', data: citiesGeoJson(cities) });
  map.addLayer({
    id: 'trip-city-dot',
    type: 'circle',
    source: 'trip-cities',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 3.5, 6, 7],
      'circle-color': colors.city,
      'circle-stroke-color': colors.cityHalo,
      'circle-stroke-width': 2,
    },
  });
  map.addLayer({
    id: 'trip-city-label',
    type: 'symbol',
    source: 'trip-cities',
    minzoom: 3,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 13,
      'text-offset': [0, 1.1],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': colors.city,
      'text-halo-color': colors.cityHalo,
      'text-halo-width': 1.5,
    },
  });
}

export function GlobeMap({
  colors,
  countries,
  cities,
  focus,
  onCityPress,
  onBackgroundPress,
}: GlobeMapProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const countriesRef = useRef<FeatureCollection | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  // Latest props, read from MapLibre event handlers registered once at creation.
  const latest = useRef({ colors, countries, cities, onCityPress, onBackgroundPress });
  useLayoutEffect(() => {
    latest.current = { colors, countries, cities, onCityPress, onBackgroundPress };
  });

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      try {
        const [mod, shapes] = await Promise.all([
          import('maplibre-gl'),
          import('./countries-110m.json'),
        ]);
        // v5 is a CommonJS/UMD build: depending on interop it arrives as the namespace itself or
        // wrapped in `default`.
        const maplibre = ((mod as { default?: MapLibreModule }).default ?? mod) as MapLibreModule;
        if (cancelled || !containerRef.current) return;
        countriesRef.current = (shapes.default ?? shapes) as unknown as FeatureCollection;

        map = new maplibre.Map({
          container: containerRef.current,
          style: latest.current.colors.style,
          center: DEFAULT_CENTER,
          zoom: worldZoom(containerRef.current),
          attributionControl: { compact: true },
        });
        mapRef.current = map;

        // Fires on first load and again after every setStyle (theme switch): the base style
        // replaces all layers, so the trip layers are added back each time.
        map.on('style.load', () => {
          const { colors: c, countries: k, cities: ci } = latest.current;
          if (!map || !countriesRef.current) return;
          setupLayers(map, countriesRef.current, c, k, ci);
          setReady(true);
        });

        // The dark base style references POI icons its sprite doesn't include; a blank stand-in
        // keeps MapLibre from warning about each one.
        map.on('styleimagemissing', (e) => {
          if (map && !map.hasImage(e.id)) {
            map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
          }
        });

        map.on('click', (e) => {
          const hit = map?.queryRenderedFeatures(e.point, { layers: ['trip-city-dot'] })[0];
          const id = hit?.properties?.id;
          if (typeof id === 'string') latest.current.onCityPress(id);
          else latest.current.onBackgroundPress();
        });
        map.on('mouseenter', 'trip-city-dot', () => {
          if (map) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'trip-city-dot', () => {
          if (map) map.getCanvas().style.cursor = '';
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'The map could not load.');
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Theme switch: swap the base style; 'style.load' re-adds the trip layers in the new colors.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(colors.style);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the base style URL matters here
  }, [colors.style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getLayer('trip-country-fill')) return;
    map.setFilter('trip-country-fill', countryFilter(countries));
    map.setFilter('trip-country-outline', countryFilter(countries));
    map.setPaintProperty(
      'trip-country-fill',
      'fill-color',
      countryColorExpression(countries, colors),
    );
    (map.getSource('trip-cities') as GeoJSONSource | undefined)?.setData(citiesGeoJson(cities));
  }, [countries, cities, colors, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !focus) return;
    if (focus.world && containerRef.current) {
      map.flyTo({
        center: DEFAULT_CENTER,
        zoom: worldZoom(containerRef.current),
        duration: FLY_DURATION_MS,
        essential: true,
      });
    } else if (focus.bounds) {
      map.fitBounds(focus.bounds, {
        padding: 90,
        maxZoom: 6.5,
        duration: FLY_DURATION_MS,
        essential: true,
      });
    } else if (focus.center) {
      map.flyTo({
        center: focus.center,
        zoom: focus.zoom ?? 6,
        duration: FLY_DURATION_MS,
        essential: true,
      });
    }
  }, [focus, ready]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.space }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {!ready && !error ? (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : null}
      {error ? (
        <View
          style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
