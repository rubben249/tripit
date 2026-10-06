import { describe, expect, it } from '@jest/globals';

import { DatabaseUnavailableError, describeDatabaseError, isDatabaseBusyError } from './errors';

describe('isDatabaseBusyError', () => {
  it('recognises how each browser words a database held by another context', () => {
    expect(
      isDatabaseBusyError(
        new Error(
          "NoModificationAllowedError: Failed to execute 'createSyncAccessHandle' on 'FileSystemFileHandle': Access Handles cannot be created if there is another open Access Handle or Writable stream associated with the same file.",
        ),
      ),
    ).toBe(true);
    expect(
      isDatabaseBusyError(
        new Error(
          'UnknownError: The operation failed for an unknown transient reason (e.g. out of memory)',
        ),
      ),
    ).toBe(true);
    expect(isDatabaseBusyError(new Error('Invalid VFS state'))).toBe(true);
    expect(isDatabaseBusyError(new DatabaseUnavailableError())).toBe(true);
  });

  it('leaves real faults alone', () => {
    expect(isDatabaseBusyError(new Error('UNIQUE constraint failed: trips.id'))).toBe(false);
    expect(isDatabaseBusyError(new Error('Network request failed'))).toBe(false);
  });
});

describe('describeDatabaseError', () => {
  it('explains the conflict instead of repeating the platform wording', () => {
    const message = describeDatabaseError(new Error('UnknownError: out of memory'));
    expect(message).toContain('already open somewhere else');
    expect(message).not.toContain('memory');
  });

  it('passes other messages through', () => {
    expect(describeDatabaseError(new Error('Disk is full'))).toBe('Disk is full');
  });
});
