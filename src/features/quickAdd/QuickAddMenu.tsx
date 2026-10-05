import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useItineraryDays } from '@/features/itinerary/hooks';
import { NoteComposer } from '@/features/notes/NotesFeed';
import { getFocusTrips } from '@/features/now/focusTrips';
import { getEffectiveStatus } from '@/features/trips/status';
import { useTrips } from '@/features/trips/hooks';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

interface Action {
  key: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  href?: string;
}

/**
 * The center (+) button: the shortcuts that matter most while traveling, aimed at the trip in
 * focus (in progress, or starting within a week — same rule as the Now tab). Without one, it's
 * just a new trip or a general note.
 */
export function QuickAddMenu() {
  const theme = useTheme();
  const router = useRouter();
  const { data: trips } = useTrips();
  const trip = getFocusTrips(trips ?? [])[0];
  const { data: days } = useItineraryDays(trip?.id ?? '');
  const [writingNote, setWritingNote] = useState(false);

  const ongoing = !!trip && getEffectiveStatus(trip) === 'ongoing';
  const today = ongoing
    ? days?.find((d) => d.date === format(new Date(), 'yyyy-MM-dd'))
    : undefined;

  const actions: Action[] = [];
  if (trip && today) {
    actions.push({
      key: 'today',
      icon: 'today-outline',
      title: 'Add to today',
      subtitle: `A booking, plan or expense on today's day · ${trip.name}`,
      href: `/trip/${trip.id}/day/${today.id}?add=1`,
    });
  }
  if (trip) {
    actions.push(
      {
        key: 'expense',
        icon: 'wallet-outline',
        title: 'Expense',
        subtitle: `On any day of ${trip.name}`,
        href: `/trip/${trip.id}/expenses?add=1`,
      },
      {
        key: 'task',
        icon: 'checkbox-outline',
        title: 'Task',
        subtitle: `Something to get done · ${trip.name}`,
        href: `/trip/${trip.id}/tasks?add=1`,
      },
    );
  }
  actions.push(
    {
      key: 'note',
      icon: 'document-text-outline',
      title: 'Note',
      subtitle: trip ? `General, or for ${trip.name}` : 'A general note',
    },
    { key: 'trip', icon: 'airplane-outline', title: 'New trip', href: '/trip/new' },
  );

  return (
    <View style={{ gap: theme.space.sm }}>
      {actions.map((action) =>
        action.key === 'note' && writingNote ? (
          <View
            key={action.key}
            style={{
              padding: theme.space.md,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.accent,
              backgroundColor: theme.colors.surface,
            }}
          >
            <NoteComposer
              focusTrips={getFocusTrips(trips ?? [])}
              onCancel={() => setWritingNote(false)}
              replace
            />
          </View>
        ) : (
          <ActionRow
            key={action.key}
            action={action}
            onPress={() =>
              action.href ? router.replace(action.href as never) : setWritingNote(true)
            }
          />
        ),
      )}
    </View>
  );
}

function ActionRow({ action, onPress }: { action: Action; onPress: () => void }) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: hovered || pressed ? theme.colors.surfaceAlt : theme.colors.surface,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceAlt,
        }}
      >
        <Ionicons name={action.icon} size={22} color={theme.colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>{action.title}</Text>
        {action.subtitle ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {action.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}
