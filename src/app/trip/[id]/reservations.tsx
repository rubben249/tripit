import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { bookingCategories, reservationCategoryKeys } from '@/features/bookings/categories';
import { BookingCard } from '@/features/itinerary/BookingCard';
import { useBookings } from '@/features/itinerary/hooks';
import { useTrip } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

/** All bookings at a glance, grouped by category instead of by day — flights, hotels, tickets etc.
 * Tap any card to edit it; it's the same booking shown on its Itinerary day, so edits here show up
 * there too (and vice versa) — one shared record, never two copies to fall out of sync. */
export default function ReservationsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: bookings } = useBookings(id);

  if (!trip) return null;

  if (!bookings || bookings.length === 0) {
    return (
      <Screen>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Nothing booked yet — add flights, hotels, tickets and more from the Itinerary tab.
        </Text>
      </Screen>
    );
  }

  const groups = reservationCategoryKeys
    .map((key) => ({
      category: bookingCategories[key],
      bookings: bookings
        .filter((b) => b.categoryKey === key)
        .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? '')),
    }))
    .filter((group) => group.bookings.length > 0);

  if (groups.length === 0) {
    return (
      <Screen>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Nothing booked yet — add flights, hotels, tickets and more from the Itinerary tab.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {groups.map(({ category, bookings: categoryBookings }) => (
        <View key={category.key} style={{ gap: theme.space.sm }}>
          <Text style={[theme.type.headline, { fontSize: 22, color: theme.colors.text }]}>
            {category.label} ({categoryBookings.length})
          </Text>
          {categoryBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              tripId={id}
              defaultCurrency={trip.defaultCurrency}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
