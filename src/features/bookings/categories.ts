import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/**
 * Single source of truth for booking categories (icon, color, label) — used
 * by the itinerary, the map, expenses and notifications alike. See
 * CLAUDE.md "Arquitectura modular y configuración centralizada". Colors stay
 * inside the Atlas Umber family (see src/theme/tokens.ts); categories are
 * told apart mainly by icon, per docs/REQUISITOS.md section 5.
 *
 * Personalization (recoloring, hiding, custom categories) is explicitly out
 * of scope for Fase 2 — see docs/PLAN.md. This module is the single place
 * that changes when that lands.
 */

export type CategoryKey =
  | 'flight'
  | 'train'
  | 'bus'
  | 'local_transport'
  | 'walking'
  | 'car_rental'
  | 'boat_ferry'
  | 'accommodation'
  | 'restaurant'
  | 'ticket_activity'
  | 'sightseeing'
  | 'shopping'
  | 'leisure'
  | 'note'
  | 'task';

export interface BookingCategory {
  key: CategoryKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  /** Whether this category spans a date range (e.g. hotel nights) rather than a single point in time. */
  isRange: boolean;
  /**
   * Whether this is something you hold a reservation for — a ticket, a seat, a
   * room, a table. The Reservations tab is that list and nothing else: a museum,
   * a train and a hotel belong there; a walk through the Jordaan or a stop to
   * take photos does not, however firmly it sits in the plan.
   */
  bookable: boolean;
}

export const bookingCategories: Record<CategoryKey, BookingCategory> = {
  flight: {
    key: 'flight',
    label: 'Flight',
    icon: 'airplane-outline',
    color: '#8A5A34',
    isRange: false,
    bookable: true,
  },
  train: {
    key: 'train',
    label: 'Train',
    icon: 'train-outline',
    color: '#4A3222',
    isRange: false,
    bookable: true,
  },
  bus: {
    key: 'bus',
    label: 'Bus / transfer',
    icon: 'bus-outline',
    color: '#A9825A',
    isRange: false,
    bookable: true,
  },
  local_transport: {
    key: 'local_transport',
    label: 'Tram / metro / bus',
    icon: 'swap-horizontal-outline',
    color: '#C2A47D',
    isRange: false,
    bookable: true,
  },
  walking: {
    key: 'walking',
    label: 'On foot',
    icon: 'walk-outline',
    color: '#9C8B76',
    isRange: false,
    bookable: false,
  },
  car_rental: {
    key: 'car_rental',
    label: 'Car rental',
    icon: 'car-outline',
    color: '#6B4A33',
    isRange: true,
    bookable: true,
  },
  boat_ferry: {
    key: 'boat_ferry',
    label: 'Boat / ferry',
    icon: 'boat-outline',
    color: '#5E7A6B',
    isRange: false,
    bookable: true,
  },
  accommodation: {
    key: 'accommodation',
    label: 'Accommodation',
    icon: 'bed-outline',
    color: '#A8763E',
    isRange: true,
    bookable: true,
  },
  restaurant: {
    key: 'restaurant',
    label: 'Restaurant',
    icon: 'restaurant-outline',
    color: '#8C6F4E',
    isRange: false,
    bookable: true,
  },
  ticket_activity: {
    key: 'ticket_activity',
    label: 'Ticket / activity',
    icon: 'ticket-outline',
    color: '#7A5C42',
    isRange: false,
    bookable: true,
  },
  sightseeing: {
    key: 'sightseeing',
    label: 'Sightseeing',
    icon: 'camera-outline',
    color: '#C9AE8C',
    isRange: false,
    bookable: false,
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping',
    icon: 'bag-outline',
    color: '#B08D5B',
    isRange: false,
    bookable: false,
  },
  leisure: {
    key: 'leisure',
    label: 'Leisure',
    icon: 'happy-outline',
    color: '#6E7B4F',
    isRange: false,
    bookable: false,
  },
  note: {
    key: 'note',
    label: 'Note',
    icon: 'document-text-outline',
    color: '#9C8B76',
    isRange: false,
    bookable: false,
  },
  task: {
    key: 'task',
    label: 'Task',
    icon: 'checkbox-outline',
    color: '#5B4A3A',
    isRange: false,
    bookable: false,
  },
};

export const categoryKeys = Object.keys(bookingCategories) as CategoryKey[];

/** Notes and tasks are bookings too (no day/city), but they have their own tabs — they never
 * show up as a reservation or as a category to pick in the booking form. */
export const reservationCategoryKeys = categoryKeys.filter(isReservationCategory);

/** The categories the Reservations tab groups by, in the order it shows them. */
export const bookableCategoryKeys = categoryKeys.filter(isBookableCategory);

export function isReservationCategory(key: CategoryKey): boolean {
  return key !== 'note' && key !== 'task';
}

/** Something you reserve or pay for ahead of time — see `BookingCategory.bookable`. */
export function isBookableCategory(key: CategoryKey): boolean {
  return bookingCategories[key]?.bookable ?? false;
}

export function getCategory(key: string): BookingCategory {
  return bookingCategories[key as CategoryKey] ?? bookingCategories.note;
}
