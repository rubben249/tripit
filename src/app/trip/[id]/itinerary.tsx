import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { formatDayLabel } from '@/lib/dates';
import { AddBookingForm } from '@/features/itinerary/AddBookingForm';
import { BookingRow } from '@/features/itinerary/BookingRow';
import { useBookings, useItineraryDays } from '@/features/itinerary/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function ItineraryScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: days } = useItineraryDays(id);
  const { data: bookings } = useBookings(id);
  const [addingToDay, setAddingToDay] = useState<string | null>(null);

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
      {days.map((day) => {
        const dayBookings = (bookings ?? [])
          .filter((b) => b.dayId === day.id)
          .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? ''));

        return (
          <View key={day.id} style={{ gap: theme.space.xs }}>
            <Text style={[theme.type.title, { color: theme.colors.text }]}>
              Day {day.dayIndex + 1} · {formatDayLabel(day.date)}
            </Text>

            {dayBookings.length === 0 ? (
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                Nothing planned yet.
              </Text>
            ) : (
              dayBookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)
            )}

            {addingToDay === day.id ? (
              <AddBookingForm
                tripId={id}
                dayId={day.id}
                cityId={day.cityId}
                date={day.date}
                onDone={() => setAddingToDay(null)}
              />
            ) : (
              <Button variant="dashed" size="sm" onPress={() => setAddingToDay(day.id)}>
                + Add
              </Button>
            )}
          </View>
        );
      })}
    </Screen>
  );
}
