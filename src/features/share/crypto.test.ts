import { describe, expect, it } from '@jest/globals';

import {
  CODE_LENGTH,
  decryptWithCode,
  encryptForCode,
  formatCode,
  generateCode,
  hashCode,
  normalizeCode,
} from './crypto';

describe('codes', () => {
  it('generates codes of the right length from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    }
  });

  it('normalizes what people type and rejects what cannot be a code', () => {
    expect(normalizeCode('abcd-efgh')).toBe('ABCDEFGH');
    expect(normalizeCode(' ABCD EFGH ')).toBe('ABCDEFGH');
    expect(normalizeCode('ABCD-EFG')).toBeNull();
    expect(normalizeCode('ABCD-EFG0')).toBeNull(); // 0 is not in the alphabet
  });

  it('formats as two groups of four', () => {
    expect(formatCode('ABCDEFGH')).toBe('ABCD-EFGH');
  });

  it('hashes deterministically to 64 hex characters', async () => {
    const a = await hashCode('ABCDEFGH');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashCode('ABCDEFGH')).toBe(a);
    expect(await hashCode('ABCDEFGJ')).not.toBe(a);
  });
});

describe('encryption', () => {
  const trip = JSON.stringify({ name: 'Rome', notes: 'ñ é 日本 ✈', big: 'x'.repeat(50_000) });

  it('round-trips through encrypt and decrypt with the same code', async () => {
    const payload = await encryptForCode('ABCDEFGH', trip);
    expect(payload.startsWith('v1.')).toBe(true);
    expect(payload).not.toContain('Rome');
    expect(await decryptWithCode('ABCDEFGH', payload)).toBe(trip);
  });

  it('fails with a different code', async () => {
    const payload = await encryptForCode('ABCDEFGH', trip);
    await expect(decryptWithCode('ABCDEFGJ', payload)).rejects.toThrow();
  });

  it('rejects payloads in an unknown format', async () => {
    await expect(decryptWithCode('ABCDEFGH', 'v9.gz.xxx')).rejects.toThrow(
      'Unrecognized share format.',
    );
  });
});
