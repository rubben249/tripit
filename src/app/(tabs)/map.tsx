import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlobeMap } from '@/features/map/GlobeMap';
import type { FocusRequest } from '@/features/map/GlobeMap.types';
import { CityCard, Legend, TripChip } from '@/features/map/MapOverlays';
import { useAllCities, useGeocodeMissingCities } from '@/features/map/hooks';
import { buildMapData } from '@/features/map/mapData';
import { useTrips } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function MapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: trips } = useTrips();
  const { data: cities } = useAllCities();
  useGeocodeMissingCities();

  const data = useMemo(() => buildMapData(trips ?? [], cities ?? []), [trips, cities]);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const selectedCity = data.cities.find((c) => c.id === selectedCityId) ?? null;

  const flyToCity = (cityId: string) => {
    const city = data.cities.find((c) => c.id === cityId);
    if (!city) return;
    setSelectedCityId(cityId);
    setFocus({ key: Date.now(), center: [city.lng, city.lat], zoom: 6 });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.map.space }}>
      <GlobeMap
        colors={theme.map}
        countries={data.countries}
        cities={data.cities}
        focus={focus}
        onCityPress={flyToCity}
        onBackgroundPress={() => setSelectedCityId(null)}
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
        {selectedCity ? (
          <View style={{ paddingHorizontal: theme.space.lg }}>
            <CityCard city={selectedCity} onClose={() => setSelectedCityId(null)} />
          </View>
        ) : null}
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
                setSelectedCityId(null);
                setFocus({ key: Date.now(), world: true });
              }}
            />
            {data.trips.map((trip) => (
              <TripChip
                key={trip.id}
                label={trip.name}
                kind={trip.kind}
                onPress={() => {
                  setSelectedCityId(null);
                  setFocus({ key: Date.now(), bounds: trip.bounds });
                }}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
