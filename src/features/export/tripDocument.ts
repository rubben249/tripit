import { getCategory } from '@/features/bookings/categories';
import {
  asTransportDetails,
  CARRIER_LABEL,
  isTransportCategory,
} from '@/features/bookings/details';
import {
  BOOKING_STATUS_OPTIONS,
  type Booking,
  type City,
  type ItineraryDay,
} from '@/features/itinerary/types';
import type { Trip } from '@/features/trips/types';
import { formatMoney } from '@/lib/currency';
import { formatDateRange, formatDayLabel } from '@/lib/dates';

/**
 * A whole trip written out as a document: every day in order, everything booked that day in time
 * order, and the trip's notes at the end. The model is plain data so it can be rendered to Word
 * (or anything else) without the renderer knowing what a booking is.
 */

export interface DocLine {
  label: string;
  text: string;
}

export interface DocItem {
  /** "17:40", "17:40 – 20:05", or null for anything untimed. */
  time: string | null;
  title: string;
  category: string;
  status: string | null;
  lines: DocLine[];
}

export interface DocDay {
  heading: string;
  city: string | null;
  notes: string | null;
  items: DocItem[];
}

export interface DocNote {
  title: string;
  body: string;
}

export interface TripDocument {
  title: string;
  subtitle: string;
  days: DocDay[];
  /** Booked and paid-for things with no day of their own — they'd be lost otherwise. */
  undated: DocItem[];
  notes: DocNote[];
  total: string | null;
}

const STATUS_LABEL = Object.fromEntries(BOOKING_STATUS_OPTIONS.map((o) => [o.key, o.label]));

const timeOf = (iso: string | null): string | null =>
  iso && iso.includes('T') ? iso.slice(11, 16) : null;

const dateOf = (iso: string | null): string | null => (iso ? iso.slice(0, 10) : null);

function whenLabel(booking: Booking): string | null {
  const start = timeOf(booking.startAt);
  const end = timeOf(booking.endAt);
  const sameDay = dateOf(booking.startAt) === dateOf(booking.endAt);
  if (start && end) return sameDay ? `${start} – ${end}` : `${start} → ${end} (next day)`;
  return start;
}

/** A hotel stay reads as its nights, not as a time of day. */
function stayLine(booking: Booking): DocLine | null {
  const from = dateOf(booking.startAt);
  const to = dateOf(booking.endAt);
  if (!getCategory(booking.categoryKey).isRange || !from || !to) return null;
  return {
    label: 'Dates',
    text: `${formatDateRange(from, to)} · check-in ${formatDayLabel(from)}`,
  };
}

function placeLine(booking: Booking): DocLine | null {
  const where = [booking.locationName, booking.address]
    .map((p) => p?.trim())
    .filter((p): p is string => !!p)
    .join(' · ');
  return where ? { label: 'Where', text: where } : null;
}

function transportLines(booking: Booking): DocLine[] {
  if (!isTransportCategory(booking.categoryKey)) return [];
  const details = asTransportDetails(booking.details);
  const lines: DocLine[] = [];
  if (details.carrierNumber) {
    lines.push({
      label: CARRIER_LABEL[booking.categoryKey] ?? 'Number',
      text: details.carrierNumber,
    });
  }
  const terminal = (name?: string, terminal?: string) =>
    [name, terminal ? `terminal ${terminal}` : null].filter(Boolean).join(', ');
  const from = terminal(details.departureLocation, details.departureTerminal);
  const to = terminal(details.arrivalLocation, details.arrivalTerminal);
  if (from || to) lines.push({ label: 'Route', text: [from || '?', to || '?'].join(' → ') });
  return lines;
}

function priceLine(booking: Booking, defaultCurrency: string): DocLine | null {
  if (booking.price == null) return null;
  const label = isTransportCategory(booking.categoryKey) ? 'Fare' : 'Price';
  return { label, text: formatMoney(booking.price, booking.currency ?? defaultCurrency) };
}

export function toDocItem(booking: Booking, defaultCurrency: string): DocItem {
  const lines = [
    stayLine(booking),
    placeLine(booking),
    ...transportLines(booking),
    priceLine(booking, defaultCurrency),
    booking.notes?.trim() ? { label: 'Notes', text: booking.notes.trim() } : null,
  ].filter((line): line is DocLine => line !== null);

  return {
    time: whenLabel(booking),
    title: booking.title,
    category: getCategory(booking.categoryKey).label,
    status: STATUS_LABEL[booking.status] ?? null,
    lines,
  };
}

/** Earliest first; anything untimed goes after the timed plans of that day, in its own order. */
function byTime(a: Booking, b: Booking): number {
  const timeA = timeOf(a.startAt) ?? '99:99';
  const timeB = timeOf(b.startAt) ?? '99:99';
  return timeA.localeCompare(timeB) || a.orderIndex - b.orderIndex;
}

export function buildTripDocument(
  trip: Trip,
  days: ItineraryDay[],
  cities: City[],
  bookings: Booking[],
): TripDocument {
  const currency = trip.defaultCurrency;
  const cityName = new Map(cities.map((c) => [c.id, c.name]));
  const planned = bookings.filter((b) => b.categoryKey !== 'note' && b.categoryKey !== 'task');

  const docDays: DocDay[] = [...days]
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map((day) => ({
      heading: `Day ${day.dayIndex + 1} · ${formatDayLabel(day.date)}`,
      city: day.cityId ? (cityName.get(day.cityId) ?? null) : null,
      notes: day.notes?.trim() || null,
      items: planned
        .filter((b) => b.dayId === day.id)
        .sort(byTime)
        .map((b) => toDocItem(b, currency)),
    }));

  const undated = planned
    .filter((b) => b.dayId === null)
    .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? '') || a.orderIndex - b.orderIndex)
    .map((b) => toDocItem(b, currency));

  const notes: DocNote[] = bookings
    .filter((b) => b.categoryKey === 'note')
    .map((b) => ({ title: b.title, body: b.notes?.trim() ?? '' }));

  const spent = planned.reduce((sum, b) => sum + (b.price ?? 0), 0);

  return {
    title: trip.name,
    subtitle: [
      trip.startDate && trip.endDate ? formatDateRange(trip.startDate, trip.endDate) : null,
      cities.length > 0 ? cities.map((c) => c.name).join(' · ') : null,
    ]
      .filter(Boolean)
      .join(' — '),
    days: docDays,
    undated,
    notes,
    total: spent > 0 ? formatMoney(spent, currency) : null,
  };
}

/** A file name that survives every OS: no slashes, colons or trailing dots. */
export function documentFileName(tripName: string): string {
  const safe = tripName.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'Trip';
  return `${safe}.docx`;
}
