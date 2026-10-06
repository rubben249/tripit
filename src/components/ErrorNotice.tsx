import { Ionicons } from '@expo/vector-icons';
import { Platform, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { describeDatabaseError, isDatabaseBusyError } from '@/lib/db/errors';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * What a person sees when something on this device failed. It names the problem
 * and the way out, because the platform's own wording does neither: Safari calls
 * a database held by another tab "an unknown transient reason (e.g. out of
 * memory)".
 */
export function ErrorNotice({
  error,
  onRetry,
  retrying,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const theme = useTheme();
  const busy = isDatabaseBusyError(error);
  const reloads = busy && Platform.OS === 'web';

  return (
    <View
      style={{
        gap: theme.space.sm,
        padding: theme.space.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
        <Ionicons
          name={busy ? 'copy-outline' : 'alert-circle-outline'}
          size={20}
          color={theme.colors.warn}
        />
        <Text style={[theme.type.title, { color: theme.colors.text, flexShrink: 1 }]}>
          {busy ? 'TripIt is open somewhere else' : 'That did not work'}
        </Text>
      </View>

      <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
        {describeDatabaseError(error)}
      </Text>

      {onRetry ? (
        <Button
          variant="secondary"
          icon="refresh-outline"
          loading={retrying}
          onPress={onRetry}
          style={{ alignSelf: 'flex-start' }}
        >
          {reloads ? 'Reload' : 'Try again'}
        </Button>
      ) : null}
    </View>
  );
}
