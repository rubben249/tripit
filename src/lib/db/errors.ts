/**
 * The local database is a single-holder resource on web. expo-sqlite's web
 * backend is wa-sqlite over OPFS (`AccessHandlePoolVFS`), which opens exclusive
 * sync access handles on its pool of files, so only one browser context per
 * origin can hold the database at a time.
 *
 * A second tab — or the installed app in the background while a shared-trip link
 * opens in the browser — cannot open it, and every browser words that
 * differently:
 *
 *   Chrome/Edge  NoModificationAllowedError: ... Access Handles cannot be created
 *                if there is another open Access Handle ...
 *   Safari       UnknownError: The operation failed for an unknown transient
 *                reason (e.g. out of memory)
 *   Chrome       (sometimes) the open never settles at all, so the screen spins
 *
 * None of those tell anyone what to do, and Safari's actively misleads: nothing
 * is out of memory. They all become this error instead.
 */
export class DatabaseUnavailableError extends Error {
  constructor(readonly cause?: unknown) {
    super(
      'TripIt is already open somewhere else on this device — another tab, or the app on your home screen. Your trips are safe: close the other one, then reload.',
    );
    this.name = 'DatabaseUnavailableError';
  }
}

const BUSY_SIGNS = [
  'createsyncaccesshandle',
  'nomodificationallowederror',
  'access handles cannot be created',
  'unknownerror',
  'unknown transient reason',
  // What every later call throws once the worker's half-built state is stuck —
  // same cause, so it earns the same explanation. See lib/db/recover.ts.
  'invalid vfs state',
];

/** True when the failure is another context holding the database, not a real fault. */
export function isDatabaseBusyError(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) return true;
  const text = (
    error instanceof Error ? `${error.name} ${error.message}` : String(error)
  ).toLowerCase();
  return BUSY_SIGNS.some((sign) => text.includes(sign));
}

/** The message to put in front of a person, whatever the platform called it. */
export function describeDatabaseError(error: unknown): string {
  if (isDatabaseBusyError(error)) return new DatabaseUnavailableError(error).message;
  return error instanceof Error ? error.message : 'Something went wrong on this device.';
}
