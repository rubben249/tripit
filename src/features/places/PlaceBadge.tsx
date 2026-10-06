import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

/** A place's number — or, once marked as seen, a quiet check. Same look as the place's
 * marker on the map, so the two read as one thing. Pass `onToggle` to make it the seen switch. */
export function PlaceBadge({
  number,
  seen,
  title,
  onToggle,
  size = 28,
}: {
  number: number;
  seen: boolean;
  title: string;
  onToggle?: () => void;
  size?: number;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  const disc = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: seen ? theme.map.placeSeen : theme.map.place,
        borderWidth: 2,
        borderColor: theme.map.cityHalo,
      }}
    >
      {seen ? (
        <Ionicons name="checkmark" size={size * 0.6} color={theme.map.placeSeenMark} />
      ) : (
        <Text
          style={{
            fontFamily: theme.fontFamily.bodyBold,
            fontSize: size * 0.43,
            color: theme.map.placeText,
          }}
        >
          {number}
        </Text>
      )}
    </View>
  );

  if (!onToggle) return disc;
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={seen}
      accessibilityLabel={`${title}: ${seen ? 'seen — tap to unmark' : `place ${number}, tap to mark as seen`}`}
      hitSlop={6}
      onPress={onToggle}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : hovered ? 0.8 : 1,
        transform: [{ scale: hovered ? 1.08 : 1 }],
      })}
    >
      {disc}
    </Pressable>
  );
}
