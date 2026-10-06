import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

import { Button } from '@/components/Button';
import { ModalCard } from '@/components/ModalCard';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function monthGrid(month: Date): Date[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

/**
 * Calendar date picker, built on plain RN primitives (View/Pressable/Modal)
 * instead of a native module — this app is a single codebase across
 * iOS/Android/web, and native date pickers don't have a consistent web story.
 *
 * `minDate`/`maxDate` are a real fence, not a hint: a city or a booking that
 * belongs to a trip can only land inside that trip's dates, so days outside the
 * range aren't pressable and the months beyond it can't be reached.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  rangeHint,
  name,
}: {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  minDate?: string | null;
  maxDate?: string | null;
  /** Shown under the grid when the choice is fenced, e.g. "Within 4–7 Oct". */
  rangeHint?: string | null;
  name?: string;
}) {
  const theme = useTheme();
  const trigger = useHoverable();
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : null;
  const min = minDate ? parseISO(minDate) : null;
  const max = maxDate ? parseISO(maxDate) : null;
  const today = new Date();
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(selected ?? min ?? new Date()));
  const weeks = useMemo(() => monthGrid(viewedMonth), [viewedMonth]);

  const canGoBack = !min || isAfter(startOfMonth(viewedMonth), startOfMonth(min));
  const canGoForward = !max || isBefore(startOfMonth(viewedMonth), startOfMonth(max));

  const openPicker = () => {
    setViewedMonth(startOfMonth(selected ?? min ?? new Date()));
    setOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        nativeID={name}
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `: ${value}` : ''}`}
        onHoverIn={trigger.onHoverIn}
        onHoverOut={trigger.onHoverOut}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.sm,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.space.md,
          minHeight: 48,
          backgroundColor:
            trigger.hovered && !pressed ? theme.colors.surfaceAlt : theme.colors.surface,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          style={[
            theme.type.body,
            { flex: 1, color: value ? theme.colors.text : theme.colors.textFaint },
          ]}
        >
          {selected ? format(selected, 'd MMM yyyy') : placeholder}
        </Text>
      </Pressable>

      <ModalCard visible={open} onRequestClose={() => setOpen(false)}>
        <Text style={[theme.type.section, { color: theme.colors.text }]}>{label}</Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.space.sm,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            icon="chevron-back"
            disabled={!canGoBack}
            accessibilityLabel="Previous month"
            onPress={() => setViewedMonth((m) => subMonths(m, 1))}
          >
            {''}
          </Button>
          <Text style={[theme.type.title, { color: theme.colors.text }]}>
            {format(viewedMonth, 'MMMM yyyy')}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            icon="chevron-forward"
            disabled={!canGoForward}
            accessibilityLabel="Next month"
            onPress={() => setViewedMonth((m) => addMonths(m, 1))}
          >
            {''}
          </Button>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {WEEKDAY_LABELS.map((d, i) => (
            <Text
              key={i}
              style={[
                theme.type.label,
                { color: theme.colors.textMuted, flex: 1, textAlign: 'center' },
              ]}
            >
              {d}
            </Text>
          ))}
        </View>

        <View style={{ gap: theme.space.xxs }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row' }}>
              {week.map((day) => {
                const beforeMin = !!min && isBefore(day, min) && !isSameDay(day, min);
                const afterMax = !!max && isAfter(day, max) && !isSameDay(day, max);
                return (
                  <DayCell
                    key={day.toISOString()}
                    day={day}
                    disabled={beforeMin || afterMax}
                    inMonth={isSameMonth(day, viewedMonth)}
                    isToday={isSameDay(day, today)}
                    selected={!!selected && isSameDay(day, selected)}
                    onPress={() => {
                      onChange(format(day, 'yyyy-MM-dd'));
                      setOpen(false);
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {rangeHint ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{rangeHint}</Text>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: value ? 'space-between' : 'flex-end',
            alignItems: 'center',
            gap: theme.space.sm,
          }}
        >
          {value ? (
            <Button
              variant="ghost"
              size="sm"
              icon="close"
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onPress={() => setOpen(false)}>
            Done
          </Button>
        </View>
      </ModalCard>
    </>
  );
}

function DayCell({
  day,
  disabled,
  inMonth,
  isToday,
  selected,
  onPress,
}: {
  day: Date;
  disabled: boolean;
  inMonth: boolean;
  isToday: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  const color = selected
    ? theme.colors.onSolid
    : disabled
      ? theme.colors.textFaint
      : inMonth
        ? theme.colors.text
        : theme.colors.textMuted;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      accessibilityLabel={format(day, 'd MMMM yyyy')}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 1,
        borderRadius: theme.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: isToday && !selected ? 1 : 0,
        borderColor: theme.colors.accent,
        backgroundColor: selected
          ? theme.colors.solid
          : hovered && !disabled
            ? theme.colors.surfaceAlt
            : 'transparent',
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={[
          theme.type.data,
          { color, fontFamily: selected ? theme.fontFamily.monoMedium : theme.fontFamily.mono },
        ]}
      >
        {format(day, 'd')}
      </Text>
    </Pressable>
  );
}
