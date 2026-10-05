import { exportTrip } from '@/features/transfer/api';
import { bundleSchema, type DataBundle } from '@/features/transfer/bundle';
import { filterForShare, type ShareOptions } from '@/features/transfer/shareFilter';
import { supabase } from '@/lib/supabase';

import { decryptWithCode, encryptForCode, generateCode, hashCode } from './crypto';

/** PostgREST answers PGRST202 when the RPC doesn't exist — the share migration isn't applied. */
function serverError(error: { code?: string; message: string }): Error {
  if (error.code === 'PGRST202') return new Error("Sharing isn't set up on the server yet.");
  return new Error(error.message);
}

export interface CreatedShare {
  code: string;
  expiresAt: Date;
}

/** Thrown when a code doesn't match a live share — mistyped, or its 3 minutes are up. */
export class ShareNotFoundError extends Error {
  constructor() {
    super('That code is not valid or has expired.');
  }
}

/** Packs the chosen parts of a trip, encrypts them on-device and parks the ciphertext on the
 * server for 3 minutes (see supabase/migrations/…_share_sessions.sql). */
export async function createShare(
  tripId: string,
  options: ShareOptions,
  sharedBy: string,
): Promise<CreatedShare> {
  const bundle: DataBundle = {
    format: 'tripit',
    version: 1,
    kind: 'share',
    exportedAt: new Date().toISOString(),
    sharedBy: sharedBy || undefined,
    tables: filterForShare(await exportTrip(tripId), options),
  };
  const code = generateCode();
  const payload = await encryptForCode(code, JSON.stringify(bundle));
  const { data, error } = await supabase.rpc('create_share', {
    p_code_hash: await hashCode(code),
    p_payload: payload,
  });
  if (error) throw serverError(error);
  return { code, expiresAt: new Date(data as string) };
}

export async function fetchShare(code: string): Promise<DataBundle> {
  const { data, error } = await supabase.rpc('claim_share', { p_code_hash: await hashCode(code) });
  if (error) throw serverError(error);
  if (typeof data !== 'string') throw new ShareNotFoundError();
  const parsed = bundleSchema.safeParse(JSON.parse(await decryptWithCode(code, data)));
  if (!parsed.success || parsed.data.kind !== 'share' || parsed.data.tables.trips.length !== 1) {
    throw new Error('That share could not be read.');
  }
  return parsed.data;
}
