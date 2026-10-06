import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { forwardRef } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { formatDayLabel } from '@/lib/dates';
import { stagger } from '@/lib/motion';
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
      {days.map((day, i) => (
        <Animated.View key={day.id} entering={FadeInDown.duration(240).delay(stagger(i))}>
          <DayRow tripId={id} day={day} bookings={bookings ?? []} />
        </Animated.View>
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
  // Today is the one day someone opens this screen to find while traveling.
  const isToday = day.date === format(new Date(), 'yyyy-MM-dd');

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
        borderColor: isToday ? theme.colors.accent : theme.colors.border,
        backgroundColor: hovered ? theme.colors.surfaceAlt : theme.colors.surface,
        opacity: pressed ? 0.8 : 1,
        ...(hovered ? theme.elevation.raised : null),
      })}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
          <Text style={[theme.type.section, { color: theme.colors.text, flexShrink: 1 }]}>
            Day {day.dayIndex + 1} · {formatDayLabel(day.date)}
          </Text>
          {isToday ? (
            <Text style={[theme.type.label, { color: theme.colors.accent }]}>TODAY</Text>
          ) : null}
        </View>
        {day.notes ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="document-text-outline" size={16} color={theme.colors.accent} />
            <Text
              numberOfLines={1}
              style={[theme.type.body, { fontSize: 14, flex: 1, color: theme.colors.textMuted }]}
            >
              {day.notes}
            </Text>
          </View>
        ) : null}
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
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textFaint} />
    </Pressable>
  );
});
