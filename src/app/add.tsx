import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTheme } from '@/theme/ThemeProvider';

export default function AddModal() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenTitle>Add</ScreenTitle>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        Quick-add an expense, document, itinerary step or note — wired up as each feature lands
        (Fase 2 onward).
      </Text>
    </Screen>
  );
}
