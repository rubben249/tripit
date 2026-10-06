import { Platform } from 'react-native';

import { resetDb } from './client';

/**
 * Recovering from a database that another browser context held needs a new page,
 * not a new query.
 *
 * expo-sqlite's web worker assigns its wa-sqlite instance *before* it creates the
 * VFS (`maybeInitAsync` in expo-sqlite/web/worker.ts). When the VFS fails because
 * another tab owns the OPFS access handles, that half-built state is never rolled
 * back, so every later call skips initialization and throws `Invalid VFS state`
 * for as long as the worker lives — which is as long as the page lives. Retrying
 * in place cannot work; reloading starts a fresh worker.
 *
 * Native has no such constraint, so there a retry is just a retry.
 */
export function recoverFromDatabaseError(retry?: () => void): void {
  resetDb();
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.reload();
    return;
  }
  retry?.();
}
