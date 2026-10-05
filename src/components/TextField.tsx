import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/** Bordered text input used across every inline "add X" form — the single place to restyle them all. */
export function TextField({ style, name, ...props }: TextInputProps & { name?: string }) {
  const theme = useTheme();

  return (
    <TextInput
      nativeID={name}
      placeholderTextColor={theme.colors.textMuted}
      style={[
        theme.type.body,
        {
          color: theme.colors.text,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
      {...props}
    />
  );
}
