import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { getCategory } from '@/features/bookings/categories';
import { formatPlaceWhen } from '@/features/places/format';
import { useSetSeen } from '@/features/places/hooks';
import { TripNameLink } from '@/features/trips/TripNameLink';
import { PlaceBadge } from '@/features/places/PlaceBadge';
import type { Place } from '@/features/places/places';
import type { Trip } from '@/features/trips/types';
import { countryFlag, countryName } from '@/lib/countries';
import { formatDateRange } from '@/lib/dates';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import type { MapCity } from './mapData';
import { useFloatingStyle } from './MapOverlays';

function CardShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const theme = useTheme();
  const floating = useFloatingStyle();
  return (
    <View style={[floating, { padding: theme.space.md, gap: theme.space.sm, maxWidth: 440 }]}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        hitSlop={8}
        style={{ position: 'absolute', top: theme.space.sm, right: theme.space.sm, zIndex: 1 }}
      >
        <Ionicons name="close" size={20} color={theme.colors.textMuted} />
      </Pressable>
      {children}
    </View>
  );
}

function seenSummary(places: Place[]): string {
  const seen = places.filter((p) => p.seen).length;
  if (places.length === 0) return 'No booked places yet';
  return `${places.length} booked place${places.length === 1 ? '' : 's'} · ${seen} seen`;
}

/** Numbered places in time order. The badge marks a place as seen; the row flies to it. */
function PlaceList({
  places,
  onSelectPlace,
}: {
  places: Place[];
  onSelectPlace: (bookingId: string) => void;
}) {
  const theme = useTheme();
  if (places.length === 0) return null;
  return (
    <ScrollView style={{ maxHeight: 230 }} contentContainerStyle={{ gap: 2 }}>
      {places.map((place) => (
        <PlaceRow key={place.booking.id} place={place} onPress={onSelectPlace} />
      ))}
      <View style={{ height: theme.space.xs }} />
    </ScrollView>
  );
}

function PlaceRow({ place, onPress }: { place: Place; onPress: (bookingId: string) => void }) {
  const theme = useTheme();
  const setSeen = useSetSeen(place.booking.tripId as string);
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
      <PlaceBadge
        number={place.number}
        seen={place.seen}
        title={place.booking.title}
        onToggle={() => setSeen.mutate({ bookingId: place.booking.id, seen: !place.seen })}
      />
      <Pressable
        onPress={() => onPress(place.booking.id)}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={({ pressed }) => ({
          flex: 1,
          paddingVertical: 6,
          paddingHorizontal: theme.space.xs,
          borderRadius: theme.radius.sm,
          backgroundColor: hovered || pressed ? theme.colors.surfaceAlt : 'transparent',
        })}
      >
        <Text
          numberOfLines={1}
          style={[
            theme.type.body,
            {
              fontSize: 15,
              color: place.seen ? theme.colors.textMuted : theme.colors.text,
            },
          ]}
        >
          {place.booking.title}
        </Text>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {formatPlaceWhen(place)}
        </Text>
      </Pressable>
    </View>
  );
}

export function TripCard({
  trip,
  places,
  onSelectPlace,
  onClose,
}: {
  trip: Trip;
  places: Place[];
  onSelectPlace: (bookingId: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <CardShell onClose={onClose}>
      <TripNameLink tripId={trip.id} name={trip.name} large />
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        {trip.startDate && trip.endDate
          ? `${formatDateRange(trip.startDate, trip.endDate)} · `
          : ''}
        {seenSummary(places)}
      </Text>
      <PlaceList places={places} onSelectPlace={onSelectPlace} />
    </CardShell>
  );
}

export function CountryCard({
  iso,
  trips,
  onSelectPlace,
  onClose,
}: {
  iso: string;
  trips: { trip: Trip; places: Place[] }[];
  onSelectPlace: (bookingId: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <CardShell onClose={onClose}>
      <Text style={[theme.type.title, { fontSize: 19, color: theme.colors.text }]}>
        {countryFlag(iso)} {countryName(iso)}
      </Text>
      <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: theme.space.sm }}>
        {trips.map(({ trip, places }) => (
          <View key={trip.id} style={{ gap: 2 }}>
            <TripNameLink tripId={trip.id} name={trip.name} />
            <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
              {seenSummary(places)}
            </Text>
            <PlaceList places={places} onSelectPlace={onSelectPlace} />
          </View>
        ))}
      </ScrollView>
    </CardShell>
  );
}

export function CityCard({
  city,
  places,
  onSelectPlace,
  onClose,
}: {
  city: MapCity;
  places: Place[];
  onSelectPlace: (bookingId: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <CardShell onClose={onClose}>
      <Text style={[theme.type.title, { fontSize: 19, color: theme.colors.text }]}>
        {city.countryCode ? `${countryFlag(city.countryCode)}  ` : ''}
        {city.name}
      </Text>
      <TripNameLink tripId={city.tripId} name={city.tripName} />
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        {city.arrivalDate && city.departureDate
          ? `${formatDateRange(city.arrivalDate, city.departureDate)} · `
          : ''}
        {seenSummary(places)}
      </Text>
      <PlaceList places={places} onSelectPlace={onSelectPlace} />
    </CardShell>
  );
}

export function PlaceCard({
  place,
  tripName,
  onClose,
}: {
  place: Place;
  tripName: string;
  onClose: () => void;
}) {
  const theme = useTheme();
  const tripId = place.booking.tripId as string;
  const setSeen = useSetSeen(tripId);
  const category = getCategory(place.booking.categoryKey);
  const where = [place.booking.locationName, place.booking.address].filter(Boolean).join(' · ');
  const toggle = () => setSeen.mutate({ bookingId: place.booking.id, seen: !place.seen });

  return (
    <CardShell onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
        <PlaceBadge
          number={place.number}
          seen={place.seen}
          title={place.booking.title}
          onToggle={toggle}
          size={38}
        />
        <View style={{ flex: 1, gap: 2, paddingRight: theme.space.lg }}>
          <Text style={[theme.type.title, { fontSize: 18, color: theme.colors.text }]}>
            {place.booking.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={category.icon} size={14} color={category.color} />
            <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
              {category.label} · {formatPlaceWhen(place)}
            </Text>
          </View>
        </View>
      </View>
      {where ? (
        <Text style={[theme.type.body, { fontSize: 15, color: theme.colors.text }]}>{where}</Text>
      ) : null}
      {place.approximate ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          Address not found on the map — shown at the city.
        </Text>
      ) : null}
      <TripNameLink tripId={tripId} name={tripName} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        <Button variant={place.seen ? 'secondary' : 'primary'} size="sm" onPress={toggle}>
          {place.seen ? '✓ Seen — undo' : 'Mark as seen'}
        </Button>
        {place.booking.dayId ? (
          <Link href={`/trip/${tripId}/day/${place.booking.dayId}`} asChild>
            <Button size="sm">Open day ›</Button>
          </Link>
        ) : null}
      </View>
    </CardShell>
  );
}
