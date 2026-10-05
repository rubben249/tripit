import { Pressable, Text } from 'react-native';
import { Link } from 'expo-router';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { env } from '@/config/env';
import { useTrashedTrips } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  const { data: trashedTrips } = useTrashedTrips();

  return (
    <Screen>
      <ScreenTitle>You</ScreenTitle>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        Account, default currency ({env.defaultCurrency}), notification preferences and the admin
        panel land in later phases.
      </Text>

      <Link href="/trash" asChild>
        <Pressable
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: theme.space.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text style={[theme.type.body, { color: theme.colors.text }]}>Trash</Text>
          <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
            {trashedTrips?.length ?? 0}
          </Text>
        </Pressable>
      </Link>

      <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
        {env.appName} · Fase 2
      </Text>
    </Screen>
  );
}
