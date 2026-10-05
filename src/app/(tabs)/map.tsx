import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlobeMap } from '@/features/map/GlobeMap';
import type { FocusRequest } from '@/features/map/GlobeMap.types';
import { CityCard, CountryCard, PlaceCard, TripCard } from '@/features/map/MapCards';
import { Legend, TripChip } from '@/features/map/MapOverlays';
import { useAllCities, useMapBackfill } from '@/features/map/hooks';
import {
  boundsOf,
  buildMapData,
  unionBounds,
  type Bounds,
  type MapPlace,
} from '@/features/map/mapData';
import { useMapTripData } from '@/features/places/hooks';
import { buildPlaces, type Place } from '@/features/places/places';
import { useTrips } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

type Selection =
  | { kind: 'trip'; tripId: string }
  | { kind: 'country'; iso: string }
  | { kind: 'city'; cityId: string }
  | { kind: 'place'; bookingId: string };

/** Zoom caps per kind of framing: a country stays a country, a city's places get room to spread. */
const MAX_ZOOM = { country: 7, trip: 12, city: 14, place: 15 } as const;

export default function MapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: trips } = useTrips();
  const { data: cities } = useAllCities();
  const { data: tripData } = useMapTripData();
  useMapBackfill();

  const data = useMemo(() => buildMapData(trips ?? [], cities ?? []), [trips, cities]);

  /** Every trip's numbered places, in time order. */
  const placesByTrip = useMemo(() => {
    const byTrip = new Map<string, Place[]>();
    for (const trip of trips ?? []) {
      byTrip.set(
        trip.id,
        buildPlaces(
          (tripData?.bookings ?? []).filter((b) => b.tripId === trip.id),
          (tripData?.days ?? []).filter((d) => d.tripId === trip.id),
          (cities ?? []).filter((c) => c.tripId === trip.id),
        ),
      );
    }
    return byTrip;
  }, [trips, cities, tripData]);
  const allPlaces = useMemo(() => [...placesByTrip.values()].flat(), [placesByTrip]);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);

  const cityCountry = (cityId: string | null) =>
    data.cities.find((c) => c.id === cityId)?.countryCode ?? null;
  const tripsInCountry = (iso: string) =>
    (trips ?? []).filter((t) =>
      data.cities.some((c) => c.tripId === t.id && c.countryCode === iso),
    );
  const placesInCountry = (tripId: string, iso: string) =>
    (placesByTrip.get(tripId) ?? []).filter((p) => cityCountry(p.cityId) === iso);

  const selectedPlace =
    selection?.kind === 'place'
      ? allPlaces.find((p) => p.booking.id === selection.bookingId)
      : undefined;
  const selectedCity =
    selection?.kind === 'city' ? data.cities.find((c) => c.id === selection.cityId) : undefined;

  const highlightTripIds =
    selection?.kind === 'trip'
      ? [selection.tripId]
      : selection?.kind === 'country'
        ? tripsInCountry(selection.iso).map((t) => t.id)
        : selectedCity
          ? [selectedCity.tripId]
          : selectedPlace
            ? [selectedPlace.booking.tripId as string]
            : [];

  const mapPlaces: MapPlace[] = highlightTripIds.flatMap((tripId) =>
    (placesByTrip.get(tripId) ?? []).map((p) => ({
      id: p.booking.id,
      tripId,
      number: p.number,
      lat: p.lat,
      lng: p.lng,
      seen: p.seen,
    })),
  );

  /** Each request gets a new key, so asking for the same view twice still moves the camera. */
  const requestFocus = (request: Omit<FocusRequest, 'key'>) =>
    setFocus((prev) => ({ ...request, key: (prev?.key ?? 0) + 1 }));

  const frame = (bounds: Bounds | null, maxZoom: number) => {
    if (bounds) requestFocus({ bounds, maxZoom });
  };

  const selectTrip = (tripId: string) => {
    setSelection({ kind: 'trip', tripId });
    const points = [
      ...data.cities.filter((c) => c.tripId === tripId),
      ...(placesByTrip.get(tripId) ?? []),
    ];
    frame(points.length ? boundsOf(points) : null, MAX_ZOOM.trip);
  };

  /** Frames the whole country (its mainland) plus every city and place of its trips there. */
  const selectCountry = (iso: string, mainland: Bounds | null) => {
    setSelection({ kind: 'country', iso });
    const tripIds = tripsInCountry(iso).map((t) => t.id);
    const points = [
      ...data.cities.filter((c) => tripIds.includes(c.tripId) && c.countryCode === iso),
      ...tripIds.flatMap((id) => placesInCountry(id, iso)),
    ];
    frame(unionBounds(mainland, points.length ? boundsOf(points) : null), MAX_ZOOM.country);
  };

  const selectCity = (cityId: string) => {
    const city = data.cities.find((c) => c.id === cityId);
    if (!city) return;
    setSelection({ kind: 'city', cityId });
    const places = (placesByTrip.get(city.tripId) ?? []).filter((p) => p.cityId === cityId);
    if (places.length > 0) frame(boundsOf([city, ...places]), MAX_ZOOM.city);
    else requestFocus({ center: [city.lng, city.lat], zoom: 6 });
  };

  const selectPlace = (bookingId: string) => {
    const place = allPlaces.find((p) => p.booking.id === bookingId);
    if (!place) return;
    setSelection({ kind: 'place', bookingId });
    requestFocus({ center: [place.lng, place.lat], zoom: MAX_ZOOM.place });
  };

  const close = () => setSelection(null);

  let card = null;
  if (selection?.kind === 'trip') {
    const trip = trips?.find((t) => t.id === selection.tripId);
    if (trip) {
      card = (
        <TripCard
          trip={trip}
          places={placesByTrip.get(trip.id) ?? []}
          onSelectPlace={selectPlace}
          onClose={close}
        />
      );
    }
  } else if (selection?.kind === 'country') {
    card = (
      <CountryCard
        iso={selection.iso}
        trips={tripsInCountry(selection.iso).map((trip) => ({
          trip,
          places: placesInCountry(trip.id, selection.iso),
        }))}
        onSelectPlace={selectPlace}
        onClose={close}
      />
    );
  } else if (selectedCity) {
    card = (
      <CityCard
        city={selectedCity}
        places={(placesByTrip.get(selectedCity.tripId) ?? []).filter(
          (p) => p.cityId === selectedCity.id,
        )}
        onSelectPlace={selectPlace}
        onClose={close}
      />
    );
  } else if (selectedPlace) {
    card = (
      <PlaceCard
        place={selectedPlace}
        tripName={trips?.find((t) => t.id === selectedPlace.booking.tripId)?.name ?? ''}
        onClose={close}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.map.space }}>
      <GlobeMap
        colors={theme.map}
        countries={data.countries}
        cities={data.cities}
        highlightTripIds={highlightTripIds}
        places={mapPlaces}
        focus={focus}
        onCityPress={selectCity}
        onPlacePress={selectPlace}
        onCountryPress={selectCountry}
        onBackgroundPress={close}
      />

      <View
        style={{
          pointerEvents: 'box-none',
          position: 'absolute',
          top: insets.top + theme.space.md,
          left: theme.space.lg,
          right: theme.space.lg,
          gap: theme.space.xs,
        }}
      >
        <Text style={[theme.type.headline, { color: theme.colors.text }]}>Map</Text>
        {data.countries.length > 0 ? (
          <Legend />
        ) : (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            Add cities to a trip and they&apos;ll light up here.
          </Text>
        )}
      </View>

      <View
        style={{
          pointerEvents: 'box-none',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: theme.space.md,
          gap: theme.space.sm,
        }}
      >
        {card ? <View style={{ paddingHorizontal: theme.space.lg }}>{card}</View> : null}
        {data.trips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.space.lg, gap: theme.space.sm }}
          >
            <TripChip
              label="Whole world"
              kind={null}
              onPress={() => {
                close();
                requestFocus({ world: true });
              }}
            />
            {data.trips.map((trip) => (
              <TripChip
                key={trip.id}
                label={trip.name}
                kind={trip.kind}
                active={selection?.kind === 'trip' && selection.tripId === trip.id}
                onPress={() => selectTrip(trip.id)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
