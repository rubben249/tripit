import { Text } from 'react-native';

import { formatCountdown } from '@/lib/countdown';
import { useTheme } from '@/theme/ThemeProvider';

import { getEffectiveStatus } from './status';
import type { Trip } from './types';

/** Countdown to a trip's start, or an elegant "already traveled" mark once it's past. Nothing for drafts/ongoing/archived trips — their own status badge already says enough. */
export function TripCountdown({
  trip,
  color,
  size = 'sm',
}: {
  trip: Trip;
  color?: string;
  size?: 'sm' | 'md';
}) {
  const theme = useTheme();
  const status = getEffectiveStatus(trip);

  if (status === 'past') {
    return (
      <Text
        style={[
          theme.type.caption,
          {
            fontFamily: theme.fontFamily.displayItalic,
            fontSize: size === 'md' ? 15 : 13,
            color: color ?? theme.colors.textMuted,
          },
        ]}
      >
        ✦ Already traveled
      </Text>
    );
  }

  if (status !== 'upcoming' || !trip.startDate) return null;

  const countdown = formatCountdown(trip.startDate);
  if (!countdown) return null;

  return (
    <Text
      style={[
        size === 'md' ? theme.type.title : theme.type.caption,
        size === 'md' ? { fontSize: 15 } : null,
        { color: color ?? theme.colors.textMuted },
      ]}
    >
      {countdown} to go
    </Text>
  );
}
