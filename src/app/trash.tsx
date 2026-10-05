import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { usePermanentlyDeleteTrip, useRestoreTrip, useTrashedTrips } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function TrashScreen() {
  const theme = useTheme();
  const { data: trips } = useTrashedTrips();
  const restoreTrip = useRestoreTrip();
  const permanentlyDeleteTrip = usePermanentlyDeleteTrip();
  const { confirm, dialog } = useConfirm();

  const onDeleteForever = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete forever?',
      message: `"${name}" and everything in it will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete forever',
    });
    if (confirmed) permanentlyDeleteTrip.mutate(id);
  };

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
            <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
              {trip.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <Button variant="secondary" size="sm" onPress={() => restoreTrip.mutate(trip.id)}>
                Restore
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={() => onDeleteForever(trip.id, trip.name)}
              >
                Delete forever
              </Button>
            </View>
          </View>
        ))
      )}

      {dialog}
    </Screen>
  );
}
