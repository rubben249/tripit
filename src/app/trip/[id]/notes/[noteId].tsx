import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { useBookings, useDeleteBooking } from '@/features/itinerary/hooks';
import { NoteEditor } from '@/features/notes/NoteEditor';
import { NotePhotos } from '@/features/notes/NotePhotos';

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

      <NoteEditor
        key={note.id}
        tripId={id}
        booking={note}
        bodyPlaceholder="Bus lines, metro stops, anything worth jotting down…"
      />

      <NotePhotos noteId={note.id} />

      <Button variant="danger" onPress={onDelete}>
        Delete note
      </Button>

      {dialog}
    </Screen>
  );
}
