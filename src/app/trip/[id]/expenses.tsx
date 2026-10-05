import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { CurrencyField } from '@/components/CurrencyField';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { bookingCategories, type CategoryKey } from '@/features/bookings/categories';
import { useExchangeRate, useExchangeRates } from '@/features/expenses/hooks';
import { BookingForm } from '@/features/itinerary/BookingForm';
import { useBookings, useItineraryDays } from '@/features/itinerary/hooks';
import { formatDayLabel } from '@/lib/dates';
import { useHoverable } from '@/lib/useHoverable';
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

  const otherCurrencies = useMemo(
    () =>
      Array.from(
        new Set(
          priced.map((b) => b.currency ?? defaultCurrency).filter((c) => c !== defaultCurrency),
        ),
      ),
    [priced, defaultCurrency],
  );
  const rateQueries = useExchangeRates(otherCurrencies, defaultCurrency);
  const rateFor = (currency: string): number | undefined =>
    currency === defaultCurrency ? 1 : rateQueries[otherCurrencies.indexOf(currency)]?.data?.rate;
  const allConverted = otherCurrencies.every((_, i) => rateQueries[i]?.data);

  const grandTotal = priced.reduce((sum, b) => {
    const rate = rateFor(b.currency ?? defaultCurrency);
    return rate ? sum + b.price * rate : sum;
  }, 0);

  const byCategory = useMemo(() => {
    const totals = new Map<CategoryKey, number>();
    for (const b of priced) {
      const rate = rateFor(b.currency ?? defaultCurrency);
      if (!rate) continue;
      totals.set(b.categoryKey, (totals.get(b.categoryKey) ?? 0) + b.price * rate);
    }
    return Array.from(totals.entries())
      .map(([categoryKey, amount]) => ({ category: bookingCategories[categoryKey], amount }))
      .sort((a, b) => b.amount - a.amount);
    // rateFor closes over rateQueries, already a dependency via otherCurrencies/rateQueries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priced, defaultCurrency, rateQueries]);

  if (!trip) return null;

  return (
    <Screen scroll>
      <View style={{ gap: theme.space.sm }}>
        <Text style={[theme.type.headline, { fontSize: 22, color: theme.colors.text }]}>
          Total spent
        </Text>
        {priced.length === 0 ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            Nothing priced yet — add a price to a reservation, or add an expense below.
          </Text>
        ) : (
          <Text style={[theme.type.display, { fontSize: 40, color: theme.colors.accent }]}>
            {allConverted
              ? formatMoney(grandTotal, defaultCurrency)
              : `≈ ${formatMoney(grandTotal, defaultCurrency)}`}
          </Text>
        )}
      </View>

      {byCategory.length > 0 ? (
        <View style={{ gap: theme.space.sm }}>
          <Text style={[theme.type.title, { fontSize: 19, color: theme.colors.text }]}>
            By category
          </Text>
          {byCategory.map(({ category, amount }) => (
            <View
              key={category.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space.sm,
                paddingVertical: 6,
              }}
            >
              <Ionicons name={category.icon} size={19} color={category.color} />
              <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
                {category.label}
              </Text>
              <Text style={[theme.type.title, { fontSize: 15, color: theme.colors.textMuted }]}>
                {formatMoney(amount, defaultCurrency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <AddExpense tripId={id} defaultCurrency={defaultCurrency} />
      <CurrencyConverter defaultFrom={defaultCurrency} />
    </Screen>
  );
}

/** "Add expense" from this tab is a shortcut to create a priced booking on a
 * chosen day — not a separate entity. That's what makes it show up on
 * Itinerary (so you can see which day you spent it) and in Reservations,
 * with nothing to keep in sync by hand. */
function AddExpense({ tripId, defaultCurrency }: { tripId: string; defaultCurrency: string }) {
  const theme = useTheme();
  const { data: days } = useItineraryDays(tripId);
  const [open, setOpen] = useState(false);
  const [dayId, setDayId] = useState<string | null>(null);

  const selectedDay = days?.find((d) => d.id === dayId);

  if (!open) {
    return (
      <Button variant="dashed" onPress={() => setOpen(true)}>
        + Add expense
      </Button>
    );
  }

  if (!days || days.length === 0) {
    return (
      <View style={{ gap: theme.space.sm }}>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Add a city with arrival and departure dates on the Overview tab first — an expense needs a
          day to belong to, so you can find it in Itinerary later.
        </Text>
        <Button variant="secondary" size="sm" onPress={() => setOpen(false)}>
          Close
        </Button>
      </View>
    );
  }

  if (selectedDay) {
    return (
      <View style={{ gap: theme.space.sm }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>
          Day {selectedDay.dayIndex + 1} · {formatDayLabel(selectedDay.date)}
        </Text>
        <BookingForm
          tripId={tripId}
          dayId={selectedDay.id}
          cityId={selectedDay.cityId}
          date={selectedDay.date}
          defaultCurrency={defaultCurrency}
          onDone={() => {
            setOpen(false);
            setDayId(null);
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text style={[theme.type.title, { color: theme.colors.text }]}>Which day was it?</Text>
      <View style={{ gap: theme.space.xs }}>
        {days.map((day) => (
          <DayOption
            key={day.id}
            label={`Day ${day.dayIndex + 1} · ${formatDayLabel(day.date)}`}
            onPress={() => setDayId(day.id)}
          />
        ))}
      </View>
      <Button variant="secondary" size="sm" onPress={() => setOpen(false)}>
        Cancel
      </Button>
    </View>
  );
}

function DayOption({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        padding: theme.space.sm,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.75 : hovered ? 0.9 : 1,
      })}
    >
      <Text style={[theme.type.body, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function CurrencyConverter({ defaultFrom }: { defaultFrom: string }) {
  const theme = useTheme();
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState(defaultFrom || 'EUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const parsedAmount = Number(amount.replace(',', '.'));
  const validAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

  const { data, isLoading, isError } = useExchangeRate(fromCurrency, toCurrency);

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
      <Text style={[theme.type.title, { fontSize: 19, color: theme.colors.text }]}>
        Currency converter
      </Text>

      <View style={{ gap: theme.space.xs }}>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>AMOUNT</Text>
        <TextField
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="1"
          name="converter-amount"
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.space.sm }}>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>FROM</Text>
          <CurrencyField
            label="From currency"
            value={fromCurrency}
            onChange={setFromCurrency}
            name="converter-from"
          />
        </View>
        <Pressable
          onPress={() => {
            setFromCurrency(toCurrency);
            setToCurrency(fromCurrency);
          }}
          style={{ padding: theme.space.sm }}
        >
          <Ionicons name="swap-horizontal" size={22} color={theme.colors.accent} />
        </Pressable>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>TO</Text>
          <CurrencyField
            label="To currency"
            value={toCurrency}
            onChange={setToCurrency}
            name="converter-to"
          />
        </View>
      </View>

      {isLoading ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>Fetching rate…</Text>
      ) : isError ? (
        <Text style={[theme.type.caption, { color: theme.colors.warn }]}>
          Couldn&apos;t fetch a rate — check your connection.
        </Text>
      ) : data ? (
        <View style={{ gap: 2 }}>
          <Text style={[theme.type.display, { fontSize: 28, color: theme.colors.text }]}>
            {formatMoney(validAmount * data.rate, toCurrency)}
          </Text>
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            1 {fromCurrency} = {data.rate.toFixed(4)} {toCurrency} · {data.date}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
