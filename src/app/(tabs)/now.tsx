import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTheme } from '@/theme/ThemeProvider';

export default function NowScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenTitle>Now / Next</ScreenTitle>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        Only shown with a trip in progress — what&rsquo;s happening now, what&rsquo;s next, and how
        long until it (Fase 2).
      </Text>
    </Screen>
  );
}
