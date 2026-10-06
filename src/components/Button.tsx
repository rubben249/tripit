import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressFeedback } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'danger' | 'dashed' | 'ghost';
type Size = 'sm' | 'md';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Every pressable action in the app goes through this (or useHoverable
 * directly for custom shapes like cards/pills) so buttons look consistent
 * and give the same hover/press feedback everywhere — see CLAUDE.md
 * "Arquitectura modular y configuración centralizada".
 *
 * It owns the five states a control has to have: rest, hover, press, focus
 * (keyboard, drawn as a ring because react-native-web's default outline is
 * unthemed), disabled, and loading.
 */
export function Button({
  children,
  onPress,
  disabled,
  loading,
  variant = 'secondary',
  size = 'md',
  icon,
  iconEnd,
  fullWidth,
  align = 'center',
  style,
  name,
  accessibilityLabel,
}: {
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  icon?: ComponentProps<typeof Ionicons>['name'];
  iconEnd?: ComponentProps<typeof Ionicons>['name'];
  fullWidth?: boolean;
  align?: 'center' | 'start';
  style?: StyleProp<ViewStyle>;
  name?: string;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const press = usePressFeedback();
  const [focused, setFocused] = useState(false);

  const inactive = disabled || loading;
  const paddingVertical = size === 'sm' ? theme.space.sm : 14;
  const iconOnly = typeof children === 'string' && children.length === 0;
  const paddingHorizontal = iconOnly
    ? theme.space.sm
    : size === 'sm'
      ? theme.space.md
      : theme.space.lg;
  const minHeight = size === 'sm' ? 36 : 48;
  const fontSize = size === 'sm' ? 13 : 15;
  const iconSize = size === 'sm' ? 15 : 17;

  const base: Record<
    Variant,
    { backgroundColor: string; hoverColor?: string; borderColor?: string; textColor: string }
  > = {
    primary: {
      backgroundColor: theme.colors.solid,
      hoverColor: theme.scheme === 'dark' ? theme.colors.mist : theme.colors.steel,
      textColor: theme.colors.onSolid,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      hoverColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
    },
    danger: { backgroundColor: theme.colors.warn, textColor: theme.colors.onInk },
    dashed: {
      backgroundColor: 'transparent',
      hoverColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
      textColor: theme.colors.textMuted,
    },
    ghost: {
      backgroundColor: 'transparent',
      hoverColor: theme.colors.surfaceAlt,
      textColor: theme.colors.text,
    },
  };
  const palette = base[variant];
  const labelColor = palette.textColor;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={inactive}
      nativeID={name}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : name)}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onHoverIn={press.onHoverIn}
      onHoverOut={press.onHoverOut}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        press.animatedStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: align === 'start' ? 'flex-start' : 'center',
          gap: theme.space.sm,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderRadius: theme.radius.sm,
          minHeight,
          paddingVertical,
          paddingHorizontal,
          backgroundColor:
            press.hovered && !inactive && palette.hoverColor
              ? palette.hoverColor
              : palette.backgroundColor,
          borderWidth: palette.borderColor ? 1 : 0,
          borderColor: palette.borderColor,
          borderStyle: variant === 'dashed' ? 'dashed' : 'solid',
          opacity: disabled ? 0.45 : 1,
          // Keyboard focus: a ring in the palette, since react-native-web's own
          // outline is the browser default and belongs to no design system.
          boxShadow: focused ? `0px 0px 0px 2px ${theme.colors.focus}` : undefined,
          ...(variant === 'primary' && !inactive ? theme.elevation.raised : null),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : icon ? (
        <Ionicons name={icon} size={iconSize} color={labelColor} />
      ) : null}
      {typeof children === 'string' && children.length > 0 ? (
        <Text
          numberOfLines={1}
          style={[
            theme.type.data,
            { fontSize, letterSpacing: 0.2, color: labelColor, flexShrink: 1 },
          ]}
        >
          {children}
        </Text>
      ) : typeof children === 'string' ? null : (
        children
      )}
      {iconEnd && !loading ? (
        <>
          {align === 'start' ? <View style={{ flex: 1 }} /> : null}
          <Ionicons name={iconEnd} size={iconSize} color={labelColor} />
        </>
      ) : null}
    </AnimatedPressable>
  );
}
