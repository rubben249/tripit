import { Ionicons } from '@expo/vector-icons';
import { forwardRef, type ComponentProps } from 'react';
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

      <Link href="/trash" asChild>
        <SettingsRow icon="trash-outline" label="Trash" value={trashedTrips?.length ?? 0} />
      </Link>

      <Text style={[theme.type.label, { color: theme.colors.textFaint, textAlign: 'center' }]}>
        {env.appName.toUpperCase()}
      </Text>
    </Screen>
  );
}

const SettingsRow = forwardRef<
  View,
  Omit<PressableProps, 'style'> & {
    label: string;
    hint?: string;
    value?: number;
    icon: ComponentProps<typeof Ionicons>['name'];
  }
>(function SettingsRow({ label, hint, value, icon, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...pressableProps}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        minHeight: 56,
        paddingHorizontal: theme.space.md,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: hovered ? theme.colors.surfaceAlt : theme.colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={theme.colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>{label}</Text>
        {hint ? (
          <Text style={[theme.type.caption, { color: theme.colors.textFaint }]}>{hint}</Text>
        ) : null}
      </View>
      {value != null ? (
        <Text style={[theme.type.data, { fontSize: 13, color: theme.colors.textMuted }]}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
    </Pressable>
  );
});
