import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAddParticipant, useParticipants, useRemoveParticipant } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

export default function PeopleScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: participants } = useParticipants(id);
  const addParticipant = useAddParticipant(id);
  const removeParticipant = useRemoveParticipant(id);
  const [name, setName] = useState('');

  const onAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setName('');
    await addParticipant.mutateAsync(trimmed);
  };

  return (
    <Screen scroll>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        Names for splitting expenses and assigning tasks — no account needed. Real sharing between
        devices is coming in a later phase.
      </Text>

      {(participants ?? []).map((p) => (
        <View
          key={p.id}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.space.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text style={[theme.type.body, { color: theme.colors.text }]}>{p.displayName}</Text>
          <Pressable onPress={() => removeParticipant.mutate(p.id)}>
            <Text style={[theme.type.caption, { color: theme.colors.warn }]}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder="Add a name…"
          onSubmitEditing={onAdd}
          style={{ flex: 1 }}
          name="participant-name"
        />
        <Pressable
          onPress={onAdd}
          style={{
            justifyContent: 'center',
            paddingHorizontal: theme.space.md,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.ink,
          }}
        >
          <Text style={[theme.type.data, { color: theme.colors.onInk }]}>Add</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
