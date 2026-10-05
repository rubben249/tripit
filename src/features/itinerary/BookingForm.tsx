import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { DateField } from '@/components/DateField';
import { TextField } from '@/components/TextField';
import {
  bookingCategories,
  categoryKeys,
  type BookingCategory,
  type CategoryKey,
} from '@/features/bookings/categories';
import {
  asTransportDetails,
  CARRIER_LABEL,
  isTransportCategory,
} from '@/features/bookings/details';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { useCreateBooking, useDeleteBooking, useUpdateBooking } from './hooks';
import { BOOKING_STATUS_OPTIONS, type Booking, type BookingStatus } from './types';

const FORM_CATEGORY_KEYS = categoryKeys.filter((k) => k !== 'note');

function timeOf(iso: string | null | undefined): string {
  return iso ? iso.slice(11, 16) : '';
}

export function BookingForm({
  tripId,
  dayId,
  cityId,
  date,
  defaultCurrency,
  booking,
  onDone,
}: {
  tripId: string;
  dayId: string | null;
  cityId: string | null;
  date: string;
  defaultCurrency: string;
  booking?: Booking;
  onDone: () => void;
}) {
  const theme = useTheme();
  const createBooking = useCreateBooking(tripId);
  const updateBooking = useUpdateBooking(tripId);
  const deleteBooking = useDeleteBooking(tripId);
  const { confirm, dialog } = useConfirm();

  const isEditing = !!booking;
  const [categoryKey, setCategoryKey] = useState<CategoryKey>(
    booking?.categoryKey ?? 'sightseeing',
  );
  const [status, setStatus] = useState<BookingStatus>(booking?.status ?? 'idea');
  const [title, setTitle] = useState(booking?.title ?? '');
  const [time, setTime] = useState(timeOf(booking?.startAt));
  const [arrivalTime, setArrivalTime] = useState(timeOf(booking?.endAt));
  const [arrivalDate, setArrivalDate] = useState<string | null>(
    booking?.endAt?.slice(0, 10) ?? date,
  );
  const [checkIn, setCheckIn] = useState<string | null>(booking?.startAt?.slice(0, 10) ?? date);
  const [checkOut, setCheckOut] = useState<string | null>(booking?.endAt?.slice(0, 10) ?? null);
  const [locationName, setLocationName] = useState(booking?.locationName ?? '');
  const [address, setAddress] = useState(booking?.address ?? '');
  const initialTransport = asTransportDetails(booking?.details ?? null);
  const [carrierNumber, setCarrierNumber] = useState(initialTransport.carrierNumber ?? '');
  const [departureLocation, setDepartureLocation] = useState(
    initialTransport.departureLocation ?? '',
  );
  const [departureTerminal, setDepartureTerminal] = useState(
    initialTransport.departureTerminal ?? '',
  );
  const [arrivalLocation, setArrivalLocation] = useState(initialTransport.arrivalLocation ?? '');
  const [arrivalTerminal, setArrivalTerminal] = useState(initialTransport.arrivalTerminal ?? '');
  const [price, setPrice] = useState(booking?.price != null ? String(booking.price) : '');
  const [currency, setCurrency] = useState(booking?.currency ?? defaultCurrency);
  const [notes, setNotes] = useState(booking?.notes ?? '');

  const isTransport = isTransportCategory(categoryKey);
  const isAccommodation = categoryKey === 'accommodation';

  const onSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    Keyboard.dismiss();

    const parsedPrice = Number(price.replace(',', '.'));
    const details = isTransport
      ? {
          carrierNumber: carrierNumber.trim() || undefined,
          departureLocation: departureLocation.trim() || undefined,
          departureTerminal: departureTerminal.trim() || undefined,
          arrivalLocation: arrivalLocation.trim() || undefined,
          arrivalTerminal: arrivalTerminal.trim() || undefined,
        }
      : undefined;

    const startAt = isAccommodation
      ? (checkIn ?? undefined)
      : time.trim()
        ? `${date}T${time.trim()}:00`
        : undefined;
    const endAt = isAccommodation
      ? (checkOut ?? undefined)
      : isTransport && arrivalTime.trim()
        ? `${arrivalDate ?? date}T${arrivalTime.trim()}:00`
        : undefined;

    const common = {
      categoryKey,
      status,
      title: trimmed,
      startAt,
      endAt,
      locationName: locationName.trim() || undefined,
      address: address.trim() || undefined,
      details,
      price: price.trim() && Number.isFinite(parsedPrice) ? parsedPrice : undefined,
      currency: price.trim() ? currency.toUpperCase() || defaultCurrency : undefined,
      notes: notes.trim() || undefined,
    };

    if (isEditing) {
      await updateBooking.mutateAsync({ id: booking.id, update: common });
    } else {
      await createBooking.mutateAsync({ ...common, dayId, cityId });
    }
    onDone();
  };

  const onDelete = async () => {
    if (!booking) return;
    const confirmed = await confirm({
      title: 'Delete this booking?',
      message: `"${booking.title}" will be removed from both Itinerary and Reservations.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    await deleteBooking.mutateAsync(booking.id);
    onDone();
  };

  const isSaving = createBooking.isPending || updateBooking.isPending;

  return (
    <View
      style={{
        gap: theme.space.md,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
          {FORM_CATEGORY_KEYS.map((key) => (
            <CategoryChip
              key={key}
              category={bookingCategories[key]}
              active={key === categoryKey}
              onPress={() => setCategoryKey(key)}
            />
          ))}
        </View>
      </ScrollView>

      <TextField
        value={title}
        onChangeText={setTitle}
        placeholder="What is it?"
        name="booking-title"
      />

      <View style={{ flexDirection: 'row', gap: theme.space.xs, flexWrap: 'wrap' }}>
        {BOOKING_STATUS_OPTIONS.map((option) => (
          <StatusChip
            key={option.key}
            label={option.label}
            active={option.key === status}
            onPress={() => setStatus(option.key)}
          />
        ))}
      </View>

      {isTransport ? (
        <>
          <TextField
            value={carrierNumber}
            onChangeText={setCarrierNumber}
            placeholder={CARRIER_LABEL[categoryKey] ?? 'Carrier'}
            name="booking-carrier"
          />
          <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
            <TextField
              value={departureLocation}
              onChangeText={setDepartureLocation}
              placeholder="Departure airport / station / port"
              style={{ flex: 1 }}
              name="booking-dep-location"
            />
            <TextField
              value={departureTerminal}
              onChangeText={setDepartureTerminal}
              placeholder="Terminal"
              style={{ width: 90 }}
              name="booking-dep-terminal"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
            <TextField
              value={time}
              onChangeText={setTime}
              placeholder="Departure time 09:00"
              style={{ flex: 1 }}
              name="booking-dep-time"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
            <TextField
              value={arrivalLocation}
              onChangeText={setArrivalLocation}
              placeholder="Arrival airport / station / port"
              style={{ flex: 1 }}
              name="booking-arr-location"
            />
            <TextField
              value={arrivalTerminal}
              onChangeText={setArrivalTerminal}
              placeholder="Terminal"
              style={{ width: 90 }}
              name="booking-arr-terminal"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
            <View style={{ flex: 1 }}>
              <DateField
                label="Arrival date"
                value={arrivalDate}
                onChange={setArrivalDate}
                minDate={time.trim() ? date : undefined}
                name="booking-arr-date"
              />
            </View>
            <TextField
              value={arrivalTime}
              onChangeText={setArrivalTime}
              placeholder="Arrival time 11:30"
              style={{ width: 120 }}
              name="booking-arr-time"
            />
          </View>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            Arrival date defaults to the departure day — change it for overnight journeys.
          </Text>
        </>
      ) : isAccommodation ? (
        <>
          <TextField
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Hotel / place name"
            name="booking-location-name"
          />
          <TextField
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            name="booking-address"
          />
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <View style={{ flex: 1 }}>
              <DateField
                label="Check-in"
                value={checkIn}
                onChange={setCheckIn}
                name="booking-checkin"
              />
            </View>
            <View style={{ flex: 1 }}>
              <DateField
                label="Check-out"
                value={checkOut}
                onChange={setCheckOut}
                minDate={checkIn}
                name="booking-checkout"
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
            <TextField
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Place (optional)"
              style={{ flex: 1 }}
              name="booking-location-name"
            />
            <TextField
              value={time}
              onChangeText={setTime}
              placeholder="09:00"
              style={{ width: 80 }}
              name="booking-time"
            />
          </View>
          <TextField
            value={address}
            onChangeText={setAddress}
            placeholder="Address (optional)"
            name="booking-address"
          />
        </>
      )}

      <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
        <TextField
          value={price}
          onChangeText={setPrice}
          placeholder="Price (optional)"
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          name="booking-price"
        />
        <TextField
          value={currency}
          onChangeText={(v) => setCurrency(v.toUpperCase())}
          autoCapitalize="characters"
          maxLength={3}
          style={{ width: 72 }}
          name="booking-currency"
        />
      </View>

      <TextField
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        multiline
        name="booking-notes"
      />

      <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onPress={onSave}
          disabled={!title.trim() || isSaving}
        >
          {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add to this day'}
        </Button>
        {isEditing ? (
          <Button variant="danger" size="sm" onPress={onDelete}>
            Delete
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" onPress={onDone}>
          Cancel
        </Button>
      </View>

      {dialog}
    </View>
  );
}

function StatusChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.xs,
        borderRadius: theme.radius.pill,
        backgroundColor: active ? theme.colors.steel : 'transparent',
        borderWidth: 1,
        borderColor: active ? theme.colors.steel : theme.colors.border,
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      <Text
        style={[
          theme.type.caption,
          { fontSize: 13, color: active ? theme.colors.onInk : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CategoryChip({
  category,
  active,
  onPress,
}: {
  category: BookingCategory;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.xs,
        borderRadius: theme.radius.pill,
        backgroundColor: active ? category.color : 'transparent',
        borderWidth: 1,
        borderColor: active ? category.color : theme.colors.border,
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      <Ionicons
        name={category.icon}
        size={16}
        color={active ? theme.colors.onInk : category.color}
      />
      <Text
        style={[
          theme.type.caption,
          { fontSize: 13, color: active ? theme.colors.onInk : theme.colors.textMuted },
        ]}
      >
        {category.label}
      </Text>
    </Pressable>
  );
}
