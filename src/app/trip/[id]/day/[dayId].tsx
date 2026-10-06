import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, Stack, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { formatDayLabel } from '@/lib/dates';
import { BookingCard } from '@/features/itinerary/BookingCard';
import { BookingForm } from '@/features/itinerary/BookingForm';
import { getDayBookings } from '@/features/itinerary/daySummary';
import { useBookings, useItineraryDays } from '@/features/itinerary/hooks';
import { useTripPlaces } from '@/features/places/hooks';
import { useTrip } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function DayDetailScreen() {
  const theme = useTheme();
  // `add=1` comes from the quick-add (+) button: open the booking form straight away.
  const { id, dayId, add } = useLocalSearchParams<{ id: string; dayId: string; add?: string }>();
  const { data: trip } = useTrip(id);
  const { data: days } = useItineraryDays(id);
  const { data: bookings } = useBookings(id);
  const { numbers: placeNumbers } = useTripPlaces(id);
  const [adding, setAdding] = useState(add === '1');

  const day = days?.find((d) => d.id === dayId);
  if (!day || !trip) return null;

  const dayBookings = getDayBookings(day, bookings ?? []);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: `Day ${day.dayIndex + 1}` }} />
      <Link href={`/trip/${id}/itinerary`} asChild>
        <Button variant="ghost" size="sm" icon="chevron-back" style={{ alignSelf: 'flex-start' }}>
          All days
        </Button>
      </Link>

      <Text style={[theme.type.headline, { color: theme.colors.text }]}>
        Day {day.dayIndex + 1} · {formatDayLabel(day.date)}
      </Text>

      {dayBookings.length === 0 ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Nothing planned yet.
        </Text>
      ) : (
        <View style={{ gap: theme.space.md }}>
          {dayBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              tripId={id}
              defaultCurrency={trip.defaultCurrency}
              placeNumber={placeNumbers.get(booking.id)}
            />
          ))}
        </View>
      )}

      {adding ? (
        <BookingForm
          tripId={id}
          dayId={day.id}
          cityId={day.cityId}
          date={day.date}
          defaultCurrency={trip.defaultCurrency}
          onDone={() => setAdding(false)}
        />
      ) : (
        <Button variant="dashed" icon="add" fullWidth onPress={() => setAdding(true)}>
          Add to this day
        </Button>
      )}
    </Screen>
  );
}
