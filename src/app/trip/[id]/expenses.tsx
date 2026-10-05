import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { CurrencyField } from '@/components/CurrencyField';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import {
  bookingCategories,
  categoryKeys,
  type BookingCategory,
  type CategoryKey,
} from '@/features/bookings/categories';
import { useExchangeRate, useExchangeRates } from '@/features/expenses/hooks';
import {
  useBookings,
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
} from '@/features/itinerary/hooks';
import { useTrip } from '@/features/trips/hooks';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

const EXPENSE_CATEGORY_KEYS = categoryKeys.filter((k) => k !== 'note' && k !== 'task');

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

interface SpendItem {
  categoryKey: CategoryKey;
  amount: number;
  currency: string;
}

export default function ExpensesScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: bookings } = useBookings(id);
  const { data: expenses } = useExpenses(id);
  const defaultCurrency = trip?.defaultCurrency ?? '';

  const items: SpendItem[] = useMemo(() => {
    const fromBookings = (bookings ?? [])
      .filter((b) => b.price != null)
      .map((b) => ({
        categoryKey: b.categoryKey,
        amount: b.price!,
        currency: b.currency ?? defaultCurrency,
      }));
    const fromExpenses = (expenses ?? []).map((e) => ({
      categoryKey: e.categoryKey,
      amount: e.amount,
      currency: e.currency,
    }));
    return [...fromBookings, ...fromExpenses];
  }, [bookings, expenses, defaultCurrency]);

  const otherCurrencies = useMemo(
    () => Array.from(new Set(items.map((i) => i.currency).filter((c) => c !== defaultCurrency))),
    [items, defaultCurrency],
  );
  const rateQueries = useExchangeRates(otherCurrencies, defaultCurrency);
  const rateFor = (currency: string): number | undefined =>
    currency === defaultCurrency ? 1 : rateQueries[otherCurrencies.indexOf(currency)]?.data?.rate;
  const allConverted = otherCurrencies.every((_, i) => rateQueries[i]?.data);

  const grandTotal = items.reduce((sum, item) => {
    const rate = rateFor(item.currency);
    return rate ? sum + item.amount * rate : sum;
  }, 0);

  const byCategory = useMemo(() => {
    const totals = new Map<CategoryKey, number>();
    for (const item of items) {
      const rate = rateFor(item.currency);
      if (!rate) continue;
      totals.set(item.categoryKey, (totals.get(item.categoryKey) ?? 0) + item.amount * rate);
    }
    return Array.from(totals.entries())
      .map(([categoryKey, amount]) => ({ category: bookingCategories[categoryKey], amount }))
      .sort((a, b) => b.amount - a.amount);
    // rateFor closes over rateQueries, which is already a dependency via otherCurrencies/rateQueries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, defaultCurrency, rateQueries]);

  if (!trip) return null;

  return (
    <Screen scroll>
      <View style={{ gap: theme.space.xs }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Total spent</Text>
        {items.length === 0 ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            Nothing tracked yet — price a booking or add an expense below.
          </Text>
        ) : (
          <Text style={[theme.type.display, { fontSize: 32, color: theme.colors.accent }]}>
            {allConverted
              ? formatMoney(grandTotal, defaultCurrency)
              : `≈ ${formatMoney(grandTotal, defaultCurrency)}`}
          </Text>
        )}
      </View>

      {byCategory.length > 0 ? (
        <View style={{ gap: theme.space.xs }}>
          <Text style={[theme.type.title, { color: theme.colors.text }]}>By category</Text>
          {byCategory.map(({ category, amount }) => (
            <View
              key={category.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space.sm,
                paddingVertical: 4,
              }}
            >
              <Ionicons name={category.icon} size={16} color={category.color} />
              <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
                {category.label}
              </Text>
              <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
                {formatMoney(amount, defaultCurrency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <ExpensesList tripId={id} />
      <CurrencyConverter defaultFrom={defaultCurrency} />
    </Screen>
  );
}

function ExpensesList({ tripId }: { tripId: string }) {
  const theme = useTheme();
  const { data: trip } = useTrip(tripId);
  const { data: expenses } = useExpenses(tripId);
  const createExpense = useCreateExpense(tripId);
  const deleteExpense = useDeleteExpense(tripId);
  const { confirm, dialog } = useConfirm();
  const [adding, setAdding] = useState(false);
  const [categoryKey, setCategoryKey] = useState<CategoryKey>('restaurant');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(trip?.defaultCurrency ?? 'EUR');

  const onAdd = async () => {
    const trimmed = title.trim();
    const parsed = Number(amount.replace(',', '.'));
    if (!trimmed || !Number.isFinite(parsed) || parsed <= 0) return;
    await createExpense.mutateAsync({
      categoryKey,
      title: trimmed,
      amount: parsed,
      currency: currency.toUpperCase(),
    });
    setTitle('');
    setAmount('');
    setAdding(false);
  };

  const onDelete = async (expenseId: string, expenseTitle: string) => {
    const confirmed = await confirm({
      title: 'Delete this expense?',
      message: `"${expenseTitle}" will be removed from your total spent.`,
      confirmLabel: 'Delete',
    });
    if (confirmed) deleteExpense.mutate(expenseId);
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text style={[theme.type.title, { color: theme.colors.text }]}>Extra expenses</Text>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        Things you spent on that aren&apos;t a booking — food, souvenirs, taxis…
      </Text>

      {(expenses ?? []).map((expense) => {
        const category = bookingCategories[expense.categoryKey];
        return (
          <View
            key={expense.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.sm,
              paddingVertical: theme.space.xs,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Ionicons name={category.icon} size={16} color={category.color} />
            <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
              {expense.title}
            </Text>
            <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
              {formatMoney(expense.amount, expense.currency)}
            </Text>
            <Button variant="danger" size="sm" onPress={() => onDelete(expense.id, expense.title)}>
              Delete
            </Button>
          </View>
        );
      })}

      {adding ? (
        <View
          style={{
            gap: theme.space.sm,
            padding: theme.space.sm,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }}>
            {EXPENSE_CATEGORY_KEYS.map((key) => (
              <ExpenseCategoryChip
                key={key}
                category={bookingCategories[key]}
                active={key === categoryKey}
                onPress={() => setCategoryKey(key)}
              />
            ))}
          </View>
          <TextField
            value={title}
            onChangeText={setTitle}
            placeholder="What was it?"
            name="expense-title"
          />
          <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
            <TextField
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Amount"
              style={{ flex: 1 }}
              name="expense-amount"
            />
            <TextField
              value={currency}
              onChangeText={(v) => setCurrency(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={3}
              style={{ width: 72 }}
              name="expense-currency"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onPress={onAdd}
              disabled={createExpense.isPending}
            >
              Add expense
            </Button>
            <Button variant="secondary" size="sm" onPress={() => setAdding(false)}>
              Cancel
            </Button>
          </View>
        </View>
      ) : (
        <Button variant="dashed" onPress={() => setAdding(true)}>
          + Add expense
        </Button>
      )}

      {dialog}
    </View>
  );
}

function ExpenseCategoryChip({
  category,
  active,
  onPress,
}: {
  category: BookingCategory;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme.space.sm,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        backgroundColor: active ? category.color : 'transparent',
        borderWidth: 1,
        borderColor: active ? category.color : theme.colors.border,
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      <Ionicons
        name={category.icon}
        size={13}
        color={active ? theme.colors.onInk : category.color}
      />
      <Text
        style={[
          theme.type.caption,
          { fontSize: 11, color: active ? theme.colors.onInk : theme.colors.textMuted },
        ]}
      >
        {category.label}
      </Text>
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
      <Text style={[theme.type.title, { color: theme.colors.text }]}>Currency converter</Text>

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
          <Ionicons name="swap-horizontal" size={20} color={theme.colors.accent} />
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
          <Text style={[theme.type.headline, { fontSize: 24, color: theme.colors.text }]}>
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
