import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getCategory } from '@/features/bookings/categories';
import { asTransportDetails, isTransportCategory } from '@/features/bookings/details';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { BookingForm } from './BookingForm';
import type { Booking } from './types';

function timeOf(iso: string | null): string | null {
  return iso ? iso.slice(11, 16) : null;
}

export function BookingCard({
  booking,
  tripId,
  defaultCurrency,
}: {
  booking: Booking;
  tripId: string;
  defaultCurrency: string;
}) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  const category = getCategory(booking.categoryKey);
  const transport = isTransportCategory(booking.categoryKey)
    ? asTransportDetails(booking.details)
    : null;
  const depTime = timeOf(booking.startAt);
  const arrTime = timeOf(booking.endAt);
  const dayFallback = booking.startAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  if (editing) {
    return (
      <BookingForm
        tripId={tripId}
        dayId={booking.dayId}
        cityId={booking.cityId}
        date={dayFallback}
        defaultCurrency={defaultCurrency}
        booking={booking}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <Pressable
      onPress={() => setEditing(true)}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: theme.space.sm,
        padding: theme.space.sm,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.75 : hovered ? 0.92 : 1,
      })}
    >
      <View
        style={{ width: 6, borderRadius: 3, alignSelf: 'stretch', backgroundColor: category.color }}
      />
      <Ionicons name={category.icon} size={18} color={category.color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text
            style={[theme.type.title, { fontSize: 15, color: theme.colors.text, flexShrink: 1 }]}
          >
            {booking.title}
          </Text>
          {booking.price != null ? (
            <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
              {booking.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
              {booking.currency ?? defaultCurrency}
            </Text>
          ) : null}
        </View>

        {transport ? (
          <>
            {transport.carrierNumber ? (
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {transport.carrierNumber}
              </Text>
            ) : null}
            <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
              {depTime ?? '—'} {transport.departureLocation ?? ''}
              {transport.departureTerminal ? ` (T${transport.departureTerminal})` : ''}
              {'  →  '}
              {arrTime ?? '—'} {transport.arrivalLocation ?? ''}
              {transport.arrivalTerminal ? ` (T${transport.arrivalTerminal})` : ''}
            </Text>
          </>
        ) : (
          <>
            {depTime || arrTime ? (
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {booking.categoryKey === 'accommodation'
                  ? `${booking.startAt?.slice(0, 10) ?? ''} → ${booking.endAt?.slice(0, 10) ?? ''}`
                  : depTime}
              </Text>
            ) : null}
            {booking.locationName ? (
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {booking.locationName}
              </Text>
            ) : null}
            {booking.address ? (
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {booking.address}
              </Text>
            ) : null}
          </>
        )}

        {booking.notes ? (
          <Text
            style={[theme.type.caption, { color: theme.colors.textMuted, fontStyle: 'italic' }]}
          >
            {booking.notes}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
