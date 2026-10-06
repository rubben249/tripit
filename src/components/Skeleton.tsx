import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { easeInOut } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Placeholder block for content that is loading. It breathes between two tones
 * of the palette rather than sweeping a white gradient across itself: the sweep
 * is a different design language from this one, and it reads as a wet surface
 * on paper tones.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: easeInOut }), -1, true);
  }, [pulse, reduced]);

  const style = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.45 }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.surfaceAlt,
        },
        style,
      ]}
    />
  );
}

/** The trips list while the database opens: same rhythm as the real cards. */
export function TripCardSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.borderSoft,
        padding: theme.space.md,
        gap: theme.space.sm,
      }}
    >
      <Skeleton width="62%" height={20} />
      <Skeleton width="38%" height={13} />
      <Skeleton width="24%" height={11} />
    </View>
  );
}
