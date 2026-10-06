import { useState } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

import { motion } from '@/theme/tokens';

/**
 * Exponential ease-out: fast departure, long settle. Everything that enters or
 * resizes uses this; linear and `ease` both read as mechanical next to it.
 */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
/** For values that leave and come back (a bar that grows and shrinks). */
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export function timing(duration: number): WithTimingConfig {
  return { duration, easing: easeOut };
}

/**
 * Press feedback shared by every pressable surface: a small scale on top of the
 * hover/press tint, spring-driven so an interrupted press (finger lifted early,
 * drag away) resolves from wherever it was instead of jumping.
 *
 * `useReducedMotion` is honored by dropping the scale entirely — the color and
 * opacity feedback still fires, so nothing loses its affordance.
 */
export function usePressFeedback(scale: number = motion.pressScale.control) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const [hovered, setHovered] = useState(false);

  const spring: WithSpringConfig = motion.spring.press;

  // Plain functions, not useCallback: a shared value written inside a memoized
  // callback trips the compiler's immutability rule, and these are cheap anyway.
  const onPressIn = () => {
    pressed.value = withSpring(1, spring);
  };
  const onPressOut = () => {
    pressed.value = withSpring(0, spring);
  };
  const onHoverIn = () => setHovered(true);
  const onHoverOut = () => setHovered(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : 1 - pressed.value * (1 - scale) }],
  }));

  return { animatedStyle, hovered, onPressIn, onPressOut, onHoverIn, onHoverOut };
}

/**
 * Entrance delay for a list: the first few items stagger, the rest arrive
 * together. Without the cap, the twentieth card animates a second after the
 * first and the screen feels slow instead of alive.
 */
export function stagger(index: number, step = 40, max = 6): number {
  return Math.min(index, max) * step;
}

export { withTiming, withSpring };
