import { useQueries, useQuery } from '@tanstack/react-query';

import { fetchExchangeRate } from '@/lib/currency';

const isCurrencyCode = (code: string) => /^[A-Za-z]{3}$/.test(code);

function rateQueryOptions(from: string, to: string) {
  return {
    queryKey: ['exchangeRate', from, to] as const,
    queryFn: () => fetchExchangeRate(from, to),
    enabled: isCurrencyCode(from) && isCurrencyCode(to),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  };
}

export function useExchangeRate(from: string, to: string) {
  return useQuery(rateQueryOptions(from, to));
}

/** One rate query per currency, in currency order — used to convert a trip's mixed-currency bookings to its default currency. */
export function useExchangeRates(currencies: string[], to: string) {
  return useQueries({ queries: currencies.map((from) => rateQueryOptions(from, to)) });
}
