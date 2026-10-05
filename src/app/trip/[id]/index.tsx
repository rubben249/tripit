import { useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { formatDateRange, tripDurationNights } from '@/lib/dates';
import { useAddCity, useBookings, useCities } from '@/features/itinerary/hooks';
import { useTrashTrip, useTrip, useUpdateTrip } from '@/features/trips/hooks';
import { TripCountdown } from '@/features/trips/TripCountdown';
import { useTheme } from '@/theme/ThemeProvider';

export default function TripOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: cities } = useCities(id);
  const { data: bookings } = useBookings(id);
  const addCity = useAddCity(id);
  const trashTrip = useTrashTrip();
  const updateTrip = useUpdateTrip(id);
  const { confirm, dialog } = useConfirm();
  const [newCity, setNewCity] = useState('');
  const [arrivalDate, setArrivalDate] = useState<string | null>(null);
  const [departureDate, setDepartureDate] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (!trip) return null;

  const onAddCity = async () => {
    const name = newCity.trim();
    if (!name) return;
    Keyboard.dismiss();
    setNewCity('');
    const arrival = arrivalDate;
    const departure = departureDate;
    setArrivalDate(null);
    setDepartureDate(null);
    await addCity.mutateAsync({
      name,
      arrivalDate: arrival ?? undefined,
      departureDate: departure ?? undefined,
    });
  };

  const onStartRename = () => {
    setDraftName(trip.name);
    setEditingName(true);
  };

  const onSaveRename = async () => {
    const name = draftName.trim();
    Keyboard.dismiss();
    if (name && name !== trip.name) {
      await updateTrip.mutateAsync({ name });
    }
    setEditingName(false);
  };

  const onDeleteTrip = async () => {
    const confirmed = await confirm({
      title: 'Delete this trip?',
      message: `"${trip.name}" moves to Trash and can be restored within 30 days.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    await trashTrip.mutateAsync(id);
    router.replace('/');
  };

  return (
    <Screen scroll>
      {editingName ? (
        <View style={{ flexDirection: 'row', gap: theme.space.sm, alignItems: 'center' }}>
          <TextField
            value={draftName}
            onChangeText={setDraftName}
            onSubmitEditing={onSaveRename}
            autoFocus
            style={{ flex: 1 }}
            name="trip-rename"
          />
          <Button variant="primary" size="sm" onPress={onSaveRename}>
            Save
          </Button>
          <Button variant="secondary" size="sm" onPress={() => setEditingName(false)}>
            Cancel
          </Button>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.space.sm,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Text style={[theme.type.headline, { color: theme.colors.text, flexShrink: 1 }]}>
            {trip.name}
          </Text>
          <Button variant="secondary" size="sm" onPress={onStartRename}>
            Rename
          </Button>
        </View>
      )}

      <View style={{ gap: theme.space.xs }}>
        {trip.startDate && trip.endDate ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            {formatDateRange(trip.startDate, trip.endDate)} ·{' '}
            {tripDurationNights(trip.startDate, trip.endDate)} nights
          </Text>
        ) : (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            Draft — add dates to start planning the itinerary.
          </Text>
        )}
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {cities?.length ?? 0} cities · {bookings?.length ?? 0} bookings · {trip.defaultCurrency}
        </Text>
        <TripCountdown trip={trip} color={theme.colors.accent} size="md" />
      </View>

      <View style={{ gap: theme.space.sm }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Cities</Text>
        {(cities ?? []).map((city) => (
          <View
            key={city.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: theme.space.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text style={[theme.type.body, { color: theme.colors.text }]}>{city.name}</Text>
            {city.arrivalDate && city.departureDate ? (
              <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
                {formatDateRange(city.arrivalDate, city.departureDate)}
              </Text>
            ) : null}
          </View>
        ))}

        <View style={{ gap: theme.space.sm }}>
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <TextField
              value={newCity}
              onChangeText={setNewCity}
              placeholder="Add a city…"
              style={{ flex: 1 }}
              name="new-city-name"
            />
            <Button variant="primary" onPress={onAddCity}>
              Add
            </Button>
          </View>
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <View style={{ flex: 1 }}>
              <DateField
                label="Arrival date"
                value={arrivalDate}
                onChange={(date) => {
                  setArrivalDate(date);
                  if (date && departureDate && date > departureDate) setDepartureDate(date);
                }}
                placeholder="Arrival"
                name="new-city-arrival"
              />
            </View>
            <View style={{ flex: 1 }}>
              <DateField
                label="Departure date"
                value={departureDate}
                onChange={setDepartureDate}
                placeholder="Departure"
                minDate={arrivalDate}
                name="new-city-departure"
              />
            </View>
          </View>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            Add arrival and departure dates to generate that city&apos;s day-by-day itinerary.
          </Text>
        </View>
      </View>

      <Button variant="danger" onPress={onDeleteTrip} style={{ marginTop: theme.space.md }}>
        Delete trip
      </Button>

      {dialog}
    </Screen>
  );
}
