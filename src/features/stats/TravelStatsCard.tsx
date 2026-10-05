import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Text, View } from 'react-native';

import { useExchangeRates } from '@/features/expenses/hooks';
import { useSettings } from '@/features/settings/hooks';
import { useTrips } from '@/features/trips/hooks';
import { formatMoney } from '@/lib/currency';
import { plural } from '@/lib/plural';
import { useTheme } from '@/theme/ThemeProvider';

import { loadStatsData } from './api';
import { computeStats, countryFlag, countryName } from './stats';

/** "Travel passport": where you've been and how much you've traveled, from trips already taken. */
export function TravelStatsCard() {
  const theme = useTheme();
  const { defaultCurrency } = useSettings();
  const { data: trips } = useTrips();
  const { data, refetch } = useQuery({ queryKey: ['stats'], queryFn: loadStatsData });

  // Tab screens stay mounted, so refresh whenever You comes back into view.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const stats = computeStats(
    trips ?? [],
    data?.cities ?? [],
    data?.bookings ?? [],
    defaultCurrency,
  );
  const others = Object.keys(stats.spentByCurrency).filter((c) => c !== defaultCurrency);
  const rates = useExchangeRates(others, defaultCurrency);
  const converted = others.every((_, i) => rates[i]?.data);
  const totalSpent = Object.entries(stats.spentByCurrency).reduce((sum, [currency, amount]) => {
    if (currency === defaultCurrency) return sum + amount;
    const rate = rates[others.indexOf(currency)]?.data?.rate;
    return rate ? sum + amount * rate : sum;
  }, 0);

  const figures: { label: string; value: string }[] = [
    { label: 'Trips', value: String(stats.traveledTrips) },
    { label: 'Countries', value: String(stats.countries.length) },
    { label: 'Cities', value: String(stats.cities) },
    { label: 'Days away', value: String(stats.daysTraveling) },
  ];

  return (
    <View
      style={{
        gap: theme.space.md,
        padding: theme.space.lg,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.ink,
      }}
    >
      <Text style={[theme.type.data, { fontSize: 12, color: theme.colors.mist }]}>
        TRAVEL PASSPORT
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.lg }}>
        {figures.map((f) => (
          <View key={f.label} style={{ minWidth: 72 }}>
            <Text style={[theme.type.display, { color: theme.colors.onInk }]}>{f.value}</Text>
            <Text style={[theme.type.caption, { color: theme.colors.mist }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      {stats.countries.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          {stats.countries.map((code) => (
            <Text key={code} style={[theme.type.body, { color: theme.colors.onInk }]}>
              {countryFlag(code)} {countryName(code)}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={[theme.type.body, { color: theme.colors.mist }]}>
        {totalSpent > 0
          ? `${converted ? '' : '≈ '}${formatMoney(totalSpent, defaultCurrency, 0)} spent traveling`
          : stats.traveledTrips === 0
            ? 'Your stats fill in as your trips happen.'
            : 'No spending recorded yet.'}
        {stats.upcomingTrips > 0 ? ` · ${plural(stats.upcomingTrips, 'trip')} coming up` : ''}
      </Text>
    </View>
  );
}
