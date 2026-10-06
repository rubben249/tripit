import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorNotice } from '@/components/ErrorNotice';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { TextField } from '@/components/TextField';
import { fetchShare } from '@/features/share/api';
import { formatCode, normalizeCode, shareCryptoSupported } from '@/features/share/crypto';
import { importBundle } from '@/features/transfer/api';
import { summarizeBundle } from '@/features/transfer/bundle';
import { formatDateRange } from '@/lib/dates';
import { describeDatabaseError, isDatabaseBusyError } from '@/lib/db/errors';
import { recoverFromDatabaseError } from '@/lib/db/recover';
import { plural } from '@/lib/plural';
import { useTheme } from '@/theme/ThemeProvider';

/** Receive a trip someone shared: type the code (or arrive here from the QR link), preview what's
 * in it, then add it as an independent copy. */
export default function ReceiveScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ code?: string }>();
  const fromLink = normalizeCode(params.code ?? '');
  const [input, setInput] = useState(fromLink ? formatCode(fromLink) : '');
  // Arriving from the QR link fetches right away — the 3-minute clock is already ticking.
  const [submitted, setSubmitted] = useState<string | null>(fromLink);
  const [inputError, setInputError] = useState('');
  const [importError, setImportError] = useState<unknown>(null);
  const [importing, setImporting] = useState(false);
  const share = useQuery({
    queryKey: ['share', submitted],
    queryFn: () => fetchShare(submitted as string),
    enabled: !!submitted && shareCryptoSupported(),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  const bundle = share.data ?? null;
  const busy = share.isFetching || importing;
  const lookupError = share.error instanceof Error ? share.error.message : '';
  // The import writes to the local database, which only one browser context can
  // hold — that failure needs its own explanation, not a red line of platform text.
  const blocked = isDatabaseBusyError(importError);
  const error =
    inputError || (blocked ? '' : importError ? describeDatabaseError(importError) : lookupError);

  const lookUp = (raw: string) => {
    setInputError('');
    const code = normalizeCode(raw);
    if (!code) {
      setInputError('Codes have 8 characters, like ABCD-EFGH.');
      return;
    }
    if (code === submitted) share.refetch();
    else setSubmitted(code);
  };

  const onImport = async () => {
    if (!bundle) return;
    setImporting(true);
    setImportError(null);
    try {
      const inserted = await importBundle(bundle.tables, 'freshIds');
      await queryClient.invalidateQueries();
      const tripId = inserted.trips[0]?.id;
      router.replace(typeof tripId === 'string' ? `/trip/${tripId}` : '/');
    } catch (err) {
      setImportError(err ?? new Error('Could not add the trip.'));
      setImporting(false);
    }
  };

  const trip = bundle?.tables.trips[0];
  const summary = bundle ? summarizeBundle(bundle.tables) : null;
  const dates =
    typeof trip?.start_date === 'string' && typeof trip?.end_date === 'string'
      ? formatDateRange(trip.start_date, trip.end_date)
      : null;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Receive a trip', presentation: 'modal' }} />
      <ScreenTitle subtitle="A copy of someone else's trip lands in your list. Nothing syncs back.">
        Receive a trip
      </ScreenTitle>

      {!shareCryptoSupported() ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Receiving trips is available in the web app for now.
        </Text>
      ) : bundle && trip && summary ? (
        <View style={{ gap: theme.space.md }}>
          <View
            style={{
              padding: theme.space.lg,
              gap: theme.space.xs,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
          >
            {bundle.sharedBy ? (
              <Text style={[theme.type.data, { fontSize: 12, color: theme.colors.accent }]}>
                SHARED BY {bundle.sharedBy.toUpperCase()}
              </Text>
            ) : null}
            <Text style={[theme.type.headline, { color: theme.colors.text }]}>
              {String(trip.name)}
            </Text>
            {dates ? (
              <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>{dates}</Text>
            ) : null}
            <Text style={[theme.type.body, { color: theme.colors.text }]}>
              {[
                plural(summary.cities, 'city', 'cities'),
                plural(summary.reservations, 'reservation'),
                plural(summary.notes, 'note'),
                plural(summary.tasks, 'task'),
                plural(summary.photos, 'photo'),
              ].join(' · ')}
            </Text>
          </View>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            It becomes your own copy: changes you make stay with you, and later changes by the
            sender won&apos;t reach it.
          </Text>
          {blocked ? (
            <ErrorNotice
              error={importError}
              onRetry={() => recoverFromDatabaseError(onImport)}
              retrying={importing}
            />
          ) : (
            <>
              {error ? (
                <Text style={[theme.type.body, { color: theme.colors.warn }]}>{error}</Text>
              ) : null}
              <Button
                variant="primary"
                icon="checkmark"
                loading={busy}
                onPress={onImport}
                fullWidth
              >
                {busy ? 'Adding…' : 'Add to my trips'}
              </Button>
            </>
          )}
        </View>
      ) : (
        <View style={{ gap: theme.space.md }}>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            Enter the code shown on the other phone. Codes work for 3 minutes.
          </Text>
          <TextField
            value={input}
            onChangeText={setInput}
            placeholder="ABCD-EFGH"
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={() => lookUp(input)}
            style={{ fontFamily: theme.fontFamily.monoMedium, fontSize: 24, letterSpacing: 3 }}
            name="share-code"
          />
          {error ? (
            <Text style={[theme.type.body, { color: theme.colors.warn }]}>{error}</Text>
          ) : null}
          <Button
            variant="primary"
            icon="download-outline"
            loading={busy}
            onPress={() => lookUp(input)}
            fullWidth
          >
            {busy ? 'Looking…' : 'Get trip'}
          </Button>
          {fromLink ? (
            <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
              Use TripIt from your home screen? It keeps its trips apart from the browser — open it
              there, go to You → Receive a trip, and type {formatCode(fromLink)}.
            </Text>
          ) : null}
        </View>
      )}

      {/* The other half of the same job. Someone who opens this screen by mistake —
          or who finishes receiving and now wants to send — would otherwise have to
          know that sharing hides inside a trip. */}
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
          Sending one instead? Open the trip you want to send and tap Share trip.
        </Text>
        <Link href="/" asChild>
          <Button
            variant="secondary"
            icon="briefcase-outline"
            iconEnd="chevron-forward"
            align="start"
            fullWidth
          >
            Go to my trips
          </Button>
        </Link>
      </View>
    </Screen>
  );
}
