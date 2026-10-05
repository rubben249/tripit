import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * RN's own Alert.alert is a no-op on web (react-native-web ships an empty
 * stub), so it can't be used for confirmations in an app that also runs as a
 * PWA. `confirm(...)` resolves true/false once the person picks an option;
 * render `dialog` once per screen that calls it.
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = (confirmed: boolean) => {
    state?.resolve(confirmed);
    setState(null);
  };

  const dialog = (
    <ConfirmDialog
      visible={!!state}
      title={state?.title ?? ''}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      destructive={state?.destructive ?? true}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, dialog };
}

function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(14,22,38,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.space.lg,
        }}
        onPress={onCancel}
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
          <Text style={[theme.type.title, { color: theme.colors.text }]}>{title}</Text>
          {message ? (
            <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>{message}</Text>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: theme.space.sm,
              marginTop: theme.space.xs,
            }}
          >
            <Button variant="secondary" onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={destructive ? 'danger' : 'primary'} onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
