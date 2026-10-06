import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { useSetDayNotes } from './hooks';
import type { ItineraryDay } from './types';

/**
 * What the plan says about the day rather than about any one stop — the "a tener
 * en cuenta" of a handwritten itinerary: which bus runs late, what closes on a
 * Saturday, what to carry. It lives on the day, so it never reaches Reservations,
 * which lists only what you actually hold a booking for.
 */
export function DayNotes({ tripId, day }: { tripId: string; day: ItineraryDay }) {
  const theme = useTheme();
  const setNotes = useSetDayNotes(tripId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(day.notes ?? '');
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  const onSave = async () => {
    Keyboard.dismiss();
    const text = draft.trim();
    await setNotes.mutateAsync({ dayId: day.id, notes: text || null });
    setEditing(false);
  };

  const onStart = () => {
    setDraft(day.notes ?? '');
    setEditing(true);
  };

  if (editing) {
    return (
      <View
        style={{
          gap: theme.space.sm,
          padding: theme.space.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.accent,
          backgroundColor: theme.colors.surface,
        }}
      >
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder="Trains run until 22:30 · carry a water bottle · the synagogue closes on Saturdays"
          multiline
          autoFocus
          name="day-notes"
        />
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          <Button
            variant="primary"
            size="sm"
            icon="checkmark"
            loading={setNotes.isPending}
            onPress={onSave}
          >
            Save note
          </Button>
          <Button variant="ghost" size="sm" onPress={() => setEditing(false)}>
            Cancel
          </Button>
        </View>
      </View>
    );
  }

  if (!day.notes) {
    return (
      <Button variant="dashed" size="sm" icon="document-text-outline" onPress={onStart}>
        Add a note for the day
      </Button>
    );
  }

  return (
    <Pressable
      onPress={onStart}
      accessibilityRole="button"
      accessibilityLabel="Edit the note for this day"
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: theme.space.md,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: hovered ? theme.colors.surfaceAlt : theme.colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name="document-text-outline" size={18} color={theme.colors.accent} />
      <Text style={[theme.type.body, { flex: 1, color: theme.colors.text }]}>{day.notes}</Text>
    </Pressable>
  );
}
