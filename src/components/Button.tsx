import { type ReactNode } from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'danger' | 'dashed';
type Size = 'sm' | 'md';

/**
 * Every pressable action in the app goes through this (or useHoverable
 * directly for custom shapes like cards/pills) so buttons look consistent
 * and give the same hover/press feedback everywhere — see CLAUDE.md
 * "Arquitectura modular y configuración centralizada".
 */
export function Button({
  children,
  onPress,
  disabled,
  variant = 'secondary',
  size = 'md',
  fullWidth,
  style,
  name,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  name?: string;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  const paddingVertical = size === 'sm' ? 6 : theme.space.sm;
  const paddingHorizontal = size === 'sm' ? theme.space.sm : theme.space.md;

  const base: Record<
    Variant,
    { backgroundColor: string; borderColor?: string; textColor: string }
  > = {
    primary: { backgroundColor: theme.colors.ink, textColor: theme.colors.onInk },
    secondary: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
    },
    danger: { backgroundColor: theme.colors.warn, textColor: theme.colors.onInk },
    dashed: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
      textColor: theme.colors.textMuted,
    },
  };
  const palette = base[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      nativeID={name}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.xs,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderRadius: theme.radius.sm,
          paddingVertical,
          paddingHorizontal,
          backgroundColor: palette.backgroundColor,
          borderWidth: palette.borderColor ? 1 : 0,
          borderColor: palette.borderColor,
          borderStyle: variant === 'dashed' ? 'dashed' : 'solid',
          opacity: disabled ? 0.5 : pressed ? 0.75 : hovered ? 0.88 : 1,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            size === 'sm' ? theme.type.caption : theme.type.data,
            { color: palette.textColor },
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
