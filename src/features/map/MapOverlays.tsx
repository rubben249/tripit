import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { countryFlag } from '@/lib/countries';
import { formatDateRange } from '@/lib/dates';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import type { MapCity, TripKind } from './mapData';

/** Small floating surface the map overlays share, so they read over both land and water. */
function useFloatingStyle() {
  const theme = useTheme();
  return {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.18)',
  } as const;
}

export function Legend() {
  const theme = useTheme();
  const floating = useFloatingStyle();
  const items: { kind: TripKind; label: string }[] = [
    { kind: 'traveled', label: 'Traveled' },
    { kind: 'planned', label: 'Planned' },
  ];
  return (
    <View
      style={[
        floating,
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          gap: theme.space.md,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.xs,
        },
      ]}
    >
      {items.map((item) => (
        <View key={item.kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: item.kind === 'traveled' ? theme.map.traveled : theme.map.planned,
            }}
          />
          <Text style={[theme.type.caption, { color: theme.colors.text }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function TripChip({
  label,
  kind,
  onPress,
}: {
  label: string;
  kind: TripKind | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  const floating = useFloatingStyle();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [
        floating,
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          opacity: pressed ? 0.8 : hovered ? 0.92 : 1,
        },
      ]}
    >
      {kind ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: kind === 'traveled' ? theme.map.traveled : theme.map.planned,
          }}
        />
      ) : (
        <Ionicons name="globe-outline" size={15} color={theme.colors.text} />
      )}
      <Text style={[theme.type.body, { fontSize: 15, color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function CityCard({ city, onClose }: { city: MapCity; onClose: () => void }) {
  const theme = useTheme();
  const floating = useFloatingStyle();
  return (
    <View style={[floating, { padding: theme.space.md, gap: theme.space.sm, maxWidth: 420 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[theme.type.title, { fontSize: 19, color: theme.colors.text }]}>
            {city.countryCode ? `${countryFlag(city.countryCode)}  ` : ''}
            {city.name}
          </Text>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            {city.tripName}
            {city.arrivalDate && city.departureDate
              ? ` · ${formatDateRange(city.arrivalDate, city.departureDate)}`
              : ''}
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={8}>
          <Ionicons name="close" size={20} color={theme.colors.textMuted} />
        </Pressable>
      </View>
      <Link href={`/trip/${city.tripId}`} asChild>
        <Button size="sm" style={{ alignSelf: 'flex-start' }}>
          Open trip ›
        </Button>
      </Link>
    </View>
  );
}
