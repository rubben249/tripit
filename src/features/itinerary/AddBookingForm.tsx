import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { bookingCategories, categoryKeys, type CategoryKey } from '@/features/bookings/categories';
import { useTheme } from '@/theme/ThemeProvider';

import { useCreateBooking } from './hooks';

export function AddBookingForm({
  tripId,
  dayId,
  date,
  onDone,
}: {
  tripId: string;
  dayId: string;
  date: string;
  onDone: () => void;
}) {
  const theme = useTheme();
  const createBooking = useCreateBooking(tripId);
  const [categoryKey, setCategoryKey] = useState<CategoryKey>('sightseeing');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  const onSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createBooking.mutateAsync({
      dayId,
      categoryKey,
      title: trimmed,
      startAt: time.trim() ? `${date}T${time.trim()}:00` : undefined,
      status: 'idea',
    });
    setTitle('');
    setTime('');
    onDone();
  };

  return (
    <View
      style={{
        gap: theme.space.sm,
        padding: theme.space.sm,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
          {categoryKeys.map((key) => {
            const category = bookingCategories[key];
            const active = key === categoryKey;
            return (
              <Pressable
                key={key}
                onPress={() => setCategoryKey(key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: theme.space.sm,
                  paddingVertical: 6,
                  borderRadius: theme.radius.pill,
                  backgroundColor: active ? category.color : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? category.color : theme.colors.border,
                }}
              >
                <Ionicons
                  name={category.icon}
                  size={13}
                  color={active ? theme.colors.onInk : category.color}
                />
                <Text
                  style={[
                    theme.type.caption,
                    { fontSize: 11, color: active ? theme.colors.onInk : theme.colors.textMuted },
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder="What is it?"
          style={{ flex: 1, paddingHorizontal: theme.space.sm, paddingVertical: 8 }}
        />
        <TextField
          value={time}
          onChangeText={setTime}
          placeholder="09:00"
          style={[
            theme.type.data,
            { width: 72, paddingHorizontal: theme.space.sm, paddingVertical: 8 },
          ]}
        />
      </View>

      <Pressable
        onPress={onSave}
        disabled={!title.trim() || createBooking.isPending}
        style={{
          backgroundColor: theme.colors.ink,
          borderRadius: theme.radius.sm,
          paddingVertical: 8,
          alignItems: 'center',
          opacity: !title.trim() || createBooking.isPending ? 0.6 : 1,
        }}
      >
        <Text style={[theme.type.caption, { color: theme.colors.onInk }]}>
          {createBooking.isPending ? 'Adding…' : 'Add to this day'}
        </Text>
      </Pressable>
    </View>
  );
}
