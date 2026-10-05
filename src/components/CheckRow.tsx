import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

/** A labelled checkbox row — the whole row is the hit target. */
export function CheckRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.space.md,
        paddingVertical: theme.space.sm,
        opacity: disabled ? 0.45 : pressed ? 0.7 : hovered ? 0.85 : 1,
      })}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={24}
        color={checked ? theme.colors.accent : theme.colors.textMuted}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>{label}</Text>
        {hint ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{hint}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
