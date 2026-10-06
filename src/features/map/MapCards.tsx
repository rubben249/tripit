import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState, type ReactNode } from 'react';
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
import { routeColorKey, type Route } from './routes';

/**
 * The panel that floats over the map. Its body folds away to a single line, because
 * at street zoom the list was covering the very points it describes and there was no
 * way to get it out of the way short of closing it and losing the selection.
 */
function CardShell({
  header,
  children,
  onClose,
}: {
  header: ReactNode;
  children?: ReactNode;
  onClose: () => void;
}) {
  const theme = useTheme();
  const floating = useFloatingStyle();
  const [collapsed, setCollapsed] = useState(false);
  const foldable = !!children;

  return (
    <View style={[floating, { padding: theme.space.md, gap: theme.space.sm, maxWidth: 440 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.sm }}>
        <View style={{ flex: 1, gap: 2 }}>{header}</View>
        {foldable ? (
          <Pressable
            onPress={() => setCollapsed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={collapsed ? 'Expand' : 'Collapse'}
            accessibilityState={{ expanded: !collapsed }}
            hitSlop={8}
          >
            <Ionicons
              name={collapsed ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={theme.colors.textMuted} />
        </Pressable>
      </View>
      {foldable && !collapsed ? <>{children}</> : null}
    </View>
  );
}

function seenSummary(places: Place[]): string {
  const seen = places.filter((p) => p.seen).length;
  if (places.length === 0) return 'No places on the map yet';
  return `${places.length} place${places.length === 1 ? '' : 's'} · ${seen} seen`;
}

/**
 * Numbered places in time order. The badge marks a place as seen; the row flies to it.
 *
 * With `dayLabels`, consecutive places of the same day sit under that day's heading, so
 * the whole trip reads day by day without having to filter it down to one.
 */
function PlaceList({
  places,
  dayLabels,
  onSelectPlace,
}: {
  places: Place[];
  dayLabels?: Map<string, string>;
  onSelectPlace: (bookingId: string) => void;
}) {
  const theme = useTheme();
  if (places.length === 0) return null;

  // Grouped up front rather than while mapping: the heading depends on the row
  // before it, and that bookkeeping does not belong inside a render callback.
  const rows: { place: Place; heading: string | null }[] = [];
  let previousDayId: string | null | undefined;
  for (const place of places) {
    const dayId = place.booking.dayId;
    const heading =
      dayLabels && dayId !== previousDayId ? (dayLabels.get(dayId ?? '') ?? null) : null;
    rows.push({ place, heading });
    previousDayId = dayId;
  }

  return (
    <ScrollView style={{ maxHeight: 230 }} contentContainerStyle={{ gap: 2 }}>
      {rows.map(({ place, heading }) => (
        <View key={place.booking.id}>
          {heading ? (
            <Text
              style={[
                theme.type.label,
                { color: theme.colors.accent, marginTop: theme.space.sm, marginBottom: 2 },
              ]}
            >
              {heading.toUpperCase()}
            </Text>
          ) : null}
          <PlaceRow place={place} onPress={onSelectPlace} />
        </View>
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

/** The legs drawn on the map, spelled out — so a dashed line reads as "flight" without a legend. */
function RouteList({ routes }: { routes: Route[] }) {
  const theme = useTheme();
  if (routes.length === 0) return null;
  return (
    <View style={{ gap: 2 }}>
      {routes.map((route) => {
        const color = theme.map.route[routeColorKey(route.mode) as keyof typeof theme.map.route];
        return (
          <View
            key={route.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}
          >
            <Ionicons
              name={route.mode ? getCategory(route.mode).icon : 'help-circle-outline'}
              size={15}
              color={color}
            />
            <Text
              numberOfLines={1}
              style={[theme.type.caption, { flex: 1, color: theme.colors.textMuted }]}
            >
              {route.fromName} → {route.toName} · {route.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function TripCard({
  trip,
  places,
  routes,
  dayLabel,
  dayLabels,
  onSelectPlace,
  onClose,
}: {
  trip: Trip;
  places: Place[];
  routes: Route[];
  /** Set while the day filter is on, e.g. "Day 3 · Sat 30 Aug". */
  dayLabel: string | null;
  /** Day id → heading, used to group the list when every day is shown at once. */
  dayLabels?: Map<string, string>;
  onSelectPlace: (bookingId: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <CardShell
      onClose={onClose}
      header={
        <>
          <TripNameLink tripId={trip.id} name={trip.name} large />
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {dayLabel
              ? `${dayLabel} · `
              : trip.startDate && trip.endDate
                ? `${formatDateRange(trip.startDate, trip.endDate)} · `
                : ''}
            {seenSummary(places)}
          </Text>
        </>
      }
    >
      <RouteList routes={routes} />
      <PlaceList
        places={places}
        dayLabels={dayLabel ? undefined : dayLabels}
        onSelectPlace={onSelectPlace}
      />
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
    <CardShell
      onClose={onClose}
      header={
        <Text style={[theme.type.section, { color: theme.colors.text }]}>
          {countryFlag(iso)} {countryName(iso)}
        </Text>
      }
    >
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
    <CardShell
      onClose={onClose}
      header={
        <>
          <Text style={[theme.type.section, { color: theme.colors.text }]}>
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
        </>
      }
    >
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
    <CardShell
      onClose={onClose}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
          <PlaceBadge
            number={place.number}
            seen={place.seen}
            title={place.booking.title}
            onToggle={toggle}
            size={38}
          />
          <View style={{ flex: 1, gap: 2 }}>
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
      }
    >
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
            <Button size="sm" variant="secondary" iconEnd="chevron-forward">
              Open day
            </Button>
          </Link>
        ) : null}
      </View>
    </CardShell>
  );
}
