/**
 * Post-processes `expo export --platform web` output for the PWA deploy.
 *
 * `web.output` is 'single' (SPA), and in that mode Expo does not run
 * src/app/+html.tsx — the exported dist/index.html is Expo's own minimal
 * template. So anything the document must carry *before* JavaScript runs has to
 * be put there here: the web app manifest (a <link rel="manifest"> added later
 * by JS is not reliably picked up for installation), the iOS home-screen and
 * standalone meta tags, theme-color for both schemes, and the background CSS
 * that stops a white flash before first paint in dark mode.
 *
 * The manifest is *generated*, not a checked-in file, so nothing about the
 * deployed app has to be edited by hand:
 *
 *   EXPO_PUBLIC_APP_NAME         the installed app's name   (default: brand.json)
 *   EXPO_PUBLIC_APP_SHORT_NAME   home-screen label          (default: the name)
 *   EXPO_PUBLIC_APP_DESCRIPTION  install-prompt description (default: brand.json)
 *   EXPO_BASE_URL                sub-path, when not served from the domain root
 *
 * The two theme colours come from src/config/brand.json, which app.config.ts
 * (native splash) and src/theme/tokens.ts (app background) read as well — one
 * definition, three consumers.
 *
 * Idempotent: running it twice leaves one copy of each tag.
 *
 * Usage: node scripts/postexport-web.mjs [dist-dir]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const distDir = process.argv[2] ?? 'dist';
const indexPath = join(distDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(
    `postexport-web: ${indexPath} not found — run \`expo export --platform web\` first.`,
  );
  process.exit(1);
}

const brand = JSON.parse(readFileSync('src/config/brand.json', 'utf8'));

const name = process.env.EXPO_PUBLIC_APP_NAME || brand.name;
const shortName = process.env.EXPO_PUBLIC_APP_SHORT_NAME || name;
const description = process.env.EXPO_PUBLIC_APP_DESCRIPTION || brand.description;
const backgroundLight = brand.backgroundLight;
const backgroundDark = brand.backgroundDark;

// "" at a domain root (the Netlify deploy), "/<repo>" under a sub-path. Mirrors
// `experiments.baseUrl` in app.config.ts; normalised so it never ends in "/".
const base = (process.env.EXPO_BASE_URL || process.env.EXPO_WEB_BASE_PATH || '').replace(/\/$/, '');
const url = (path) => `${base}${path}`;

// --- the manifest ------------------------------------------------------------

const manifest = {
  name,
  short_name: shortName,
  description,
  start_url: url('/?source=pwa'),
  scope: url('/'),
  display: 'standalone',
  orientation: 'portrait',
  background_color: backgroundLight,
  theme_color: backgroundLight,
  dir: 'ltr',
  icons: [
    { src: url('/pwa-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: url('/pwa-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: url('/pwa-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

writeFileSync(join(distDir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

// --- the head tags -----------------------------------------------------------

const MARKER = '<!-- postexport-web -->';
const END_MARKER = '<!-- /postexport-web -->';

const injection = `${MARKER}
    <link rel="manifest" href="${url('/manifest.webmanifest')}" />
    <link rel="apple-touch-icon" href="${url('/apple-touch-icon.png')}" />
    <meta name="application-name" content="${name}" />
    <meta name="apple-mobile-web-app-title" content="${shortName}" />
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="${backgroundLight}" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="${backgroundDark}" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <style id="tripit-scheme-background">
      body { background-color: ${backgroundLight}; }
      @media (prefers-color-scheme: dark) { body { background-color: ${backgroundDark}; } }
    </style>
    ${END_MARKER}`;

let html = readFileSync(indexPath, 'utf8');

// Drop a previous injection so re-runs don't stack up.
html = html.replace(new RegExp(`\\s*${MARKER}[\\s\\S]*?${END_MARKER}`, 'g'), '');

if (!html.includes('</head>')) {
  console.error('postexport-web: no </head> in the exported index.html — refusing to guess.');
  process.exit(1);
}

html = html.replace('</head>', `  ${injection}\n</head>`);
writeFileSync(indexPath, html);

// --- make sure public/ actually came through ---------------------------------

// The worker and icons are only useful if `expo export` copied public/ over.
// Fail the build rather than ship a PWA that silently isn't one.
const { version: maplibreVersion } = JSON.parse(
  readFileSync('node_modules/maplibre-gl/package.json', 'utf8'),
);

// The MapLibre worker is the one that silently turns the map into a blank
// canvas if it goes missing (see scripts/sync-maplibre-worker.mjs), so it is
// checked by the exact name the app will ask for.
const required = [
  'sw.js',
  'pwa-192.png',
  'pwa-512.png',
  'pwa-maskable-512.png',
  'apple-touch-icon.png',
  `maplibre-gl-worker-${maplibreVersion}.mjs`,
];
const missing = required.filter((file) => !existsSync(join(distDir, file)));
if (missing.length > 0) {
  console.error(`postexport-web: missing from ${distDir}: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(
  `postexport-web: generated manifest for "${name}" and injected head tags into ${indexPath}.`,
);
