import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { getCategory } from '@/features/bookings/categories';
import { useTheme } from '@/theme/ThemeProvider';

import type { Booking } from './types';

export function BookingRow({ booking, onPress }: { booking: Booking; onPress?: () => void }) {
  const theme = useTheme();
  const category = getCategory(booking.categoryKey);
  const time = booking.startAt ? booking.startAt.slice(11, 16) : null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: theme.space.sm,
        alignItems: 'flex-start',
        paddingVertical: theme.space.sm,
      }}
    >
      <Text style={[theme.type.data, { color: theme.colors.textMuted, width: 42 }]}>
        {time ?? ''}
      </Text>
      <View
        style={{
          width: 7,
          borderRadius: 4,
          alignSelf: 'stretch',
          backgroundColor: category.color,
        }}
      />
      <Ionicons name={category.icon} size={16} color={category.color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[theme.type.title, { fontSize: 15, color: theme.colors.text }]}>
          {booking.title}
        </Text>
        {booking.locationName ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {booking.locationName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
