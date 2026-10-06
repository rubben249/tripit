import type { ExpoConfig } from 'expo/config';

const appName = process.env.EXPO_PUBLIC_APP_NAME ?? 'TripIt';

// Set EXPO_WEB_BASE_PATH only when the web app is served under a sub-path
// (e.g. a GitHub Pages *project* site, /<repo>/) — Expo Router then prefixes
// every asset/route URL it generates. The current deploy is the org's root
// site (tripit-app.github.io), so it's unset everywhere and the app serves
// from "/".
const webBasePath = process.env.EXPO_WEB_BASE_PATH ?? '';

const paperLight = '#F7F1E6';
const inkDark = '#17110B';

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
    bundleIdentifier: 'com.tripitapp.tripit',
  },
  android: {
    package: 'com.tripitapp.tripit',
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
      'expo-image-picker',
      {
        photosPermission: 'TripIt uses your photos to attach them to trip notes.',
      },
    ],
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
