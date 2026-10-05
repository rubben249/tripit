import { Text, View } from 'react-native';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { asTaskDetails } from '@/features/bookings/details';
import { useBookings, useDeleteBooking } from '@/features/itinerary/hooks';
import { NoteEditor } from '@/features/notes/NoteEditor';
import { NotePhotos } from '@/features/notes/NotePhotos';
import { TaskCheckbox } from '@/features/tasks/TaskCheckbox';
import { useTheme } from '@/theme/ThemeProvider';

export default function TaskDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();
  const { data: bookings } = useBookings(id);
  const deleteTask = useDeleteBooking(id);
  const { confirm, dialog } = useConfirm();

  const task = bookings?.find((b) => b.id === taskId && b.categoryKey === 'task');
  if (!task) return null;
  const done = asTaskDetails(task.details).done === true;

  const onDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete this task?',
      message: `"${task.title}" will be deleted for good.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    await deleteTask.mutateAsync(task.id);
    router.replace(`/trip/${id}/tasks`);
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: task.title }} />
      <Link href={`/trip/${id}/tasks`} asChild>
        <Button variant="secondary" size="sm" style={{ alignSelf: 'flex-start' }}>
          ‹ All tasks
        </Button>
      </Link>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
        <TaskCheckbox tripId={id} task={task} />
        <Text style={[theme.type.data, { fontSize: 15, color: theme.colors.textMuted }]}>
          {done ? 'DONE' : 'PENDING'}
        </Text>
      </View>

      <NoteEditor
        key={task.id}
        tripId={id}
        booking={task}
        bodyPlaceholder="What needs doing, links, reference numbers…"
      />

      <NotePhotos noteId={task.id} />

      <Button variant="danger" onPress={onDelete}>
        Delete task
      </Button>

      {dialog}
    </Screen>
  );
}
