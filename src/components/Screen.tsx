import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSegments } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  style?: ViewStyle;
}

/**
 * The page frame: background, safe area, the reading column, and the gutter the
 * tab bar needs. Tab screens scroll under a floating bar, so without that gutter
 * the last row of every tab screen sits behind it.
 */
export function Screen({ children, scroll = false, style }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const underTabBar = segments[0] === '(tabs)';

  const padding = {
    padding: theme.space.lg,
    paddingBottom: theme.space.lg + (underTabBar ? theme.layout.tabBarHeight + insets.bottom : 0),
    gap: theme.space.lg,
  };
  const column: ViewStyle = { width: '100%', maxWidth: theme.layout.contentMaxWidth };

  if (scroll) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={styles.scrollCenter}
          showsVerticalScrollIndicator={false}
        >
          <View style={[column, padding, style]}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.center}>
        <View style={[styles.content, column, padding, style]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center' },
  scrollCenter: { alignItems: 'center', flexGrow: 1 },
});
