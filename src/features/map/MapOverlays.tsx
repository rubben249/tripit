import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

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
