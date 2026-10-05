import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getCategory } from '@/features/bookings/categories';
import { asTransportDetails, isTransportCategory } from '@/features/bookings/details';
import { useSetSeen } from '@/features/places/hooks';
import { PlaceBadge } from '@/features/places/PlaceBadge';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { BookingForm } from './BookingForm';
import { BOOKING_STATUS_OPTIONS, type Booking } from './types';

const STATUS_LABEL = Object.fromEntries(BOOKING_STATUS_OPTIONS.map((o) => [o.key, o.label]));

function timeOf(iso: string | null): string | null {
  return iso ? iso.slice(11, 16) : null;
}

export function BookingCard({
  booking,
  tripId,
  defaultCurrency,
  placeNumber,
}: {
  booking: Booking;
  tripId: string;
  defaultCurrency: string;
  /** Its number among the trip's booked places (as on the map), if it is one. */
  placeNumber?: number;
}) {
  const theme = useTheme();
  const setSeen = useSetSeen(tripId);
  const seen = booking.visitedAt !== null;
  const [editing, setEditing] = useState(false);
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  const category = getCategory(booking.categoryKey);
  const transport = isTransportCategory(booking.categoryKey)
    ? asTransportDetails(booking.details)
    : null;
  const depTime = timeOf(booking.startAt);
  const arrTime = timeOf(booking.endAt);
  const overnight =
    !!booking.startAt &&
    !!booking.endAt &&
    booking.startAt.slice(0, 10) !== booking.endAt.slice(0, 10);
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
        gap: theme.space.md,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.75 : hovered ? 0.92 : 1,
      })}
    >
      <View
        style={{ width: 7, borderRadius: 4, alignSelf: 'stretch', backgroundColor: category.color }}
      />
      <Ionicons name={category.icon} size={24} color={category.color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text
            style={[theme.type.title, { fontSize: 18, color: theme.colors.text, flexShrink: 1 }]}
          >
            {booking.title}
          </Text>
          {booking.price != null ? (
            <Text style={[theme.type.title, { fontSize: 16, color: theme.colors.textMuted }]}>
              {booking.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
              {booking.currency ?? defaultCurrency}
            </Text>
          ) : null}
        </View>

        <Text style={[theme.type.caption, { fontSize: 13, color: theme.colors.accent }]}>
          {STATUS_LABEL[booking.status]}
          {placeNumber !== undefined && seen ? ' · Seen' : ''}
        </Text>

        {transport ? (
          <>
            {transport.carrierNumber ? (
              <Text style={[theme.type.body, { fontSize: 14, color: theme.colors.textMuted }]}>
                {transport.carrierNumber}
              </Text>
            ) : null}
            <Text style={[theme.type.body, { fontSize: 14, color: theme.colors.textMuted }]}>
              {depTime ?? '—'} {transport.departureLocation ?? ''}
              {transport.departureTerminal ? ` (T${transport.departureTerminal})` : ''}
              {'  →  '}
              {arrTime ?? '—'}
              {overnight ? ' (+1 day)' : ''} {transport.arrivalLocation ?? ''}
              {transport.arrivalTerminal ? ` (T${transport.arrivalTerminal})` : ''}
            </Text>
          </>
        ) : (
          <>
            {depTime || arrTime ? (
              <Text style={[theme.type.body, { fontSize: 14, color: theme.colors.textMuted }]}>
                {booking.categoryKey === 'accommodation'
                  ? `${booking.startAt?.slice(0, 10) ?? ''} → ${booking.endAt?.slice(0, 10) ?? ''}`
                  : depTime}
              </Text>
            ) : null}
            {booking.locationName ? (
              <Text style={[theme.type.body, { fontSize: 14, color: theme.colors.textMuted }]}>
                {booking.locationName}
              </Text>
            ) : null}
            {booking.address ? (
              <Text style={[theme.type.body, { fontSize: 14, color: theme.colors.textMuted }]}>
                {booking.address}
              </Text>
            ) : null}
          </>
        )}

        {booking.notes ? (
          <Text
            style={[
              theme.type.body,
              { fontSize: 14, color: theme.colors.textMuted, fontStyle: 'italic' },
            ]}
          >
            {booking.notes}
          </Text>
        ) : null}
      </View>
      {placeNumber !== undefined ? (
        <PlaceBadge
          number={placeNumber}
          seen={seen}
          title={booking.title}
          onToggle={() => setSeen.mutate({ bookingId: booking.id, seen: !seen })}
          size={32}
        />
      ) : null}
    </Pressable>
  );
}
