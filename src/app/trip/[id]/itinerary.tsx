import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { formatDayLabel } from '@/lib/dates';
import { useHoverable } from '@/lib/useHoverable';
import { getDayHighlights } from '@/features/itinerary/daySummary';
import { useBookings, useItineraryDays } from '@/features/itinerary/hooks';
import type { Booking, ItineraryDay } from '@/features/itinerary/types';
import { useTheme } from '@/theme/ThemeProvider';

export default function ItineraryScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: days } = useItineraryDays(id);
  const { data: bookings } = useBookings(id);

  if (!days || days.length === 0) {
    return (
      <Screen>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Add a city with arrival and departure dates on the Overview tab to generate the day-by-day
          itinerary.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        Tap a day to see and edit everything planned for it.
      </Text>
      {days.map((day) => (
        <DayRow key={day.id} tripId={id} day={day} bookings={bookings ?? []} />
      ))}
    </Screen>
  );
}

const DayRow = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { tripId: string; day: ItineraryDay; bookings: Booking[] }
>(function DayRowInner({ tripId, day, bookings, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  const highlights = getDayHighlights(day, bookings);

  return (
    <Link href={`/trip/${tripId}/day/${day.id}` as never} asChild>
      <Pressable
        ref={ref}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.sm,
          padding: theme.space.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.75 : hovered ? 0.92 : 1,
        })}
        {...pressableProps}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[theme.type.title, { color: theme.colors.text }]}>
            Day {day.dayIndex + 1} · {formatDayLabel(day.date)}
          </Text>
          {highlights.length === 0 ? (
            <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
              Nothing planned yet
            </Text>
          ) : (
            highlights.map((h) => (
              <View key={h.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={h.icon} size={13} color={h.color} />
                <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                  {h.text}
                </Text>
              </View>
            ))
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </Pressable>
    </Link>
  );
});
