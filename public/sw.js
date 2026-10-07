/**
 * Service worker for the web/PWA build.
 *
 * It exists for one reason above all: a deploy must reach a home-screen icon
 * without the user deleting and re-adding it. So the rules are
 *
 *   * the HTML shell is NEVER served from cache while the network answers —
 *     it is the only file that names the current bundle hashes, so a stale
 *     shell is exactly the "app frozen on an old version" bug;
 *   * everything under /_expo/static/ and /assets/ is content-hashed by the
 *     Expo/Metro export, so it is immutable and safe to serve from cache
 *     forever — a new deploy simply asks for new filenames;
 *   * a new worker takes over immediately (skipWaiting + clients.claim) and
 *     the page reloads once under it, instead of waiting for every tab to
 *     close — which on an iOS home-screen app may be never.
 *
 * Bump CACHE when the logic in this file changes; the activate handler then
 * drops every older cache. (Asset *content* needs no bump — the hashes do it.)
 */

const CACHE = 'tripit-v1';
const SHELL = '/index.html';

/** Content-hashed output of `expo export` — immutable, cache-first. */
function isImmutableAsset(url) {
  return url.pathname.startsWith('/_expo/static/') || url.pathname.startsWith('/assets/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Pre-seed the shell so the first offline launch works. `reload` bypasses
      // the HTTP cache so we never bake a stale shell into the new worker.
      await cache.add(new Request(SHELL, { cache: 'reload' })).catch(() => {});
      // Don't sit in "waiting" — see the header comment.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only ever touch our own origin: Supabase, the tile server and the
  // geocoding/currency APIs must stay uncached and unmediated.
  if (url.origin !== self.location.origin) return;

  // Navigations (and the shell itself): network first, cache only as the
  // offline fallback.
  if (request.mode === 'navigate' || url.pathname === SHELL) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(SHELL, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(SHELL);
          if (cached) return cached;
          throw new Error('offline and no cached shell');
        }
      })(),
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      })(),
    );
    return;
  }

  // Everything else same-origin (manifest, icons, favicon): network first with
  // a cached fallback, so none of it can pin the app to an old version.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error('offline and not cached');
      }
    })(),
  );
});
