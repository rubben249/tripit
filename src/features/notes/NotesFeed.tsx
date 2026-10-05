import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useBookingsForTrips, useCreateNote, useGeneralNotes } from '@/features/itinerary/hooks';
import type { Booking } from '@/features/itinerary/types';
import type { Trip } from '@/features/trips/types';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

/** Where a new note goes: a trip in focus, or nowhere in particular ("general"). */
type NoteScope = { kind: 'general' } | { kind: 'trip'; trip: Trip };

export function noteHref(note: Booking): string {
  return note.tripId ? `/trip/${note.tripId}/notes/${note.id}` : `/notes/${note.id}`;
}

/** Notes from the trips in focus plus general notes, newest first, each tagged with where it
 * belongs. New notes need an explicit destination — inside a trip there's no choice to make, but
 * here a note could belong to any trip in focus or to none. */
export function NotesFeed({ focusTrips }: { focusTrips: Trip[] }) {
  const theme = useTheme();
  const tripQueries = useBookingsForTrips(focusTrips.map((t) => t.id));
  const { data: generalNotes } = useGeneralNotes();
  const [adding, setAdding] = useState(false);

  const tripNotes = tripQueries.flatMap((q) =>
    (q.data ?? []).filter((b) => b.categoryKey === 'note'),
  );
  const notes = [...tripNotes, ...(generalNotes ?? [])].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const tripById = new Map(focusTrips.map((t) => [t.id, t]));

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text style={[theme.type.title, { fontSize: 20, color: theme.colors.text }]}>Notes</Text>

      {notes.length === 0 && !adding ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          No notes yet — jot down anything, for a trip or just in general.
        </Text>
      ) : null}

      {notes.map((note) => (
        <Link key={note.id} href={noteHref(note) as never} asChild>
          <NoteFeedRow note={note} trip={note.tripId ? tripById.get(note.tripId) : undefined} />
        </Link>
      ))}

      {adding ? (
        <NoteComposer focusTrips={focusTrips} onCancel={() => setAdding(false)} />
      ) : (
        <Button variant="dashed" fullWidth onPress={() => setAdding(true)}>
          + New note
        </Button>
      )}
    </View>
  );
}

/** Title + destination for a new note, then opens it. Outside a trip a note could belong to any
 * trip in focus or to none, so the destination must be picked explicitly. */
export function NoteComposer({
  focusTrips,
  onCancel,
  replace,
}: {
  focusTrips: Trip[];
  onCancel: () => void;
  /** Replace the current screen with the new note (e.g. when composing inside a modal). */
  replace?: boolean;
}) {
  const theme = useTheme();
  const router = useRouter();
  const createNote = useCreateNote();
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<NoteScope | null>(null);
  const canCreate = !!title.trim() && !!scope && !createNote.isPending;

  const onCreate = async () => {
    if (!canCreate || !scope) return;
    const created = await createNote.mutateAsync({
      tripId: scope.kind === 'trip' ? scope.trip.id : null,
      title: title.trim(),
    });
    const href = noteHref(created) as never;
    if (replace) router.replace(href);
    else router.push(href);
    onCancel();
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <TextField
        value={title}
        onChangeText={setTitle}
        placeholder="Note title…"
        autoFocus
        onSubmitEditing={onCreate}
        name="now-note-title"
      />
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>Where does it go?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }}>
        <ScopeChip
          icon="document-text-outline"
          label="General"
          selected={scope?.kind === 'general'}
          onPress={() => setScope({ kind: 'general' })}
        />
        {focusTrips.map((trip) => (
          <ScopeChip
            key={trip.id}
            icon="briefcase-outline"
            label={trip.name}
            selected={scope?.kind === 'trip' && scope.trip.id === trip.id}
            onPress={() => setScope({ kind: 'trip', trip })}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
        <Button variant="primary" size="sm" onPress={onCreate} disabled={!canCreate}>
          Create
        </Button>
        <Button variant="secondary" size="sm" onPress={onCancel}>
          Cancel
        </Button>
      </View>
    </View>
  );
}

/** The subtle "where this note lives" mark: the trip's name in the accent color, or "General". */
export function NoteScopeTag({ trip }: { trip?: Trip }) {
  const theme = useTheme();
  const color = trip ? theme.colors.accent : theme.colors.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons
        name={trip ? 'briefcase-outline' : 'document-text-outline'}
        size={12}
        color={color}
      />
      <Text style={[theme.type.data, { fontSize: 11, color }]} numberOfLines={1}>
        {(trip?.name ?? 'General').toUpperCase()}
      </Text>
    </View>
  );
}

const NoteFeedRow = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { note: Booking; trip?: Trip }
>(function NoteFeedRowInner({ note, trip, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderLeftWidth: 3,
        borderLeftColor: trip ? theme.colors.accent : theme.colors.border,
        backgroundColor: theme.colors.surface,
        gap: 4,
        opacity: pressed ? 0.75 : hovered ? 0.92 : 1,
      })}
    >
      <NoteScopeTag trip={trip} />
      <Text style={[theme.type.title, { color: theme.colors.text }]}>{note.title}</Text>
      {note.notes ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {note.notes}
        </Text>
      ) : null}
    </Pressable>
  );
});

function ScopeChip({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: 'document-text-outline' | 'briefcase-outline';
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  const color = selected ? theme.colors.onInk : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.sm,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        backgroundColor: selected ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[theme.type.body, { fontSize: 15, color }]}>{label}</Text>
    </Pressable>
  );
}
