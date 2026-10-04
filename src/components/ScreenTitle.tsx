import { Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function ScreenTitle({ children }: { children: string }) {
  const theme = useTheme();

  return <Text style={[theme.type.headline, { color: theme.colors.text }]}>{children}</Text>;
}
