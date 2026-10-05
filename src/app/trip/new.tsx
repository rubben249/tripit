import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { TextField } from '@/components/TextField';
import { env } from '@/config/env';
import { useCreateTrip } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function NewTripScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createTrip = useCreateTrip();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState(env.defaultCurrency);
  const [error, setError] = useState('');

  const onCreate = async () => {
    setError('');
    try {
      const trip = await createTrip.mutateAsync({
        name: name.trim(),
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
        defaultCurrency: currency.trim().toUpperCase() || 'EUR',
      });
      router.replace(`/trip/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the trip');
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'New trip', presentation: 'modal' }} />
      <ScreenTitle>New trip</ScreenTitle>

      <View style={{ gap: theme.space.xs }}>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>NAME</Text>
        <TextField value={name} onChangeText={setName} placeholder="Italy, summer 2026…" />
      </View>

      <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>START DATE</Text>
          <TextField value={startDate} onChangeText={setStartDate} placeholder="2026-08-28" />
        </View>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>END DATE</Text>
          <TextField value={endDate} onChangeText={setEndDate} placeholder="2026-09-03" />
        </View>
      </View>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        Dates are optional — leave blank to save as a draft. Format: YYYY-MM-DD.
      </Text>

      <View style={{ gap: theme.space.xs }}>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>CURRENCY</Text>
        <TextField
          value={currency}
          onChangeText={setCurrency}
          placeholder="EUR"
          autoCapitalize="characters"
          maxLength={3}
        />
      </View>

      {error ? (
        <Text style={[theme.type.caption, { color: theme.colors.warn }]}>{error}</Text>
      ) : null}

      <Pressable
        onPress={onCreate}
        disabled={!name.trim() || createTrip.isPending}
        style={{
          backgroundColor: theme.colors.ink,
          borderRadius: theme.radius.sm,
          paddingVertical: theme.space.sm,
          alignItems: 'center',
          opacity: !name.trim() || createTrip.isPending ? 0.6 : 1,
        }}
      >
        <Text style={[theme.type.title, { color: theme.colors.onInk }]}>
          {createTrip.isPending ? 'Creating…' : 'Create trip'}
        </Text>
      </Pressable>
    </Screen>
  );
}
