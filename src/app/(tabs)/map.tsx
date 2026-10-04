import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTheme } from '@/theme/ThemeProvider';

export default function MapScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenTitle>Map</ScreenTitle>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        The 3D globe across all your trips arrives in Fase 4 (MapLibre, Apple Maps-style fly-to
        zoom).
      </Text>
    </Screen>
  );
}
