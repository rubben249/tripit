import { forwardRef } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { Link } from 'expo-router';

import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { env } from '@/config/env';
import { PreferencesSection } from '@/features/settings/PreferencesSection';
import { useSettings } from '@/features/settings/hooks';
import { TravelStatsCard } from '@/features/stats/TravelStatsCard';
import { BackupSection } from '@/features/transfer/BackupSection';
import { useTrashedTrips } from '@/features/trips/hooks';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

export default function YouScreen() {
  const theme = useTheme();
  const { displayName } = useSettings();
  const { data: trashedTrips } = useTrashedTrips();

  return (
    <Screen scroll>
      <ScreenTitle>{displayName ? `Hi, ${displayName}` : 'You'}</ScreenTitle>

      <TravelStatsCard />

      <PreferencesSection />

      <BackupSection />

      <Link href="/receive" asChild>
        <SettingsRow label="Receive a shared trip" />
      </Link>

      <Link href="/trash" asChild>
        <SettingsRow label="Trash" value={trashedTrips?.length ?? 0} />
      </Link>

      <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>{env.appName}</Text>
    </Screen>
  );
}

const SettingsRow = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { label: string; value?: number }
>(function SettingsRow({ label, value, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.sm,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      <Text style={[theme.type.body, { color: theme.colors.text }]}>{label}</Text>
      <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>{value ?? '›'}</Text>
    </Pressable>
  );
});
