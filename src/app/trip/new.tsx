import { useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { TextField } from '@/components/TextField';
import { useSettings } from '@/features/settings/hooks';
import { useCreateTrip } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function NewTripScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createTrip = useCreateTrip();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const { defaultCurrency } = useSettings();
  // Null until the user types, so the field follows the saved default once settings have loaded.
  const [typedCurrency, setCurrency] = useState<string | null>(null);
  const currency = typedCurrency ?? defaultCurrency;
  const [error, setError] = useState('');

  const onCreate = async () => {
    setError('');
    Keyboard.dismiss();
    try {
      const trip = await createTrip.mutateAsync({
        name: name.trim(),
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        defaultCurrency: currency.trim().toUpperCase() || defaultCurrency,
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
        <TextField
          value={name}
          onChangeText={setName}
          placeholder="Italy, summer 2026…"
          name="trip-name"
        />
      </View>

      <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>START DATE</Text>
          <DateField
            label="Start date"
            value={startDate}
            onChange={(date) => {
              setStartDate(date);
              if (date && endDate && date > endDate) setEndDate(date);
            }}
            name="trip-start-date"
          />
        </View>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>END DATE</Text>
          <DateField
            label="End date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate}
            name="trip-end-date"
          />
        </View>
      </View>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        Dates are optional — leave blank to save as a draft.
      </Text>

      <View style={{ gap: theme.space.xs }}>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>CURRENCY</Text>
        <TextField
          value={currency}
          onChangeText={setCurrency}
          placeholder="EUR"
          autoCapitalize="characters"
          maxLength={3}
          name="trip-currency"
        />
      </View>

      {error ? (
        <Text style={[theme.type.caption, { color: theme.colors.warn }]}>{error}</Text>
      ) : null}

      <Button
        variant="primary"
        fullWidth
        onPress={onCreate}
        disabled={!name.trim() || createTrip.isPending}
      >
        {createTrip.isPending ? 'Creating…' : 'Create trip'}
      </Button>
    </Screen>
  );
}
