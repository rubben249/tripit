import { Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/** The one `headline` on a screen: it names the screen, and nothing else uses that step. */
export function ScreenTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs }}>
      <Text accessibilityRole="header" style={[theme.type.headline, { color: theme.colors.text }]}>
        {children}
      </Text>
      {subtitle ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
