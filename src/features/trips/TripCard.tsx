import { Pressable, Text, View } from 'react-native';

import { formatDateRange } from '@/lib/dates';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { getEffectiveStatus } from './status';
import { TripCountdown } from './TripCountdown';
import type { Trip } from './types';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  past: 'Past',
  archived: 'Archived',
};

export function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const theme = useTheme();
  const effectiveStatus = getEffectiveStatus(trip);
  const isOngoing = effectiveStatus === 'ongoing';
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [
        {
          backgroundColor: isOngoing ? theme.colors.ink : theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: isOngoing ? 0 : 1,
          borderColor: theme.colors.border,
          padding: theme.space.md,
          gap: theme.space.xs,
          opacity: pressed ? 0.85 : hovered ? 0.92 : 1,
        },
      ]}
    >
      <Text
        style={[
          theme.type.title,
          { fontFamily: theme.fontFamily.display, fontSize: 19 },
          { color: isOngoing ? theme.colors.onInk : theme.colors.text },
        ]}
      >
        {trip.name}
      </Text>
      {trip.startDate && trip.endDate ? (
        <Text
          style={[
            theme.type.caption,
            { color: isOngoing ? theme.colors.mist : theme.colors.textMuted },
          ]}
        >
          {formatDateRange(trip.startDate, trip.endDate)}
        </Text>
      ) : null}
      <TripCountdown trip={trip} color={isOngoing ? theme.colors.mist : theme.colors.textMuted} />
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.xs }}
      >
        <Text
          style={[
            theme.type.data,
            { fontSize: 10, color: isOngoing ? theme.colors.accent : theme.colors.textMuted },
          ]}
        >
          {STATUS_LABEL[effectiveStatus]?.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}
