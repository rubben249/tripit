import { useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { formatDateRange, tripDurationNights } from '@/lib/dates';
import { plural } from '@/lib/plural';
import { stagger } from '@/lib/motion';
import { isReservationCategory } from '@/features/bookings/categories';
import { useExportTripDocument } from '@/features/export/hooks';
import { CityPlaceField } from '@/features/itinerary/CityPlaceField';
import { useAddCity, useBookings, useCities } from '@/features/itinerary/hooks';
import { locateCity } from '@/features/map/geocodeCities';
import { countryFlag } from '@/lib/countries';
import type { Place } from '@/lib/geocoding';
import { tripDateBounds } from '@/features/trips/dateBounds';
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
  const reservationCount = (bookings ?? []).filter((b) =>
    isReservationCategory(b.categoryKey),
  ).length;
  const exportDoc = useExportTripDocument(id);
  const addCity = useAddCity(id);
  const trashTrip = useTrashTrip();
  const updateTrip = useUpdateTrip(id);
  const { confirm, dialog } = useConfirm();
  const [newCity, setNewCity] = useState('');
  const [newCityPlace, setNewCityPlace] = useState<Place | null>(null);
  const [arrivalDate, setArrivalDate] = useState<string | null>(null);
  const [departureDate, setDepartureDate] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (!trip) return null;

  const bounds = tripDateBounds(trip);

  const onAddCity = async () => {
    const name = newCity.trim();
    if (!name) return;
    Keyboard.dismiss();
    setNewCity('');
    const arrival = arrivalDate;
    const departure = departureDate;
    const chosen = newCityPlace;
    setNewCityPlace(null);
    setArrivalDate(null);
    setDepartureDate(null);
    // No suggestion picked: fall back to the top search result. Offline or no match → saved
    // without coordinates; the Map tab fills them in later.
    const place = chosen ?? (await locateCity(name));
    await addCity.mutateAsync({
      name,
      countryCode: place?.countryCode ?? undefined,
      lat: place?.lat,
      lng: place?.lng,
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
      <View style={{ gap: theme.space.sm }}>
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
            <Button variant="primary" size="sm" icon="checkmark" onPress={onSaveRename}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onPress={() => setEditingName(false)}>
              Cancel
            </Button>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              gap: theme.space.sm,
              alignItems: 'center',
            }}
          >
            <Text style={[theme.type.headline, { color: theme.colors.text, flex: 1 }]}>
              {trip.name}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              icon="create-outline"
              accessibilityLabel="Rename trip"
              onPress={onStartRename}
            >
              {''}
            </Button>
          </View>
        )}

        <View style={{ gap: theme.space.xxs }}>
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
          <Text style={[theme.type.data, { fontSize: 13, color: theme.colors.textFaint }]}>
            {plural(cities?.length ?? 0, 'city', 'cities')} · {plural(reservationCount, 'booking')}{' '}
            · {trip.defaultCurrency}
          </Text>
          <TripCountdown trip={trip} color={theme.colors.accent} size="md" />
        </View>
      </View>

      {/* Share and export are what people reach for once a trip is planned, so they
          sit together at the top as real actions instead of trailing the title. */}
      <View style={{ flexDirection: 'row', gap: theme.space.sm, flexWrap: 'wrap' }}>
        <Link href={`/share/${trip.id}`} asChild>
          <Button variant="primary" icon="qr-code-outline" style={{ flexGrow: 1 }}>
            Share trip
          </Button>
        </Link>
        {exportDoc.supported ? (
          <Button
            variant="secondary"
            icon="document-text-outline"
            loading={exportDoc.busy}
            style={{ flexGrow: 1 }}
            onPress={exportDoc.exportDocument}
          >
            {exportDoc.busy ? 'Writing…' : 'Word document'}
          </Button>
        ) : null}
      </View>
      {exportDoc.error ? (
        <Text style={[theme.type.caption, { color: theme.colors.warn }]}>{exportDoc.error}</Text>
      ) : null}

      <View style={{ gap: theme.space.md }}>
        <SectionTitle>Cities</SectionTitle>
        <View>
          {(cities ?? []).map((city, i) => (
            <Animated.View
              key={city.id}
              entering={FadeInDown.duration(220).delay(stagger(i))}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: theme.space.sm,
                paddingVertical: theme.space.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.borderSoft,
              }}
            >
              <Text style={[theme.type.title, { color: theme.colors.text, flexShrink: 1 }]}>
                {city.countryCode ? `${countryFlag(city.countryCode)}  ` : ''}
                {city.name}
              </Text>
              {city.arrivalDate && city.departureDate ? (
                <Text style={[theme.type.data, { fontSize: 13, color: theme.colors.textMuted }]}>
                  {formatDateRange(city.arrivalDate, city.departureDate)}
                </Text>
              ) : null}
            </Animated.View>
          ))}
        </View>

        <View
          style={{
            gap: theme.space.sm,
            padding: theme.space.md,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <CityPlaceField
              value={newCity}
              onChangeText={setNewCity}
              selected={newCityPlace}
              onSelect={setNewCityPlace}
            />
            <Button
              variant="primary"
              icon="add"
              loading={addCity.isPending}
              onPress={onAddCity}
              disabled={!newCity.trim()}
            >
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
                minDate={bounds.start}
                maxDate={bounds.end}
                rangeHint={bounds.hint}
                name="new-city-arrival"
              />
            </View>
            <View style={{ flex: 1 }}>
              <DateField
                label="Departure date"
                value={departureDate}
                onChange={setDepartureDate}
                placeholder="Departure"
                minDate={arrivalDate ?? bounds.start}
                maxDate={bounds.end}
                rangeHint={bounds.hint}
                name="new-city-departure"
              />
            </View>
          </View>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {bounds.hint
              ? `${bounds.hint}. Arrival and departure dates generate that city's day-by-day itinerary.`
              : "Add arrival and departure dates to generate that city's day-by-day itinerary."}
          </Text>
        </View>
      </View>

      {/* Deleting is kept away from everything else and labelled, so no one reaches
          it while scanning for the next planning action. */}
      <View
        style={{
          marginTop: theme.space.lg,
          paddingTop: theme.space.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderSoft,
          gap: theme.space.sm,
        }}
      >
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          Deleting moves the trip to Trash for 30 days.
        </Text>
        <Button variant="danger" icon="trash-outline" onPress={onDeleteTrip}>
          Delete trip
        </Button>
      </View>

      {dialog}
    </Screen>
  );
}
