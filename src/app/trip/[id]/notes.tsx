import { forwardRef, useState } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useBookings, useCreateBooking } from '@/features/itinerary/hooks';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

/** Free-form notes (bus lines, metro stops, anything worth jotting down) —
 * modeled as bookings with categoryKey 'note' and no day/city, so they're
 * deliberately absent from Itinerary and Reservations. */
export default function NotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bookings } = useBookings(id);
  const createNote = useCreateBooking(id);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const notes = (bookings ?? [])
    .filter((b) => b.categoryKey === 'note')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const onAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const created = await createNote.mutateAsync({
      categoryKey: 'note',
      title: trimmed,
      status: 'idea',
    });
    setTitle('');
    setAdding(false);
    router.push(`/trip/${id}/notes/${created.id}`);
  };

  return (
    <Screen scroll>
      {notes.length === 0 ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          No notes yet — bus lines, metro stops, anything worth jotting down.
        </Text>
      ) : (
        notes.map((note) => (
          <Link key={note.id} href={`/trip/${id}/notes/${note.id}`} asChild>
            <NoteRow title={note.title} preview={note.notes} />
          </Link>
        ))
      )}

      {adding ? (
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          <TextField
            value={title}
            onChangeText={setTitle}
            placeholder="Note title…"
            autoFocus
            onSubmitEditing={onAdd}
            style={{ flex: 1 }}
            name="new-note-title"
          />
          <Button variant="primary" size="sm" onPress={onAdd}>
            Create
          </Button>
          <Button variant="secondary" size="sm" onPress={() => setAdding(false)}>
            Cancel
          </Button>
        </View>
      ) : (
        <Button variant="dashed" fullWidth onPress={() => setAdding(true)}>
          + New note
        </Button>
      )}
    </Screen>
  );
}

const NoteRow = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { title: string; preview: string | null }
>(function NoteRowInner({ title, preview, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      ref={ref}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        gap: 4,
        opacity: pressed ? 0.75 : hovered ? 0.92 : 1,
      })}
      {...pressableProps}
    >
      <Text style={[theme.type.title, { fontSize: 15, color: theme.colors.text }]}>{title}</Text>
      {preview ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {preview}
        </Text>
      ) : null}
    </Pressable>
  );
});
