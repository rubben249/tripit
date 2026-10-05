// expo-sqlite's web backend (wa-sqlite) ships a .wasm file that Metro
// doesn't know how to bundle by default — without this it fails to resolve
// at import time (not a runtime bug, a missing asset-extension entry).
// See: https://docs.expo.dev/versions/latest/sdk/sqlite/#web-platform-usage
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// Cross-origin isolation lets wa-sqlite use its fastest backend (OPFS +
// SharedArrayBuffer) in local dev. GitHub Pages can't set custom response
// headers for a static site, so production falls back to wa-sqlite's
// slower IndexedDB-based VFS automatically — still correct, just not the
// fastest option. Fine at this app's scale (see CLAUDE.md).
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
