import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/** Bordered text input used across every inline "add X" form — the single place to restyle them all. */
export function TextField({
  style,
  name,
  onFocus,
  onBlur,
  multiline,
  ...props
}: TextInputProps & { name?: string }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      nativeID={name}
      placeholderTextColor={theme.colors.textFaint}
      selectionColor={theme.colors.accent}
      multiline={multiline}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        theme.type.body,
        {
          color: theme.colors.text,
          borderColor: focused ? theme.colors.accent : theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.md,
          minHeight: multiline ? 88 : 48,
          backgroundColor: theme.colors.surface,
          textAlignVertical: multiline ? 'top' : 'center',
          // Focus is drawn, not outlined: react-native-web's default outline is
          // the browser's, in a color this palette never chose.
          boxShadow: focused ? `0px 0px 0px 3px ${theme.colors.accentSoft}` : undefined,
        },
        style,
      ]}
      {...props}
    />
  );
}
