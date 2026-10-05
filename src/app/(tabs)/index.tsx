import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { getEffectiveStatus } from '@/features/trips/status';
import { TripCard } from '@/features/trips/TripCard';
import { useTrips } from '@/features/trips/hooks';
import type { Trip, TripStatus } from '@/features/trips/types';
import { useTheme } from '@/theme/ThemeProvider';

const GROUPS: { key: TripStatus; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'draft', label: 'Drafts' },
  { key: 'past', label: 'Past' },
  { key: 'archived', label: 'Archived' },
];

export default function TripsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: trips, isLoading } = useTrips();
  const [activeGroup, setActiveGroup] = useState<TripStatus>('ongoing');

  const grouped = useMemo(() => {
    const map = new Map<TripStatus, Trip[]>();
    for (const trip of trips ?? []) {
      const status = getEffectiveStatus(trip);
      const list = map.get(status) ?? [];
      list.push(trip);
      map.set(status, list);
    }
    return map;
  }, [trips]);

  const nonEmptyGroups = GROUPS.filter((g) => (grouped.get(g.key)?.length ?? 0) > 0);
  const visibleGroup = nonEmptyGroups.some((g) => g.key === activeGroup)
    ? activeGroup
    : (nonEmptyGroups[0]?.key ?? 'ongoing');
  const visibleTrips = grouped.get(visibleGroup) ?? [];

  if (isLoading) {
    return (
      <Screen>
        <ScreenTitle>My trips</ScreenTitle>
        <ActivityIndicator color={theme.colors.accent} />
      </Screen>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <Screen>
        <ScreenTitle>My trips</ScreenTitle>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          No trips yet — create your first one to start planning.
        </Text>
        <Pressable
          onPress={() => router.push('/trip/new')}
          style={{
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            padding: theme.space.lg,
            alignItems: 'center',
          }}
        >
          <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>+ New trip</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenTitle>My trips</ScreenTitle>

      <View style={{ flexDirection: 'row', gap: theme.space.xs, flexWrap: 'wrap' }}>
        {nonEmptyGroups.map((g) => {
          const active = g.key === visibleGroup;
          return (
            <Pressable
              key={g.key}
              onPress={() => setActiveGroup(g.key)}
              style={{
                paddingHorizontal: theme.space.sm,
                paddingVertical: 6,
                borderRadius: theme.radius.pill,
                backgroundColor: active ? theme.colors.ink : 'transparent',
                borderWidth: 1,
                borderColor: active ? theme.colors.ink : theme.colors.border,
              }}
            >
              <Text
                style={[
                  theme.type.caption,
                  { color: active ? theme.colors.onInk : theme.colors.textMuted },
                ]}
              >
                {g.label} ({grouped.get(g.key)?.length ?? 0})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: theme.space.sm }}>
        {visibleTrips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} />
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/trip/new')}
        style={{
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.space.md,
          alignItems: 'center',
        }}
      >
        <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>+ New trip</Text>
      </Pressable>
    </Screen>
  );
}
