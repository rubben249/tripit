import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { formatDateRange } from '@/lib/dates';
import { usePressFeedback } from '@/lib/motion';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const theme = useTheme();
  const effectiveStatus = getEffectiveStatus(trip);
  const isOngoing = effectiveStatus === 'ongoing';
  const press = usePressFeedback(theme.motion.pressScale.surface);

  // The trip you're on is the dark card in light mode. In dark mode ink is almost
  // the page background, so the same card would vanish — there it becomes a warm
  // raised surface with an accent edge, which carries the same "this one" meaning.
  const onDark = theme.scheme === 'dark';
  const highlightBackground = onDark ? theme.colors.accentSoft : theme.colors.solid;
  const titleColor = isOngoing ? theme.colors.onInk : theme.colors.text;
  const metaColor = isOngoing ? theme.colors.mist : theme.colors.textMuted;

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trip.name}, ${STATUS_LABEL[effectiveStatus] ?? ''}`}
      onHoverIn={press.onHoverIn}
      onHoverOut={press.onHoverOut}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        press.animatedStyle,
        {
          backgroundColor: isOngoing
            ? highlightBackground
            : press.hovered
              ? theme.colors.surfaceAlt
              : theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: isOngoing && !onDark ? 0 : 1,
          borderColor: isOngoing ? theme.colors.accent : theme.colors.border,
          paddingVertical: theme.space.md,
          paddingHorizontal: theme.space.md,
          gap: theme.space.xs,
          ...(press.hovered ? theme.elevation.floating : theme.elevation.raised),
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space.sm,
        }}
      >
        <Text numberOfLines={2} style={[theme.type.section, { color: titleColor, flexShrink: 1 }]}>
          {trip.name}
        </Text>
        <StatusPill label={STATUS_LABEL[effectiveStatus] ?? ''} onInk={isOngoing} />
      </View>

      {trip.startDate && trip.endDate ? (
        <Text style={[theme.type.data, { fontSize: 13, color: metaColor }]}>
          {formatDateRange(trip.startDate, trip.endDate)}
        </Text>
      ) : null}
      <TripCountdown trip={trip} color={isOngoing ? theme.colors.mist : theme.colors.textMuted} />
    </AnimatedPressable>
  );
}

function StatusPill({ label, onInk }: { label: string; onInk: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.space.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: onInk ? 'rgba(201,174,140,0.16)' : theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: onInk ? 'transparent' : theme.colors.borderSoft,
      }}
    >
      <Text
        style={[theme.type.label, { color: onInk ? theme.colors.accent : theme.colors.textMuted }]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
