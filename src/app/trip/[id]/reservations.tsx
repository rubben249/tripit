import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { bookingCategories, categoryKeys } from '@/features/bookings/categories';
import { BookingRow } from '@/features/itinerary/BookingRow';
import { useBookings } from '@/features/itinerary/hooks';
import { useTheme } from '@/theme/ThemeProvider';

/** All bookings at a glance, grouped by category instead of by day — flights, hotels, tickets etc. */
export default function ReservationsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bookings } = useBookings(id);

  if (!bookings || bookings.length === 0) {
    return (
      <Screen>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Nothing booked yet — add flights, hotels, tickets and more from the Itinerary tab.
        </Text>
      </Screen>
    );
  }

  const groups = categoryKeys
    .map((key) => ({
      category: bookingCategories[key],
      bookings: bookings
        .filter((b) => b.categoryKey === key)
        .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? '')),
    }))
    .filter((group) => group.bookings.length > 0);

  return (
    <Screen scroll>
      {groups.map(({ category, bookings: categoryBookings }) => (
        <View key={category.key} style={{ gap: theme.space.xs }}>
          <Text style={[theme.type.title, { color: theme.colors.text }]}>
            {category.label} ({categoryBookings.length})
          </Text>
          {categoryBookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </View>
      ))}
    </Screen>
  );
}
