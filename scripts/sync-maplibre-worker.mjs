/**
 * Copies MapLibre's worker bundle into public/ so the app can serve it itself.
 *
 * MapLibre GL 6 is an ESM-only distribution that locates its worker through
 * `new URL('./maplibre-gl-worker.mjs', import.meta.url)`. Metro has no
 * meaningful `import.meta.url` for a bundled module, so that resolution
 * produces a URL the browser can't fetch and every map dies with "Worker failed
 * to load". Serving the worker from a path we control and handing it to
 * `setWorkerUrl()` (see src/features/map/GlobeMap.web.tsx) side-steps the
 * bundler entirely.
 *
 * Runs on `postinstall` so the file is present for `expo start --web` and for
 * `expo export` alike, locally and on the build server. The MapLibre version
 * goes in the filename: it lets the deploy cache the file immutably, and makes
 * an upgrade impossible to serve stale.
 *
 * public/maplibre-gl-worker-*.mjs is generated — it is gitignored, not vendored.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs';
const PUBLIC_DIR = 'public';

if (!existsSync(PUBLIC_DIR)) {
  console.warn(`sync-maplibre-worker: no ${PUBLIC_DIR}/ directory, skipping.`);
  process.exit(0);
}

if (!existsSync(SOURCE)) {
  // `npm install` ordering, or an install that skipped optional/dev trees. Not
  // worth failing the install over; the export step checks for the file too.
  console.warn(`sync-maplibre-worker: ${SOURCE} not found, skipping.`);
  process.exit(0);
}

const { version } = JSON.parse(readFileSync('node_modules/maplibre-gl/package.json', 'utf8'));
const target = join(PUBLIC_DIR, `maplibre-gl-worker-${version}.mjs`);

for (const file of readdirSync(PUBLIC_DIR)) {
  if (/^maplibre-gl-worker-.*\.mjs$/.test(file) && join(PUBLIC_DIR, file) !== target) {
    unlinkSync(join(PUBLIC_DIR, file));
    console.log(`sync-maplibre-worker: removed stale ${file}`);
  }
}

const source = readFileSync(SOURCE);
if (existsSync(target) && readFileSync(target).equals(source)) {
  console.log(`sync-maplibre-worker: ${target} already current.`);
} else {
  writeFileSync(target, source);
  console.log(`sync-maplibre-worker: wrote ${target}.`);
}
