import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import type { ItineraryDay } from '@/features/itinerary/types';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import type { TripKind } from './mapData';

/** Small floating surface the map overlays share, so they read over both land and water. */
export function useFloatingStyle() {
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
  active,
  onPress,
}: {
  label: string;
  kind: TripKind | null;
  active?: boolean;
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
          borderColor: active ? theme.colors.accent : theme.colors.border,
          borderWidth: active ? 2 : 1,
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

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
          borderRadius: theme.radius.pill,
          borderColor: active ? theme.colors.accent : theme.colors.border,
          borderWidth: active ? 2 : 1,
          paddingHorizontal: theme.space.md,
          paddingVertical: 6,
          opacity: pressed ? 0.8 : hovered ? 0.92 : 1,
        },
      ]}
    >
      <Text
        style={[
          theme.type.caption,
          { fontSize: 14, color: active ? theme.colors.accent : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Narrows the focused trip's map down to a single itinerary day: its places and the leg traveled
 * that day. Only shown while one trip is in focus — there's no "day 3" across several trips. */
export function DayFilter({
  days,
  dayId,
  onSelect,
}: {
  days: ItineraryDay[];
  dayId: string | null;
  onSelect: (dayId: string | null) => void;
}) {
  const theme = useTheme();
  if (days.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: theme.space.lg, gap: theme.space.xs }}
    >
      <Pill label="All days" active={dayId === null} onPress={() => onSelect(null)} />
      {days.map((day) => (
        <Pill
          key={day.id}
          label={`Day ${day.dayIndex + 1}`}
          active={dayId === day.id}
          onPress={() => onSelect(day.id)}
        />
      ))}
    </ScrollView>
  );
}

/** Reloads the map's data on demand — e.g. after adding a trip on another tab. */
export function RefreshButton({
  refreshing,
  onPress,
}: {
  refreshing: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const floating = useFloatingStyle();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <Pressable
      onPress={onPress}
      disabled={refreshing}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessibilityRole="button"
      accessibilityLabel="Refresh map"
      style={({ pressed }) => [
        floating,
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.75 : hovered ? 0.9 : 1,
        },
      ]}
    >
      {refreshing ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : (
        <Ionicons name="refresh" size={22} color={theme.colors.text} />
      )}
    </Pressable>
  );
}

/**
 * Zoom buttons. The map had none: on a phone the only way out of a close-up was a
 * pinch, and the panel over the bottom half left little room to make one.
 */
export function ZoomControls({ onZoom }: { onZoom: (steps: number) => void }) {
  const theme = useTheme();
  const floating = useFloatingStyle();

  return (
    <View style={[floating, { overflow: 'hidden' }]}>
      <ZoomButton label="Zoom in" icon="add" onPress={() => onZoom(1)} />
      <View style={{ height: 1, backgroundColor: theme.colors.border }} />
      <ZoomButton label="Zoom out" icon="remove" onPress={() => onZoom(-1)} />
    </View>
  );
}

function ZoomButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'add' | 'remove';
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hovered ? theme.colors.surfaceAlt : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={22} color={theme.colors.text} />
    </Pressable>
  );
}
