import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { useDeleteBooking, useGeneralNotes } from '@/features/itinerary/hooks';
import { NoteEditor } from '@/features/notes/NoteEditor';
import { NotePhotos } from '@/features/notes/NotePhotos';
import { NoteScopeTag } from '@/features/notes/NotesFeed';

/** A general note — one that belongs to no trip, created from the Now tab. */
export default function GeneralNoteScreen() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const { data: notes } = useGeneralNotes();
  const deleteNote = useDeleteBooking(null);
  const { confirm, dialog } = useConfirm();

  const note = notes?.find((n) => n.id === noteId);
  if (!note) return null;

  const onDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete this note?',
      message: `"${note.title}" will be deleted for good.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    await deleteNote.mutateAsync(note.id);
    router.replace('/now');
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: note.title }} />
      <Link href="/now" asChild>
        <Button variant="ghost" size="sm" icon="chevron-back" style={{ alignSelf: 'flex-start' }}>
          Now
        </Button>
      </Link>

      <NoteScopeTag />
      <NoteEditor
        key={note.id}
        tripId={null}
        booking={note}
        bodyPlaceholder="Ideas, packing reminders, anything not tied to one trip…"
      />

      <NotePhotos noteId={note.id} />

      <Button variant="danger" onPress={onDelete}>
        Delete note
      </Button>

      {dialog}
    </Screen>
  );
}
