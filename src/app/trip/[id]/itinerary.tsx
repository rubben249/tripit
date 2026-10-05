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

  // Avoid flashing the empty-state text while the local database is still opening.
  if (!days) return null;

  if (days.length === 0) {
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

function DayRow({
  tripId,
  day,
  bookings,
}: {
  tripId: string;
  day: ItineraryDay;
  bookings: Booking[];
}) {
  return (
    <Link href={`/trip/${tripId}/day/${day.id}` as never} asChild>
      <DayRowLink day={day} bookings={bookings} />
    </Link>
  );
}

// Link asChild (Radix Slot) merges styles with an object spread, which silently drops a
// function-style on its direct child — so the Pressable lives one level down, behind forwardRef,
// and spreads Link's props before its own style.
const DayRowLink = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { day: ItineraryDay; bookings: Booking[] }
>(function DayRowLinkInner({ day, bookings, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  const highlights = getDayHighlights(day, bookings);

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        padding: theme.space.lg,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.75 : hovered ? 0.92 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[theme.type.title, { fontSize: 19, color: theme.colors.text }]}>
          Day {day.dayIndex + 1} · {formatDayLabel(day.date)}
        </Text>
        {highlights.length === 0 ? (
          <Text style={[theme.type.body, { fontSize: 14, color: theme.colors.textMuted }]}>
            Nothing planned yet
          </Text>
        ) : (
          highlights.map((h) => (
            <View key={h.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={h.icon} size={16} color={h.color} />
              <Text style={[theme.type.body, { fontSize: 14, color: theme.colors.textMuted }]}>
                {h.text}
              </Text>
            </View>
          ))
        )}
      </View>
      <Ionicons name="chevron-forward" size={22} color={theme.colors.textMuted} />
    </Pressable>
  );
});
