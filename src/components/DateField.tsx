import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

import { Button } from '@/components/Button';
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
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  name,
}: {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  minDate?: string | null;
  name?: string;
}) {
  const theme = useTheme();
  const trigger = useHoverable();
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : null;
  const min = minDate ? parseISO(minDate) : null;
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(selected ?? min ?? new Date()));
  const weeks = useMemo(() => monthGrid(viewedMonth), [viewedMonth]);

  const openPicker = () => {
    setViewedMonth(startOfMonth(selected ?? min ?? new Date()));
    setOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        nativeID={name}
        onHoverIn={trigger.onHoverIn}
        onHoverOut={trigger.onHoverOut}
        style={({ pressed }) => ({
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.75 : trigger.hovered ? 0.88 : 1,
        })}
      >
        <Text
          style={[theme.type.body, { color: value ? theme.colors.text : theme.colors.textMuted }]}
        >
          {selected ? format(selected, 'd MMM yyyy') : placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(23,17,11,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.space.lg,
          }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.space.md,
              gap: theme.space.sm,
            }}
          >
            <Text style={[theme.type.title, { color: theme.colors.text }]}>{label}</Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setViewedMonth((m) => subMonths(m, 1))}
              >
                ‹
              </Button>
              <Text style={[theme.type.body, { color: theme.colors.text }]}>
                {format(viewedMonth, 'MMMM yyyy')}
              </Text>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setViewedMonth((m) => addMonths(m, 1))}
              >
                ›
              </Button>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {WEEKDAY_LABELS.map((d, i) => (
                <Text
                  key={i}
                  style={[
                    theme.type.caption,
                    { color: theme.colors.textMuted, flex: 1, textAlign: 'center' },
                  ]}
                >
                  {d}
                </Text>
              ))}
            </View>

            {weeks.map((week, wi) => (
              <View key={wi} style={{ flexDirection: 'row' }}>
                {week.map((day) => {
                  const disabled = !!min && isBefore(day, min) && !isSameDay(day, min);
                  const inMonth = isSameMonth(day, viewedMonth);
                  const isSelected = !!selected && isSameDay(day, selected);
                  return (
                    <DayCell
                      key={day.toISOString()}
                      day={day}
                      disabled={disabled}
                      inMonth={inMonth}
                      selected={isSelected}
                      onPress={() => {
                        onChange(format(day, 'yyyy-MM-dd'));
                        setOpen(false);
                      }}
                    />
                  );
                })}
              </View>
            ))}

            {value ? (
              <Button
                variant="dashed"
                size="sm"
                style={{ alignSelf: 'center', marginTop: theme.space.xs }}
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                Clear date
              </Button>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function DayCell({
  day,
  disabled,
  inMonth,
  selected,
  onPress,
}: {
  day: Date;
  disabled: boolean;
  inMonth: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 1,
        borderRadius: theme.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected
          ? theme.colors.ink
          : hovered && !disabled
            ? theme.colors.surfaceAlt
            : 'transparent',
        opacity: pressed && !disabled ? 0.75 : 1,
      })}
    >
      <Text
        style={[
          theme.type.data,
          {
            color: selected
              ? theme.colors.onInk
              : disabled || !inMonth
                ? theme.colors.border
                : theme.colors.text,
          },
        ]}
      >
        {format(day, 'd')}
      </Text>
    </Pressable>
  );
}
