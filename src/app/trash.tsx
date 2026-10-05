import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { usePermanentlyDeleteTrip, useRestoreTrip, useTrashedTrips } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function TrashScreen() {
  const theme = useTheme();
  const { data: trips } = useTrashedTrips();
  const restoreTrip = useRestoreTrip();
  const permanentlyDeleteTrip = usePermanentlyDeleteTrip();

  return (
    <Screen scroll>
      <ScreenTitle>Trash</ScreenTitle>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        Deleted trips stay here for 30 days before being removed for good.
      </Text>

      {!trips || trips.length === 0 ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>Trash is empty.</Text>
      ) : (
        trips.map((trip) => (
          <View
            key={trip.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: theme.space.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text style={[theme.type.body, { color: theme.colors.text }]}>{trip.name}</Text>
            <View style={{ flexDirection: 'row', gap: theme.space.md }}>
              <Pressable onPress={() => restoreTrip.mutate(trip.id)}>
                <Text style={[theme.type.caption, { color: theme.colors.good }]}>Restore</Text>
              </Pressable>
              <Pressable onPress={() => permanentlyDeleteTrip.mutate(trip.id)}>
                <Text style={[theme.type.caption, { color: theme.colors.warn }]}>
                  Delete forever
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
