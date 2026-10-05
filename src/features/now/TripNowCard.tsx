import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay, parseISO } from 'date-fns';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { bookingCategories } from '@/features/bookings/categories';
import { asTaskDetails } from '@/features/bookings/details';
import { useBookings, useCities, useItineraryDays } from '@/features/itinerary/hooks';
import type { Booking } from '@/features/itinerary/types';
import { TaskCheckbox } from '@/features/tasks/TaskCheckbox';
import { sortTasks } from '@/features/tasks/sortTasks';
import { getEffectiveStatus } from '@/features/trips/status';
import { TripCountdown } from '@/features/trips/TripCountdown';
import type { Trip } from '@/features/trips/types';
import { formatTimeUntil } from '@/lib/countdown';
import { useTheme } from '@/theme/ThemeProvider';

import { getNextUp, getTodayPlan, type TimelineItem } from './today';

const MAX_TASKS = 4;

/** One trip in focus on the Now tab: where you are today, what's next, today's plan and what's
 * still pending. A trip that hasn't started yet shows its countdown instead of today's plan. */
export function TripNowCard({ trip, now }: { trip: Trip; now: Date }) {
  const theme = useTheme();
  const { data: days } = useItineraryDays(trip.id);
  const { data: cities } = useCities(trip.id);
  const { data: bookings } = useBookings(trip.id);

  const ongoing = getEffectiveStatus(trip, now) === 'ongoing';
  const plan = ongoing ? getTodayPlan(days ?? [], cities ?? [], bookings ?? [], now) : null;
  const next = getNextUp(bookings ?? [], now);
  const pendingTasks = sortTasks(
    (bookings ?? []).filter((b) => b.categoryKey === 'task' && !asTaskDetails(b.details).done),
  );

  const subtitle = plan
    ? `Day ${plan.dayNumber} of ${plan.totalDays}${plan.city ? ` · ${plan.city.name}` : ''}`
    : ongoing
      ? 'In progress'
      : null;

  return (
    <View
      style={{
        gap: theme.space.md,
        padding: theme.space.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ gap: 2 }}>
        <Text style={[theme.type.data, { fontSize: 12, color: theme.colors.accent }]}>
          {ongoing ? 'TODAY' : 'COMING UP'}
        </Text>
        <Text style={[theme.type.headline, { color: theme.colors.text }]}>{trip.name}</Text>
        {subtitle ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>{subtitle}</Text>
        ) : (
          <TripCountdown trip={trip} size="md" />
        )}
      </View>

      {next ? <NextUpRow booking={next} now={now} /> : null}

      {plan && plan.items.length > 0 ? (
        <View style={{ gap: theme.space.sm }}>
          <SectionLabel>Today&apos;s plan</SectionLabel>
          {plan.items.map((item) => (
            <TimelineRow key={item.booking.id} item={item} />
          ))}
        </View>
      ) : plan ? (
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          Nothing planned for today — enjoy it.
        </Text>
      ) : null}

      {pendingTasks.length > 0 ? (
        <View style={{ gap: theme.space.sm }}>
          <SectionLabel>{`Pending tasks (${pendingTasks.length})`}</SectionLabel>
          {pendingTasks.slice(0, MAX_TASKS).map((task) => (
            <View
              key={task.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}
            >
              <TaskCheckbox tripId={trip.id} task={task} />
              <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
                {task.title}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        {plan ? (
          <Link href={`/trip/${trip.id}/day/${plan.day.id}`} asChild>
            <Button size="sm">Open today ›</Button>
          </Link>
        ) : null}
        <Link href={`/trip/${trip.id}`} asChild>
          <Button size="sm">Open trip ›</Button>
        </Link>
        {pendingTasks.length > MAX_TASKS ? (
          <Link href={`/trip/${trip.id}/tasks`} asChild>
            <Button size="sm">All tasks ›</Button>
          </Link>
        ) : null}
      </View>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text style={[theme.type.data, { fontSize: 12, color: theme.colors.textMuted }]}>
      {children.toUpperCase()}
    </Text>
  );
}

function NextUpRow({ booking, now }: { booking: Booking; now: Date }) {
  const theme = useTheme();
  const category = bookingCategories[booking.categoryKey];
  const start = parseISO(booking.startAt as string);
  const when = isSameDay(start, now) ? format(start, 'HH:mm') : format(start, 'EEE d MMM, HH:mm');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      <Ionicons name={category.icon} size={26} color={theme.colors.accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[theme.type.data, { fontSize: 12, color: theme.colors.accent }]}>
          NEXT · {formatTimeUntil(start, now).toUpperCase()}
        </Text>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>{booking.title}</Text>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {when}
          {booking.locationName ? ` · ${booking.locationName}` : ''}
        </Text>
      </View>
    </View>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const theme = useTheme();
  const category = bookingCategories[item.booking.categoryKey];
  const done = item.state === 'done';
  const active = item.state === 'now';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        opacity: done ? 0.5 : 1,
      }}
    >
      <Text
        style={[
          theme.type.data,
          { width: 78, color: active ? theme.colors.accent : theme.colors.textMuted },
        ]}
      >
        {item.timeLabel ?? 'All day'}
      </Text>
      <Ionicons name={category.icon} size={20} color={category.color} />
      <Text
        style={[
          theme.type.body,
          {
            flex: 1,
            color: theme.colors.text,
            fontFamily: active ? theme.fontFamily.bodySemiBold : theme.fontFamily.body,
          },
        ]}
      >
        {item.booking.title}
      </Text>
      {active ? (
        <Text
          style={[
            theme.type.data,
            {
              fontSize: 11,
              color: theme.colors.onInk,
              backgroundColor: theme.colors.accent,
              paddingHorizontal: 6,
              borderRadius: theme.radius.sm,
              overflow: 'hidden',
            },
          ]}
        >
          NOW
        </Text>
      ) : done ? (
        <Ionicons name="checkmark" size={18} color={theme.colors.textMuted} />
      ) : null}
    </View>
  );
}
