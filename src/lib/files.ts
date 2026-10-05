/** Native builds don't save/open backup files yet — the app is used as a web app/PWA for now
 * (see files.web.ts). Kept as the same API so screens just check `filesSupported`. */
export const filesSupported = false;

export function downloadJson(_filename: string, _data: unknown): void {
  throw new Error('Backups are only available in the web app for now.');
}

export function pickJsonFile(): Promise<unknown> {
  return Promise.reject(new Error('Backups are only available in the web app for now.'));
}
