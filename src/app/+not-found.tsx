import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[theme.type.headline, { color: theme.colors.text }]}>
          This screen doesn&rsquo;t exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[theme.type.body, { color: theme.colors.accent }]}>Go to My trips</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  link: {
    paddingVertical: 15,
  },
});
