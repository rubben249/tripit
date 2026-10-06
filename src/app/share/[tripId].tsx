import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CheckRow } from '@/components/CheckRow';
import { FieldLabel } from '@/components/SectionTitle';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { TextField } from '@/components/TextField';
import { useSettings, useUpdateSetting } from '@/features/settings/hooks';
import { createShare, type CreatedShare } from '@/features/share/api';
import { shareCryptoSupported } from '@/features/share/crypto';
import { ShareCode } from '@/features/share/ShareCode';
import { DEFAULT_SHARE_OPTIONS, type ShareOptions } from '@/features/transfer/shareFilter';
import { useTrip } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

const OPTION_ROWS: { key: keyof ShareOptions; label: string; hint?: string }[] = [
  { key: 'reservations', label: 'Reservations', hint: 'Flights, trains, hotels, tickets…' },
  {
    key: 'bookingNumbers',
    label: 'Booking numbers',
    hint: 'Flight and train numbers. Off by default — they identify your bookings.',
  },
  { key: 'prices', label: 'Prices' },
  { key: 'notes', label: 'Notes' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'photos', label: 'Photos', hint: 'Attached to the notes and tasks you share.' },
  { key: 'people', label: 'People' },
];

/** Options that only make sense alongside another one. */
const DEPENDS_ON: Partial<Record<keyof ShareOptions, (o: ShareOptions) => boolean>> = {
  bookingNumbers: (o) => o.reservations,
  prices: (o) => o.reservations,
  photos: (o) => o.notes || o.tasks,
};

export default function ShareTripScreen() {
  const theme = useTheme();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { data: trip } = useTrip(tripId);
  const settings = useSettings();
  const updateSetting = useUpdateSetting();
  const [options, setOptions] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);
  const [name, setName] = useState<string | null>(null);
  const [share, setShare] = useState<CreatedShare | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!trip) return null;
  const senderName = name ?? settings.displayName;
  const allOn = OPTION_ROWS.every((row) => options[row.key]);

  const onCreate = async () => {
    setError('');
    setBusy(true);
    try {
      if (senderName.trim() !== settings.displayName) {
        updateSetting.mutate({ key: 'displayName', value: senderName.trim() });
      }
      setShare(await createShare(trip.id, options, senderName.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a share code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Share trip', presentation: 'modal' }} />
      <ScreenTitle>{`Share “${trip.name}”`}</ScreenTitle>

      {!shareCryptoSupported() ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Sharing is available in the web app for now.
        </Text>
      ) : share ? (
        <View style={{ gap: theme.space.lg }}>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            On the other phone, scan this with the camera — or open TripIt, go to You → Receive a
            trip and type the code. They get their own copy: later changes on either side don&apos;t
            sync.
          </Text>
          <ShareCode code={share.code} expiresAt={share.expiresAt} onRenew={onCreate} />
          <Button
            variant="secondary"
            icon="options-outline"
            onPress={() => setShare(null)}
            style={{ alignSelf: 'center' }}
          >
            Change what to share
          </Button>
        </View>
      ) : (
        <View style={{ gap: theme.space.md }}>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            Choose what goes in the copy. The itinerary (cities and days) is always included.
            Everything is encrypted on this device; the code works for 3 minutes.
          </Text>

          <View>
            <CheckRow
              label="Select all"
              checked={allOn}
              onChange={(on) =>
                setOptions(
                  Object.fromEntries(
                    OPTION_ROWS.map((r) => [r.key, on]),
                  ) as unknown as ShareOptions,
                )
              }
            />
            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.border,
                marginVertical: theme.space.xs,
              }}
            />
            {OPTION_ROWS.map((row) => {
              const available = DEPENDS_ON[row.key]?.(options) ?? true;
              return (
                <CheckRow
                  key={row.key}
                  label={row.label}
                  hint={row.hint}
                  checked={options[row.key] && available}
                  disabled={!available}
                  onChange={(on) => setOptions({ ...options, [row.key]: on })}
                />
              );
            })}
          </View>

          <View style={{ gap: theme.space.xs }}>
            <FieldLabel>Your name (shown to the receiver)</FieldLabel>
            <TextField
              value={senderName}
              onChangeText={setName}
              placeholder="Optional"
              name="share-sender-name"
            />
          </View>

          {error ? (
            <Text style={[theme.type.body, { color: theme.colors.warn }]}>{error}</Text>
          ) : null}

          <Button
            variant="primary"
            icon="qr-code-outline"
            loading={busy}
            onPress={onCreate}
            fullWidth
          >
            {busy ? 'Encrypting…' : 'Create share code'}
          </Button>

          <View
            style={{
              marginTop: theme.space.sm,
              paddingTop: theme.space.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.borderSoft,
            }}
          >
            <Link href="/receive" asChild>
              <Button variant="ghost" icon="download-outline" align="start" fullWidth>
                Receive a trip instead
              </Button>
            </Link>
          </View>
        </View>
      )}
    </Screen>
  );
}
