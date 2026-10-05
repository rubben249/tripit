import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import {
  bookingCategories,
  categoryKeys,
  type BookingCategory,
  type CategoryKey,
} from '@/features/bookings/categories';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { useCreateBooking } from './hooks';

export function AddBookingForm({
  tripId,
  dayId,
  cityId,
  date,
  onDone,
}: {
  tripId: string;
  dayId: string;
  cityId: string | null;
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
    Keyboard.dismiss();
    await createBooking.mutateAsync({
      dayId,
      cityId,
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
          {categoryKeys.map((key) => (
            <CategoryChip
              key={key}
              category={bookingCategories[key]}
              active={key === categoryKey}
              onPress={() => setCategoryKey(key)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder="What is it?"
          style={{ flex: 1, paddingHorizontal: theme.space.sm, paddingVertical: 8 }}
          name={`booking-title-${dayId}`}
        />
        <TextField
          value={time}
          onChangeText={setTime}
          placeholder="09:00"
          style={[
            theme.type.data,
            { width: 72, paddingHorizontal: theme.space.sm, paddingVertical: 8 },
          ]}
          name={`booking-time-${dayId}`}
        />
      </View>

      <Button
        variant="primary"
        size="sm"
        fullWidth
        onPress={onSave}
        disabled={!title.trim() || createBooking.isPending}
      >
        {createBooking.isPending ? 'Adding…' : 'Add to this day'}
      </Button>
    </View>
  );
}

function CategoryChip({
  category,
  active,
  onPress,
}: {
  category: BookingCategory;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme.space.sm,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        backgroundColor: active ? category.color : 'transparent',
        borderWidth: 1,
        borderColor: active ? category.color : theme.colors.border,
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
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
}
