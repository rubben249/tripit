import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { asTaskDetails } from '@/features/bookings/details';
import { useUpdateBooking } from '@/features/itinerary/hooks';
import type { Booking } from '@/features/itinerary/types';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

export function TaskCheckbox({ tripId, task }: { tripId: string; task: Booking }) {
  const theme = useTheme();
  const updateTask = useUpdateBooking(tripId);
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  const done = asTaskDetails(task.details).done === true;

  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={done}
      accessibilityLabel={`Mark "${task.title}" as ${done ? 'pending' : 'done'}`}
      hitSlop={8}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPress={() =>
        updateTask.mutate({ id: task.id, update: { details: { ...task.details, done: !done } } })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : hovered ? 0.8 : 1 })}
    >
      <Ionicons
        name={done ? 'checkbox' : 'square-outline'}
        size={28}
        color={done ? theme.colors.accent : theme.colors.textMuted}
      />
    </Pressable>
  );
}
