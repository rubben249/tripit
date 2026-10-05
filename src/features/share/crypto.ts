/**
 * End-to-end encryption for shared trips, with the browser's WebCrypto. The short code is the
 * only secret: the server stores a hash of it (to find the share) and the ciphertext (which only
 * that code decrypts) — never the code itself, the key, or the trip.
 *
 * 8 characters from a 31-letter alphabet ≈ 8.5·10¹¹ codes; a share lives 3 minutes, so guessing
 * one is out of reach. Characters that read alike (0/O, 1/I/L) are left out so the code survives
 * being read aloud or copied by hand.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;

const HASH_PREFIX = 'tripit-share:';
const KEY_SALT = 'tripit-share-key-v1';
const PBKDF2_ITERATIONS = 150_000;

/** Is WebCrypto available? It is in every modern browser over HTTPS (and on localhost); React
 * Native doesn't ship it, so sharing is web-only for now. */
export function shareCryptoSupported(): boolean {
  return typeof globalThis.crypto?.subtle !== 'undefined';
}

/** Uniform random code — bytes ≥ 248 are rejected so every letter is equally likely
 * (256 isn't a multiple of 31). */
export function generateCode(): string {
  let code = '';
  while (code.length < CODE_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    for (const b of bytes) {
      if (b >= 248) continue;
      code += ALPHABET[b % ALPHABET.length];
      if (code.length === CODE_LENGTH) break;
    }
  }
  return code;
}

/** Accepts what people actually type — lowercase, spaces, the dash shown in "ABCD-EFGH" — and
 * returns the bare code, or null if it can't be one. */
export function normalizeCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== CODE_LENGTH) return null;
  return [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(HASH_PREFIX + code);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

async function deriveKey(code: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(code),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(KEY_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Trip JSON compresses ~5-10× (photos far less), which keeps shares small on the free tier. */
const canCompress = () => typeof CompressionStream !== 'undefined';

/** "v1.<gz|raw>.<base64 of iv‖ciphertext>" */
export async function encryptForCode(code: string, plaintext: string): Promise<string> {
  const raw = new TextEncoder().encode(plaintext);
  const compressed = canCompress();
  const body = compressed ? await pipe(raw, new CompressionStream('gzip')) : raw;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(code);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, body));
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv);
  packed.set(cipher, iv.length);
  return `v1.${compressed ? 'gz' : 'raw'}.${toBase64(packed)}`;
}

/** Throws if the payload wasn't encrypted with this code (AES-GCM authenticates it). */
export async function decryptWithCode(code: string, payload: string): Promise<string> {
  const [version, encoding, data] = payload.split('.');
  if (version !== 'v1' || !data || (encoding !== 'gz' && encoding !== 'raw')) {
    throw new Error('Unrecognized share format.');
  }
  const packed = fromBase64(data);
  const key = await deriveKey(code);
  const body = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: packed.subarray(0, 12) },
      key,
      packed.subarray(12),
    ),
  );
  const raw = encoding === 'gz' ? await pipe(body, new DecompressionStream('gzip')) : body;
  return new TextDecoder().decode(raw);
}
