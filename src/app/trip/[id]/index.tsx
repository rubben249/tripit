import { useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { formatDateRange, tripDurationNights } from '@/lib/dates';
import { useAddCity, useBookings, useCities } from '@/features/itinerary/hooks';
import { useTrashTrip, useTrip } from '@/features/trips/hooks';
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
  const [newCity, setNewCity] = useState('');
  const [arrivalDate, setArrivalDate] = useState<string | null>(null);
  const [departureDate, setDepartureDate] = useState<string | null>(null);

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

  const onDeleteTrip = async () => {
    await trashTrip.mutateAsync(id);
    router.replace('/');
  };

  return (
    <Screen scroll>
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
            <Pressable
              onPress={onAddCity}
              style={{
                justifyContent: 'center',
                paddingHorizontal: theme.space.md,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.ink,
              }}
            >
              <Text style={[theme.type.data, { color: theme.colors.onInk }]}>Add</Text>
            </Pressable>
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

      <Pressable onPress={onDeleteTrip} style={{ paddingVertical: theme.space.md }}>
        <Text style={[theme.type.caption, { color: theme.colors.warn }]}>Delete trip</Text>
      </Pressable>
    </Screen>
  );
}
