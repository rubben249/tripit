import { useState } from 'react';
import { View } from 'react-native';

import { TextField } from '@/components/TextField';
import { useUpdateBooking } from '@/features/itinerary/hooks';
import type { Booking } from '@/features/itinerary/types';
import { useTheme } from '@/theme/ThemeProvider';

/** Title + free-form body editor, saved on blur. Shared by notes and tasks — both are bookings
 * whose body lives in the `notes` column. Key it by booking id so switching bookings resets the
 * local state instead of needing an effect to sync it. */
export function NoteEditor({
  tripId,
  booking,
  bodyPlaceholder,
}: {
  tripId: string | null;
  booking: Booking;
  bodyPlaceholder: string;
}) {
  const theme = useTheme();
  const updateBooking = useUpdateBooking(tripId);
  const [title, setTitle] = useState(booking.title);
  const [body, setBody] = useState(booking.notes ?? '');

  const onSaveTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== booking.title) {
      updateBooking.mutate({ id: booking.id, update: { title: trimmed } });
    }
  };

  const onSaveBody = () => {
    if (body !== (booking.notes ?? '')) {
      updateBooking.mutate({ id: booking.id, update: { notes: body } });
    }
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <TextField
        value={title}
        onChangeText={setTitle}
        onBlur={onSaveTitle}
        placeholder="Title"
        style={{ fontFamily: theme.fontFamily.bodySemiBold, fontSize: 18 }}
        name="note-title"
      />
      <TextField
        value={body}
        onChangeText={setBody}
        onBlur={onSaveBody}
        placeholder={bodyPlaceholder}
        multiline
        style={{ minHeight: 280, textAlignVertical: 'top' }}
        name="note-body"
      />
    </View>
  );
}
