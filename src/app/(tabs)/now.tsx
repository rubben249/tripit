import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { getFocusTrips, getNextTrip } from '@/features/now/focusTrips';
import { TripNowCard } from '@/features/now/TripNowCard';
import { NotesFeed } from '@/features/notes/NotesFeed';
import { TripCountdown } from '@/features/trips/TripCountdown';
import { useTrips } from '@/features/trips/hooks';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';

export default function NowScreen() {
  const theme = useTheme();
  const now = useNow();
  const { data: trips } = useTrips();
  if (!trips) return null;

  const focusTrips = getFocusTrips(trips, now);
  const nextTrip = focusTrips.length === 0 ? getNextTrip(trips, now) : null;

  return (
    <Screen scroll>
      <ScreenTitle>Now</ScreenTitle>

      {focusTrips.map((trip) => (
        <TripNowCard key={trip.id} trip={trip} now={now} />
      ))}

      {focusTrips.length === 0 ? (
        <View style={{ gap: theme.space.sm }}>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            No trip in progress or starting this week.
          </Text>
          {nextTrip ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
              <Text style={[theme.type.body, { color: theme.colors.text }]}>
                Next: {nextTrip.name}
              </Text>
              <TripCountdown trip={nextTrip} />
            </View>
          ) : null}
          {nextTrip ? (
            <Link href={`/trip/${nextTrip.id}`} asChild>
              <Button size="sm" style={{ alignSelf: 'flex-start' }}>
                Open trip ›
              </Button>
            </Link>
          ) : null}
        </View>
      ) : null}

      <NotesFeed focusTrips={focusTrips} />
    </Screen>
  );
}
