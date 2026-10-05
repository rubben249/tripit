import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { forwardRef } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';

import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

/** A trip's name as a link to the whole trip — the way into "all the info" from the map. */
export function TripNameLink({
  tripId,
  name,
  large,
}: {
  tripId: string;
  name: string;
  large?: boolean;
}) {
  return (
    <Link href={`/trip/${tripId}`} asChild>
      <TripNamePressable name={name} large={large} />
    </Link>
  );
}

const TripNamePressable = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { name: string; large?: boolean }
>(function TripNamePressableInner({ name, large, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      accessibilityRole="link"
      accessibilityLabel={`Open ${name}`}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        marginRight: theme.space.xl,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={[
          large ? theme.type.headline : theme.type.title,
          {
            fontSize: large ? 22 : 16,
            lineHeight: large ? 28 : 22,
            color: theme.colors.accent,
            textDecorationLine: hovered ? 'underline' : 'none',
          },
        ]}
      >
        {name}
      </Text>
      <Ionicons name="chevron-forward" size={large ? 20 : 16} color={theme.colors.accent} />
    </Pressable>
  );
});
