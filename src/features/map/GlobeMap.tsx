import { Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import type { GlobeMapProps } from './GlobeMap.types';

/** Native builds: the globe uses MapLibre GL JS, which runs in the browser (GlobeMap.web.tsx).
 * The app is used as a web app/PWA for now; a native map (MapLibre Native needs a custom dev
 * build — it doesn't run in Expo Go) is a later step. */
export function GlobeMap(_props: GlobeMapProps) {
  const theme = useTheme();
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.space.lg }}
    >
      <Text style={[theme.type.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
        The 3D globe is available in the web app for now.
      </Text>
    </View>
  );
}
