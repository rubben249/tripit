import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/**
 * Single source of truth for booking categories (icon, color, label) — used
 * by the itinerary, the map, expenses and notifications alike. See
 * CLAUDE.md "Arquitectura modular y configuración centralizada". Colors stay
 * inside the Atlas Blue family (see src/theme/tokens.ts); categories are
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
    color: '#3E5C7E',
    isRange: false,
  },
  train: { key: 'train', label: 'Train', icon: 'train-outline', color: '#1C2B45', isRange: false },
  bus: {
    key: 'bus',
    label: 'Bus / transfer',
    icon: 'bus-outline',
    color: '#5B7A99',
    isRange: false,
  },
  local_transport: {
    key: 'local_transport',
    label: 'Local transport',
    icon: 'swap-horizontal-outline',
    color: '#7A93AC',
    isRange: false,
  },
  car_rental: {
    key: 'car_rental',
    label: 'Car rental',
    icon: 'car-outline',
    color: '#425A72',
    isRange: true,
  },
  boat_ferry: {
    key: 'boat_ferry',
    label: 'Boat / ferry',
    icon: 'boat-outline',
    color: '#4F7585',
    isRange: false,
  },
  accommodation: {
    key: 'accommodation',
    label: 'Accommodation',
    icon: 'bed-outline',
    color: '#B8893B',
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
    color: '#6B5B95',
    isRange: false,
  },
  sightseeing: {
    key: 'sightseeing',
    label: 'Sightseeing',
    icon: 'camera-outline',
    color: '#90A4BC',
    isRange: false,
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping',
    icon: 'bag-outline',
    color: '#A68A64',
    isRange: false,
  },
  leisure: {
    key: 'leisure',
    label: 'Leisure',
    icon: 'happy-outline',
    color: '#5C8374',
    isRange: false,
  },
  note: {
    key: 'note',
    label: 'Note',
    icon: 'document-text-outline',
    color: '#8A94A3',
    isRange: false,
  },
  task: { key: 'task', label: 'Task', icon: 'checkbox-outline', color: '#5B6B82', isRange: false },
};

export const categoryKeys = Object.keys(bookingCategories) as CategoryKey[];

export function getCategory(key: string): BookingCategory {
  return bookingCategories[key as CategoryKey] ?? bookingCategories.note;
}
