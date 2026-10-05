import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTheme } from '@/theme/ThemeProvider';

export default function TripsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenTitle>My trips</ScreenTitle>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        No trips yet — this is where Ongoing, Upcoming, Drafts and Past trips will live (Fase 2).
      </Text>
    </Screen>
  );
}
