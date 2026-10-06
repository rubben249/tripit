import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Names a block inside a screen — one step below `ScreenTitle`, never the same
 * size as it. Headings take more space above than below so the block they open
 * reads as attached to them.
 */
export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: string;
  hint?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs, marginTop: theme.space.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space.md,
        }}
      >
        <Text
          accessibilityRole="header"
          style={[theme.type.section, { color: theme.colors.text, flexShrink: 1 }]}
        >
          {children}
        </Text>
        {action}
      </View>
      {hint ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Small uppercase label above a field or a group of rows. */
export function FieldLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
      {children.toUpperCase()}
    </Text>
  );
}
