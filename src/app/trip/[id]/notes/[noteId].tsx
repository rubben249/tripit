import { useState } from 'react';
import { View } from 'react-native';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useBookings, useDeleteBooking, useUpdateBooking } from '@/features/itinerary/hooks';
import type { Booking } from '@/features/itinerary/types';
import { useTheme } from '@/theme/ThemeProvider';

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id, noteId } = useLocalSearchParams<{ id: string; noteId: string }>();
  const { data: bookings } = useBookings(id);
  const deleteNote = useDeleteBooking(id);
  const { confirm, dialog } = useConfirm();

  const note = bookings?.find((b) => b.id === noteId && b.categoryKey === 'note');
  if (!note) return null;

  const onDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete this note?',
      message: `"${note.title}" will be deleted for good.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    await deleteNote.mutateAsync(note.id);
    router.replace(`/trip/${id}/notes`);
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: note.title }} />
      <Link href={`/trip/${id}/notes`} asChild>
        <Button variant="secondary" size="sm" style={{ alignSelf: 'flex-start' }}>
          ‹ All notes
        </Button>
      </Link>

      {/* Keyed by note id: switching notes (even without a full remount from
          navigation) resets the editor's local state from the new note's
          fields instead of needing an effect to sync it. */}
      <NoteEditor key={note.id} tripId={id} note={note} />

      <Button variant="danger" onPress={onDelete}>
        Delete note
      </Button>

      {dialog}
    </Screen>
  );
}

function NoteEditor({ tripId, note }: { tripId: string; note: Booking }) {
  const theme = useTheme();
  const updateNote = useUpdateBooking(tripId);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.notes ?? '');

  const onSaveTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== note.title) {
      updateNote.mutate({ id: note.id, update: { title: trimmed } });
    }
  };

  const onSaveBody = () => {
    if (body !== (note.notes ?? '')) {
      updateNote.mutate({ id: note.id, update: { notes: body } });
    }
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <TextField
        value={title}
        onChangeText={setTitle}
        onBlur={onSaveTitle}
        placeholder="Title"
        style={{ fontFamily: theme.fontFamily.bodySemiBold, fontSize: 18 }}
        name="note-title"
      />
      <TextField
        value={body}
        onChangeText={setBody}
        onBlur={onSaveBody}
        placeholder="Bus lines, metro stops, anything worth jotting down…"
        multiline
        style={{ minHeight: 280, textAlignVertical: 'top' }}
        name="note-body"
      />
    </View>
  );
}
