import type { PropsWithChildren } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * The one dialog shell: scrim, centered card, tap-outside to dismiss, and the
 * same entrance everywhere. The card springs in from 96% instead of fading flat,
 * which is what makes a dialog feel like it arrived rather than like it was
 * always there and someone turned on the lights.
 */
export function ModalCard({
  visible,
  onRequestClose,
  children,
}: PropsWithChildren<{ visible: boolean; onRequestClose: () => void }>) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose}>
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(120)}
        style={{ flex: 1 }}
      >
        {/* No accessibilityRole here: on web react-native-web turns a role="button"
            Pressable into a real <button>, and the dialog's own buttons would then
            be nested inside it — invalid HTML, and a hydration error. */}
        <Pressable
          style={{
            flex: 1,
            backgroundColor: theme.colors.scrim,
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.space.lg,
          }}
          onPress={onRequestClose}
        >
          <Animated.View
            entering={ZoomIn.springify().damping(20).stiffness(240).mass(0.9)}
            style={{ width: '100%', maxWidth: 380 }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  padding: theme.space.lg,
                  gap: theme.space.md,
                  ...theme.elevation.overlay,
                }}
              >
                {children}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
