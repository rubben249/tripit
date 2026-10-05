import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
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
  const { confirm, dialog } = useConfirm();
  const [name, setName] = useState('');

  const onAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setName('');
    await addParticipant.mutateAsync(trimmed);
  };

  const onRemove = async (id: string, displayName: string) => {
    const confirmed = await confirm({
      title: 'Remove this person?',
      message: `"${displayName}" will no longer be listed on this trip.`,
      confirmLabel: 'Remove',
    });
    if (confirmed) removeParticipant.mutate(id);
  };

  return (
    <Screen scroll>
      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        Everyone coming on this trip — no account needed. Real sharing between devices is coming in
        a later phase.
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
          <Button variant="danger" size="sm" onPress={() => onRemove(p.id, p.displayName)}>
            Remove
          </Button>
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
        <Button variant="primary" onPress={onAdd}>
          Add
        </Button>
      </View>

      {dialog}
    </Screen>
  );
}
