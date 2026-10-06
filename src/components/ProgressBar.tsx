import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { timing } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The app-wide "something is happening" bar, pinned under the status bar.
 *
 * Every read goes through TanStack Query and every write through a mutation, so
 * the two counters below are a complete answer to "is the app busy?" without a
 * single screen having to report it. The bar advances to 90% on its own and only
 * completes when the work does — a bar that reaches 100% while still waiting
 * teaches people to distrust it.
 */
export function ProgressBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const busy = useIsFetching() + useIsMutating() > 0;

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (busy) {
      opacity.value = withTiming(1, timing(theme.motion.duration.fast));
      progress.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.6, timing(reduced ? 0 : 420)),
        withTiming(0.9, timing(reduced ? 0 : 1400)),
      );
    } else {
      progress.value = withTiming(1, timing(theme.motion.duration.fast));
      opacity.value = withDelay(
        theme.motion.duration.fast,
        withTiming(0, timing(theme.motion.duration.base)),
      );
    }
  }, [busy, progress, opacity, reduced, theme.motion.duration]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: insets.top,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 10,
      }}
    >
      <Animated.View
        style={[
          {
            height: 2,
            backgroundColor: theme.colors.accent,
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
          },
          barStyle,
        ]}
      />
    </View>
  );
}
