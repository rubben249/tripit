import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useItineraryDays } from '@/features/itinerary/hooks';
import { NoteComposer } from '@/features/notes/NotesFeed';
import { getFocusTrips } from '@/features/now/focusTrips';
import { getEffectiveStatus } from '@/features/trips/status';
import { useTrips } from '@/features/trips/hooks';
import { usePressFeedback } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    {
      key: 'trip',
      icon: 'airplane-outline',
      title: 'New trip',
      subtitle: 'Name it, set the dates, add cities',
      href: '/trip/new',
    },
    // Receiving a trip is adding one, so it belongs with the other ways to add —
    // it used to live only at the bottom of You, behind Backup, where nobody
    // would look for it while standing next to the person sharing the code.
    {
      key: 'receive',
      icon: 'keypad-outline',
      title: 'Receive a shared trip',
      subtitle: 'Type the 8-character code someone shared with you',
      href: '/receive',
    },
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
  const press = usePressFeedback(theme.motion.pressScale.surface);
  const lit = press.hovered;

  return (
    <AnimatedPressable
      onPress={onPress}
      onHoverIn={press.onHoverIn}
      onHoverOut={press.onHoverOut}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={action.title}
      style={[
        press.animatedStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          padding: theme.space.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: lit ? theme.colors.accent : theme.colors.border,
          backgroundColor: theme.colors.surface,
          ...(lit ? theme.elevation.raised : null),
        },
      ]}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: lit ? theme.colors.accent : theme.colors.accentSoft,
        }}
      >
        <Ionicons
          name={action.icon}
          size={21}
          color={lit ? theme.colors.onInk : theme.colors.accent}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>{action.title}</Text>
        {action.subtitle ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {action.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
    </AnimatedPressable>
  );
}
