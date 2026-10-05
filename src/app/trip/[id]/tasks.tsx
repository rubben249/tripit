import { forwardRef, useState } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { asTaskDetails } from '@/features/bookings/details';
import { useBookings, useCreateBooking } from '@/features/itinerary/hooks';
import { TaskCheckbox } from '@/features/tasks/TaskCheckbox';
import { sortTasks } from '@/features/tasks/sortTasks';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

/** Per-trip to-do list — modeled as bookings with categoryKey 'task' and no day/city, like notes,
 * so they stay out of Itinerary, Reservations and Expenses. */
export default function TasksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bookings } = useBookings(id);
  const createTask = useCreateBooking(id);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const tasks = sortTasks((bookings ?? []).filter((b) => b.categoryKey === 'task'));
  const doneCount = tasks.filter((t) => asTaskDetails(t.details).done).length;

  const onAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const created = await createTask.mutateAsync({
      categoryKey: 'task',
      title: trimmed,
      status: 'idea',
      details: { done: false },
    });
    setTitle('');
    setAdding(false);
    router.push(`/trip/${id}/tasks/${created.id}`);
  };

  // Avoid flashing the empty-state text while the local database is still opening.
  if (!bookings) return null;

  return (
    <Screen scroll>
      {tasks.length === 0 ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          No tasks yet — things to get done before or during the trip.
        </Text>
      ) : (
        <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
          {doneCount} of {tasks.length} done
        </Text>
      )}

      {tasks.map((task) => {
        const done = asTaskDetails(task.details).done === true;
        return (
          <View
            key={task.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.md,
              paddingLeft: theme.space.md,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
          >
            <TaskCheckbox tripId={id} task={task} />
            <Link href={`/trip/${id}/tasks/${task.id}`} asChild>
              <TaskRowLink title={task.title} preview={task.notes} done={done} />
            </Link>
          </View>
        );
      })}

      {adding ? (
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          <TextField
            value={title}
            onChangeText={setTitle}
            placeholder="Task title…"
            autoFocus
            onSubmitEditing={onAdd}
            style={{ flex: 1 }}
            name="new-task-title"
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
          + New task
        </Button>
      )}
    </Screen>
  );
}

const TaskRowLink = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { title: string; preview: string | null; done: boolean }
>(function TaskRowLinkInner({ title, preview, done, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: theme.space.md,
        paddingRight: theme.space.md,
        gap: 4,
        opacity: pressed ? 0.75 : hovered ? 0.92 : 1,
      })}
    >
      <Text
        style={[
          theme.type.title,
          {
            fontSize: 17,
            color: done ? theme.colors.textMuted : theme.colors.text,
            textDecorationLine: done ? 'line-through' : 'none',
          },
        ]}
      >
        {title}
      </Text>
      {preview ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {preview}
        </Text>
      ) : null}
    </Pressable>
  );
});
