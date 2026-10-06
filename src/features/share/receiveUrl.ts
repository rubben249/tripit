import { Platform } from 'react-native';

import { env } from '@/config/env';

/**
 * Addresses only the device running the app can resolve. A QR built from one of
 * these sends the other phone to itself (or nowhere), which is exactly what
 * happened when the share code was generated from a dev server.
 */
function isReachableByOthers(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '0.0.0.0' || host === '::1') return false;
  if (host.endsWith('.local')) return false;
  if (/^127\./.test(host)) return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return true;
}

/** True when `origin` is an http(s) address another device on another network could open. */
export function isPublicOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return isReachableByOthers(url.hostname);
  } catch {
    return false;
  }
}

function currentOrigin(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return window.location.origin;
}

/**
 * The base a share link is built on. It is the current origin only when that
 * origin is one a stranger's phone can reach; otherwise it is the app's public
 * address, which is the whole point of `EXPO_PUBLIC_WEB_URL`.
 *
 * Native never contributes an origin: a `tripit://` deep link is not something a
 * camera app will open, and the receiving phone may not have the app at all. The
 * share bundle lives in Supabase for three minutes, so the public web app can
 * fetch the same code the sharing device just created, whatever that device is.
 */
export function shareBaseUrl(origin: string = currentOrigin()): string {
  return origin && isPublicOrigin(origin) ? `${origin}${env.webBaseUrl}` : env.publicWebUrl;
}

/** The link a phone camera opens straight into the Receive screen, code filled in. */
export function receiveUrl(code: string, origin: string = currentOrigin()): string {
  return `${shareBaseUrl(origin)}/receive?code=${code}`;
}

/** Host shown under the QR so it is obvious where scanning will land. */
export function shareHost(origin: string = currentOrigin()): string {
  try {
    return new URL(shareBaseUrl(origin)).host;
  } catch {
    return '';
  }
}
