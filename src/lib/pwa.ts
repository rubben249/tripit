/** Native builds get their updates from the store/OTA channel, not a service
 * worker — see pwa.web.ts for the web/PWA implementation. */
export function registerServiceWorker(): void {}
