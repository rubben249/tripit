import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useExchangeRate, useExchangeRates } from '@/features/expenses/hooks';
import { useBookings } from '@/features/itinerary/hooks';
import { useTrip } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function ExpensesScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: bookings } = useBookings(id);
  const defaultCurrency = trip?.defaultCurrency ?? '';

  const priced = (bookings ?? []).filter((b): b is typeof b & { price: number } => b.price != null);

  const byCurrency = useMemo(() => {
    const totals = new Map<string, number>();
    for (const booking of priced) {
      const currency = booking.currency ?? defaultCurrency;
      totals.set(currency, (totals.get(currency) ?? 0) + booking.price);
    }
    return Array.from(totals.entries()).map(([currency, amount]) => ({ currency, amount }));
  }, [priced, defaultCurrency]);

  const otherCurrencies = byCurrency
    .map((c) => c.currency)
    .filter((currency) => currency !== defaultCurrency);
  const rateQueries = useExchangeRates(otherCurrencies, defaultCurrency);

  const grandTotal = byCurrency.reduce((sum, { currency, amount }) => {
    if (currency === defaultCurrency) return sum + amount;
    const index = otherCurrencies.indexOf(currency);
    const rate = rateQueries[index]?.data?.rate;
    return rate ? sum + amount * rate : sum;
  }, 0);
  const allConverted = otherCurrencies.every((_, i) => rateQueries[i]?.data);

  if (!trip) return null;

  return (
    <Screen scroll>
      <View style={{ gap: theme.space.xs }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Total spent</Text>
        {priced.length === 0 ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            No priced bookings yet — add a price when creating a booking to track spend here.
          </Text>
        ) : (
          <>
            <Text style={[theme.type.display, { fontSize: 32, color: theme.colors.accent }]}>
              {allConverted
                ? formatMoney(grandTotal, defaultCurrency)
                : `≈ ${formatMoney(grandTotal, defaultCurrency)}`}
            </Text>
            {byCurrency.length > 1 ? (
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {byCurrency.map((c) => formatMoney(c.amount, c.currency)).join(' + ')}
                {!allConverted ? ' · converting…' : ''}
              </Text>
            ) : null}
          </>
        )}
      </View>

      <CurrencyConverter baseCurrency={defaultCurrency} />
    </Screen>
  );
}

function CurrencyConverter({ baseCurrency }: { baseCurrency: string }) {
  const theme = useTheme();
  const [amount, setAmount] = useState('1');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const parsedAmount = Number(amount.replace(',', '.'));
  const validAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

  const { data, isLoading, isError } = useExchangeRate(baseCurrency, targetCurrency.toUpperCase());

  return (
    <View
      style={{
        gap: theme.space.sm,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Text style={[theme.type.title, { color: theme.colors.text }]}>Currency converter</Text>

      <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>AMOUNT</Text>
          <TextField
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="1"
            name="converter-amount"
          />
        </View>
        <View style={{ width: 96, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>TO</Text>
          <TextField
            value={targetCurrency}
            onChangeText={(v) => setTargetCurrency(v.toUpperCase())}
            autoCapitalize="characters"
            maxLength={3}
            placeholder="USD"
            name="converter-currency"
          />
        </View>
      </View>

      {isLoading ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>Fetching rate…</Text>
      ) : isError ? (
        <Text style={[theme.type.caption, { color: theme.colors.warn }]}>
          Couldn&apos;t fetch a rate — check your connection or the currency code.
        </Text>
      ) : data ? (
        <View style={{ gap: 2 }}>
          <Text style={[theme.type.headline, { fontSize: 24, color: theme.colors.text }]}>
            {formatMoney(validAmount * data.rate, targetCurrency.toUpperCase())}
          </Text>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            1 {baseCurrency} = {data.rate.toFixed(4)} {targetCurrency.toUpperCase()} · {data.date}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
