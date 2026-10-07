/**
 * Registers the service worker that keeps the installed PWA current.
 *
 * public/sw.js already calls skipWaiting()/clients.claim(), so a new worker
 * takes control as soon as it installs. The one thing it cannot do from inside
 * the worker is refresh a page whose JavaScript came from the *previous*
 * bundle — so the page listens for the handover and reloads itself once. That
 * is what makes a deploy land on a home-screen icon without reinstalling it.
 */

let reloading = false;

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  // Service workers need a secure context; over plain http (other than
  // localhost) registration throws rather than returning a rejected promise.
  if (!window.isSecureContext) return;

  // A *first* registration also triggers controllerchange when the fresh
  // worker claims the page, and reloading then would be a pointless flash on
  // someone's first visit. Only a handover from one worker to another means
  // "the code you are running is now out of date".
  const hadController = navigator.serviceWorker.controller !== null;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !hadController) return;
    reloading = true;
    window.location.reload();
  });

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        // Catch deploys that land while the app is open or is resumed from the
        // background — without this, an installed PWA can go a long time
        // without asking the server whether sw.js changed.
        const check = () => void registration.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
        window.setInterval(check, 60 * 60 * 1000);
      })
      .catch((error: unknown) => console.warn('Service worker registration failed', error));
  };

  // Registering during startup competes with the first paint's own requests.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
