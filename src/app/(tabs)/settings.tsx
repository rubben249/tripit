import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { env } from '@/config/env';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenTitle>You</ScreenTitle>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        Account, default currency ({env.defaultCurrency}), notification preferences and the admin
        panel land in later phases.
      </Text>
      <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
        {env.appName} · Fase 1
      </Text>
    </Screen>
  );
}
