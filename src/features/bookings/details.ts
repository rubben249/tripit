import type { CategoryKey } from './categories';

/** Flight/train/bus/ferry: carrier + where you leave from and arrive to. */
export interface TransportDetails {
  carrierNumber?: string;
  departureLocation?: string;
  departureTerminal?: string;
  arrivalLocation?: string;
  arrivalTerminal?: string;
}

export const TRANSPORT_CATEGORIES: CategoryKey[] = ['flight', 'train', 'bus', 'boat_ferry'];

export function isTransportCategory(key: CategoryKey): boolean {
  return TRANSPORT_CATEGORIES.includes(key);
}

export function asTransportDetails(details: Record<string, unknown> | null): TransportDetails {
  if (!details) return {};
  const { carrierNumber, departureLocation, departureTerminal, arrivalLocation, arrivalTerminal } =
    details;
  return {
    carrierNumber: typeof carrierNumber === 'string' ? carrierNumber : undefined,
    departureLocation: typeof departureLocation === 'string' ? departureLocation : undefined,
    departureTerminal: typeof departureTerminal === 'string' ? departureTerminal : undefined,
    arrivalLocation: typeof arrivalLocation === 'string' ? arrivalLocation : undefined,
    arrivalTerminal: typeof arrivalTerminal === 'string' ? arrivalTerminal : undefined,
  };
}

/** Per-category label for the "carrier number" field — flight number, train number, bus line... */
export const CARRIER_LABEL: Partial<Record<CategoryKey, string>> = {
  flight: 'Flight number',
  train: 'Train number',
  bus: 'Bus line',
  boat_ferry: 'Ferry / vessel',
};

/** Tasks: just a pending/done flag, kept in `details` rather than reusing
 * `status` since that field already means something else (idea/to
 * book/booked/paid/cancelled) for every other category. */
export interface TaskDetails {
  done?: boolean;
}

export function asTaskDetails(details: Record<string, unknown> | null): TaskDetails {
  if (!details) return {};
  return { done: details.done === true };
}
