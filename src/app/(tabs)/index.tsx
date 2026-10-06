import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ErrorNotice } from '@/components/ErrorNotice';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { TripCardSkeleton } from '@/components/Skeleton';
import { recoverFromDatabaseError } from '@/lib/db/recover';
import { stagger } from '@/lib/motion';
import { useHoverable } from '@/lib/useHoverable';
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
  const { data: trips, isLoading, isError, error, refetch, isRefetching } = useTrips();
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
        <View style={{ gap: theme.space.sm }}>
          <TripCardSkeleton />
          <TripCardSkeleton />
        </View>
      </Screen>
    );
  }

  // Without this the next branch would greet a database it could not open with
  // "No trips yet", which reads as "your trips are gone".
  if (isError) {
    return (
      <Screen>
        <ScreenTitle>My trips</ScreenTitle>
        <ErrorNotice
          error={error}
          retrying={isRefetching}
          onRetry={() => recoverFromDatabaseError(refetch)}
        />
      </Screen>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <Screen>
        <ScreenTitle subtitle="Everything stays on this device. Start one, or take a copy of someone else's.">
          My trips
        </ScreenTitle>
        <View style={{ gap: theme.space.sm }}>
          <Button
            variant="primary"
            icon="airplane-outline"
            fullWidth
            onPress={() => router.push('/trip/new')}
          >
            Plan a new trip
          </Button>
          <Button
            variant="secondary"
            icon="qr-code-outline"
            fullWidth
            onPress={() => router.push('/receive')}
          >
            Receive a shared trip
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenTitle>My trips</ScreenTitle>

      <View
        style={{
          flexDirection: 'row',
          gap: theme.space.xs,
          flexWrap: 'wrap',
          marginTop: -theme.space.sm,
        }}
      >
        {nonEmptyGroups.map((g) => (
          <FilterPill
            key={g.key}
            label={g.label}
            count={grouped.get(g.key)?.length ?? 0}
            active={g.key === visibleGroup}
            onPress={() => setActiveGroup(g.key)}
          />
        ))}
      </View>

      <View style={{ gap: theme.space.sm }}>
        {visibleTrips.map((trip, i) => (
          <Animated.View key={trip.id} entering={FadeInDown.duration(260).delay(stagger(i))}>
            <TripCard trip={trip} onPress={() => router.push(`/trip/${trip.id}`)} />
          </Animated.View>
        ))}
      </View>

      <View style={{ gap: theme.space.sm }}>
        <Button variant="dashed" icon="add" fullWidth onPress={() => router.push('/trip/new')}>
          New trip
        </Button>
        <Button
          variant="ghost"
          icon="qr-code-outline"
          fullWidth
          onPress={() => router.push('/receive')}
        >
          Receive a shared trip
        </Button>
      </View>
    </Screen>
  );
}

function FilterPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.xs,
        minHeight: 34,
        paddingHorizontal: theme.space.md,
        borderRadius: theme.radius.pill,
        backgroundColor: active
          ? theme.colors.solid
          : hovered
            ? theme.colors.surfaceAlt
            : 'transparent',
        borderWidth: 1,
        borderColor: active ? theme.colors.solid : theme.colors.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text
        style={[
          theme.type.caption,
          { fontSize: 13, color: active ? theme.colors.onSolid : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[theme.type.label, { color: active ? theme.colors.mist : theme.colors.textFaint }]}
      >
        {count}
      </Text>
    </Pressable>
  );
}
