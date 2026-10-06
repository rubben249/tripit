import 'maplibre-gl/dist/maplibre-gl.css';

import type { FeatureCollection } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { MapColors } from '@/theme/tokens';

import type { GlobeMapProps } from './GlobeMap.types';
import { mainlandBounds, type MapCity, type MapCountry, type MapPlace } from './mapData';
import { routeColorKey, type Route, type RouteStyle } from './routes';

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

function citiesGeoJson(cities: MapCity[], highlightTripIds: string[]): FeatureCollection {
  const highlighted = new Set(highlightTripIds);
  return {
    type: 'FeatureCollection',
    features: cities.map((c) => ({
      type: 'Feature',
      properties: { id: c.id, name: c.name, kind: c.kind, focus: highlighted.has(c.tripId) },
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
    })),
  };
}

function placesGeoJson(places: MapPlace[]): FeatureCollection {
  // Features draw in source order (last on top), so they're pre-sorted by draw order.
  const drawOrder = (p: MapPlace) => (p.seen ? -10_000 : 0) - p.number;
  return {
    type: 'FeatureCollection',
    features: [...places]
      .sort((a, b) => drawOrder(a) - drawOrder(b))
      .map((p) => ({
        type: 'Feature',
        // Where places overlap (same building, or zoomed out to a whole country) the next one to
        // visit draws on top: places still ahead above seen ones, then by number.
        properties: {
          id: p.id,
          label: String(p.number),
          seen: p.seen,
          order: drawOrder(p),
        },
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      })),
  };
}

function routesGeoJson(routes: Route[], colors: MapColors): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes.map((r) => ({
      type: 'Feature',
      properties: {
        id: r.id,
        style: r.style,
        color: colors.route[routeColorKey(r.mode) as keyof MapColors['route']],
      },
      geometry: { type: 'LineString', coordinates: r.coordinates },
    })),
  };
}

/** One line layer per leg style, because MapLibre can't take a dash pattern from the data.
 * Dashes are in line-widths, so they keep their look at every zoom. */
const ROUTE_LAYERS: { style: RouteStyle; dash?: number[]; width: number; opacity: number }[] = [
  { style: 'solid', width: 1, opacity: 0.9 },
  { style: 'dashed', dash: [2.2, 1.4], width: 1, opacity: 0.9 },
  { style: 'dotted', dash: [0.1, 2], width: 1, opacity: 0.9 },
  // No transport booked for this leg yet: thinner and softer, so it reads as a loose end.
  { style: 'faint', dash: [0.1, 2.6], width: 0.7, opacity: 0.6 },
];

const SEEN_ICON = 'place-seen-check';

/** The check shown on seen places — drawn on a canvas because the map's fonts have no ✓ glyph. */
function checkImage(color: string): ImageData {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(13, 25);
  ctx.lineTo(21, 33);
  ctx.lineTo(36, 16);
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

/** Room for the overlays: the title on top and the cards/chips at the bottom. */
function framePadding(container: HTMLElement) {
  const h = container.clientHeight;
  return { top: 100, bottom: Math.min(300, Math.round(h * 0.42)), left: 50, right: 50 };
}

const INTERACTIVE_LAYERS = ['trip-place-dot', 'trip-city-dot', 'trip-country-fill'];

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
  highlightTripIds: string[],
  places: MapPlace[],
  routes: Route[],
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
        // Simplified 1:50m shapes hold up to country zoom; fade out beyond it, where the real
        // coastline and streets take over.
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.75, 6, 0.35, 9, 0],
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
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.7, 7, 0.4, 9, 0],
      },
    },
    firstLabel,
  );

  map.addSource('trip-routes', { type: 'geojson', data: routesGeoJson(routes, colors) });
  for (const layer of ROUTE_LAYERS) {
    map.addLayer(
      {
        id: `trip-route-${layer.style}`,
        type: 'line',
        source: 'trip-routes',
        filter: ['==', ['get', 'style'], layer.style],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': layer.opacity,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1,
            1.6 * layer.width,
            6,
            3.2 * layer.width,
          ],
          ...(layer.dash ? { 'line-dasharray': layer.dash } : {}),
        },
      },
      firstLabel,
    );
  }

  map.addSource('trip-cities', {
    type: 'geojson',
    data: citiesGeoJson(cities, highlightTripIds),
  });
  map.addLayer({
    id: 'trip-city-dot',
    type: 'circle',
    source: 'trip-cities',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        1,
        ['case', ['get', 'focus'], 5, 3.5],
        6,
        ['case', ['get', 'focus'], 9, 7],
      ],
      'circle-color': ['case', ['get', 'focus'], colors.cityFocus, colors.city],
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
      'text-color': ['case', ['get', 'focus'], colors.cityFocus, colors.city],
      'text-halo-color': colors.cityHalo,
      'text-halo-width': 1.5,
    },
  });

  if (map.hasImage(SEEN_ICON)) map.removeImage(SEEN_ICON);
  map.addImage(SEEN_ICON, checkImage(colors.placeSeenMark), { pixelRatio: 2 });
  map.addSource('trip-places', { type: 'geojson', data: placesGeoJson(places) });
  map.addLayer({
    id: 'trip-place-dot',
    type: 'circle',
    source: 'trip-places',
    paint: {
      'circle-radius': ['case', ['get', 'seen'], 10, 12],
      'circle-color': ['case', ['get', 'seen'], colors.placeSeen, colors.place],
      'circle-stroke-color': colors.cityHalo,
      'circle-stroke-width': 2,
    },
  });
  map.addLayer({
    id: 'trip-place-number',
    type: 'symbol',
    source: 'trip-places',
    filter: ['!', ['get', 'seen']],
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
      'symbol-sort-key': ['get', 'order'],
    },
    paint: { 'text-color': colors.placeText },
  });
  map.addLayer({
    id: 'trip-place-check',
    type: 'symbol',
    source: 'trip-places',
    filter: ['get', 'seen'],
    layout: {
      'icon-image': SEEN_ICON,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });
}

export function GlobeMap({
  colors,
  countries,
  cities,
  highlightTripIds,
  places,
  routes,
  focus,
  onCityPress,
  onPlacePress,
  onCountryPress,
  onBackgroundPress,
}: GlobeMapProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const countriesRef = useRef<FeatureCollection | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  // Latest props, read from MapLibre event handlers registered once at creation.
  const props = {
    colors,
    countries,
    cities,
    highlightTripIds,
    places,
    routes,
    onCityPress,
    onPlacePress,
    onCountryPress,
    onBackgroundPress,
  };
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      try {
        const [mod, shapes] = await Promise.all([
          import('maplibre-gl'),
          import('./countries.json'),
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
          const l = latest.current;
          if (!map || !countriesRef.current) return;
          setupLayers(
            map,
            countriesRef.current,
            l.colors,
            l.countries,
            l.cities,
            l.highlightTripIds,
            l.places,
            l.routes,
          );
          setReady(true);
        });

        // The dark base style references POI icons its sprite doesn't include; a blank stand-in
        // keeps MapLibre from warning about each one.
        map.on('styleimagemissing', (e) => {
          if (map && !map.hasImage(e.id)) {
            map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
          }
        });

        // Topmost wins: a numbered place, then a city, then the country underneath.
        map.on('click', (e) => {
          const hits = map?.queryRenderedFeatures(e.point, { layers: INTERACTIVE_LAYERS }) ?? [];
          const place = hits.find((h) => h.layer.id === 'trip-place-dot');
          const city = hits.find((h) => h.layer.id === 'trip-city-dot');
          const country = hits.find((h) => h.layer.id === 'trip-country-fill');
          if (place) return latest.current.onPlacePress(String(place.properties.id));
          if (city) return latest.current.onCityPress(String(city.properties.id));
          if (country) {
            const iso = String(country.properties.iso);
            // Frame from the full-resolution shape, not the tile-clipped one under the pointer.
            const shape = countriesRef.current?.features.find((f) => f.properties?.iso === iso);
            return latest.current.onCountryPress(
              iso,
              shape ? mainlandBounds(shape.geometry) : null,
            );
          }
          latest.current.onBackgroundPress();
        });
        for (const layer of INTERACTIVE_LAYERS) {
          map.on('mouseenter', layer, () => {
            if (map) map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layer, () => {
            if (map) map.getCanvas().style.cursor = '';
          });
        }
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
    (map.getSource('trip-cities') as GeoJSONSource | undefined)?.setData(
      citiesGeoJson(cities, highlightTripIds),
    );
    (map.getSource('trip-places') as GeoJSONSource | undefined)?.setData(placesGeoJson(places));
    (map.getSource('trip-routes') as GeoJSONSource | undefined)?.setData(
      routesGeoJson(routes, colors),
    );
  }, [countries, cities, highlightTripIds, places, routes, colors, ready]);

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
    } else if (focus.bounds && containerRef.current) {
      map.fitBounds(focus.bounds, {
        padding: framePadding(containerRef.current),
        maxZoom: focus.maxZoom ?? 6.5,
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
