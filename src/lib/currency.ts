/**
 * Live exchange rates via Frankfurter (api.frankfurter.dev) — European
 * Central Bank data, free, no API key, no card required (see CLAUDE.md
 * "Regla de coste cero"). Updated once per business day, which is plenty for
 * a ballpark travel-budget conversion.
 *
 * The old api.frankfurter.app domain 301-redirects here now — hitting that
 * one directly from a browser fetch() silently fails (the redirect hop
 * isn't CORS-clean), so this calls the current domain straight away.
 */
export interface ExchangeRate {
  rate: number;
  date: string;
}

/** All ISO currency codes Frankfurter can convert, as {code: name} — used to populate currency pickers with real, spendable currencies instead of free-text input. */
export async function fetchCurrencies(): Promise<Record<string, string>> {
  const res = await fetch('https://api.frankfurter.dev/v1/currencies');
  if (!res.ok) throw new Error(`Currency list request failed (${res.status})`);
  return (await res.json()) as Record<string, string>;
}

export async function fetchExchangeRate(from: string, to: string): Promise<ExchangeRate> {
  if (from === to) return { rate: 1, date: new Date().toISOString().slice(0, 10) };

  const res = await fetch(
    `https://api.frankfurter.dev/v1/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  if (!res.ok) throw new Error(`Exchange rate request failed (${res.status})`);

  const data = (await res.json()) as { rates?: Record<string, number>; date?: string };
  const rate = data.rates?.[to];
  if (typeof rate !== 'number') throw new Error(`No exchange rate available for ${from} → ${to}`);

  return { rate, date: data.date ?? new Date().toISOString().slice(0, 10) };
}

/** "1,234.50 EUR" — amount in the device locale, followed by the ISO code. */
export function formatMoney(amount: number, currency: string, fractionDigits = 2): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} ${currency}`;
}
