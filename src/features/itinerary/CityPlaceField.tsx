import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { countryFlag } from '@/lib/countries';
import { describePlace, searchPlaces, type Place } from '@/lib/geocoding';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

const SEARCH_DELAY_MS = 300;

/** City name input with place suggestions, so "Rome" can be pinned to Rome, Italy rather than
 * Rome, Georgia — the choice gives the city its coordinates for the map. Typing again clears it. */
export function CityPlaceField({
  value,
  onChangeText,
  selected,
  onSelect,
}: {
  value: string;
  onChangeText: (text: string) => void;
  selected: Place | null;
  onSelect: (place: Place | null) => void;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setQuery(value.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [value]);

  const { data: places } = useQuery({
    queryKey: ['places', query],
    queryFn: () => searchPlaces(query),
    enabled: query.length >= 2 && !selected,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  return (
    <View style={{ flex: 1, gap: theme.space.xs }}>
      <TextField
        value={value}
        onChangeText={(text) => {
          onSelect(null);
          onChangeText(text);
        }}
        placeholder="Add a city…"
        name="new-city-name"
      />
      {selected ? (
        <Text style={[theme.type.caption, { color: theme.colors.accent }]}>
          {selected.countryCode ? `${countryFlag(selected.countryCode)} ` : ''}
          {describePlace(selected)}
        </Text>
      ) : places && places.length > 0 && value.trim().length >= 2 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
          }}
        >
          {places.map((place) => (
            <PlaceOption
              key={place.id}
              place={place}
              onPress={() => {
                onSelect(place);
                onChangeText(place.name);
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PlaceOption({ place, onPress }: { place: Place; onPress: () => void }) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.sm,
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.sm,
        backgroundColor: hovered || pressed ? theme.colors.surfaceAlt : 'transparent',
      })}
    >
      <Text style={{ fontSize: 18 }}>
        {place.countryCode ? countryFlag(place.countryCode) : ''}
      </Text>
      <Text style={[theme.type.body, { flex: 1, color: theme.colors.text }]}>
        {describePlace(place)}
      </Text>
      <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
}
