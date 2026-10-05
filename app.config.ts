import type { ExpoConfig } from 'expo/config';

const appName = process.env.EXPO_PUBLIC_APP_NAME ?? 'TripIt';

// GitHub Pages serves this as a project site under /tripit/, not at the
// domain root — Expo Router needs to know that at export time so every
// asset/route URL it generates is prefixed correctly. Only the Pages
// deploy workflow sets EXPO_WEB_BASE_PATH; local dev and native builds
// leave it unset and serve from "/" as normal.
const webBasePath = process.env.EXPO_WEB_BASE_PATH ?? '';

const paperLight = '#F6F3EC';
const inkDark = '#0E1626';

const config: ExpoConfig = {
  name: appName,
  slug: 'tripit',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'tripit',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rubben249.tripit',
  },
  android: {
    package: 'com.rubben249.tripit',
    adaptiveIcon: {
      backgroundColor: paperLight,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    // 'single' (SPA) instead of 'static': this app is local-first/client-only
    // with no server-rendered content, and expo-sqlite's web backend needs a
    // Worker that can't be bundled into Expo Router's static pre-render pass.
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: paperLight,
        dark: {
          backgroundColor: inkDark,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    baseUrl: webBasePath,
  },
  extra: {
    eas: {
      projectId: 'b0b548f4-b172-4b89-abbf-e20d7c676a2e',
    },
  },
};

export default config;
