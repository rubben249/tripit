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
}

export const bookingCategories: Record<CategoryKey, BookingCategory> = {
  flight: {
    key: 'flight',
    label: 'Flight',
    icon: 'airplane-outline',
    color: '#8A5A34',
    isRange: false,
  },
  train: { key: 'train', label: 'Train', icon: 'train-outline', color: '#4A3222', isRange: false },
  bus: {
    key: 'bus',
    label: 'Bus / transfer',
    icon: 'bus-outline',
    color: '#A9825A',
    isRange: false,
  },
  local_transport: {
    key: 'local_transport',
    label: 'Local transport',
    icon: 'swap-horizontal-outline',
    color: '#C2A47D',
    isRange: false,
  },
  car_rental: {
    key: 'car_rental',
    label: 'Car rental',
    icon: 'car-outline',
    color: '#6B4A33',
    isRange: true,
  },
  boat_ferry: {
    key: 'boat_ferry',
    label: 'Boat / ferry',
    icon: 'boat-outline',
    color: '#5E7A6B',
    isRange: false,
  },
  accommodation: {
    key: 'accommodation',
    label: 'Accommodation',
    icon: 'bed-outline',
    color: '#A8763E',
    isRange: true,
  },
  restaurant: {
    key: 'restaurant',
    label: 'Restaurant',
    icon: 'restaurant-outline',
    color: '#8C6F4E',
    isRange: false,
  },
  ticket_activity: {
    key: 'ticket_activity',
    label: 'Ticket / activity',
    icon: 'ticket-outline',
    color: '#7A5C42',
    isRange: false,
  },
  sightseeing: {
    key: 'sightseeing',
    label: 'Sightseeing',
    icon: 'camera-outline',
    color: '#C9AE8C',
    isRange: false,
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping',
    icon: 'bag-outline',
    color: '#B08D5B',
    isRange: false,
  },
  leisure: {
    key: 'leisure',
    label: 'Leisure',
    icon: 'happy-outline',
    color: '#6E7B4F',
    isRange: false,
  },
  note: {
    key: 'note',
    label: 'Note',
    icon: 'document-text-outline',
    color: '#9C8B76',
    isRange: false,
  },
  task: { key: 'task', label: 'Task', icon: 'checkbox-outline', color: '#5B4A3A', isRange: false },
};

export const categoryKeys = Object.keys(bookingCategories) as CategoryKey[];

export function getCategory(key: string): BookingCategory {
  return bookingCategories[key as CategoryKey] ?? bookingCategories.note;
}
