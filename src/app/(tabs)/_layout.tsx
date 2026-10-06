import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ColorValue,
  type GestureResponderEvent,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePressFeedback } from '@/lib/motion';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Using `ink` here was the bug: in dark mode ink (#2B1E12) and the
        // tab bar surface (#241B12) are nearly the same tone, so the active
        // tab's icon+label were nearly invisible against their own
        // background — looked like the tab disappeared on press. `accent`
        // has real contrast against the surface in both themes.
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderSoft,
          height: theme.layout.tabBarHeight + insets.bottom,
          paddingTop: theme.space.sm,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily.mono,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: (props) => <TabIcon {...props} name="briefcase" />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: (props) => <TabIcon {...props} name="map" />,
        }}
      />
      <Tabs.Screen
        name="quick-add"
        options={{
          title: '',
          tabBarIcon: () => <AddTabIcon />,
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add');
          },
        }}
      />
      <Tabs.Screen
        name="now"
        options={{
          title: 'Now',
          tabBarIcon: (props) => <TabIcon {...props} name="time" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'You',
          tabBarIcon: (props) => <TabIcon {...props} name="person" />,
        }}
      />
    </Tabs>
  );
}

/**
 * The active tab switches its icon from outline to filled. Color alone carried
 * the whole state before, which is both a contrast risk and invisible to anyone
 * who reads shape faster than hue.
 */
function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: 'briefcase' | 'map' | 'time' | 'person';
  color: ColorValue;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={styles.icon}>
      <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
    </View>
  );
}

function AddTabIcon() {
  const theme = useTheme();
  return <Ionicons name="add" size={26} color={theme.colors.onInk} />;
}

interface AddTabButtonProps {
  children?: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
}

function AddTabButton({ children, onPress }: AddTabButtonProps) {
  const theme = useTheme();
  const press = usePressFeedback(theme.motion.pressScale.control);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Quick add"
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onHoverIn={press.onHoverIn}
      onHoverOut={press.onHoverOut}
      style={styles.wrap}
    >
      <Animated.View
        style={[
          styles.button,
          press.animatedStyle,
          {
            backgroundColor: press.hovered ? theme.colors.steel : theme.colors.accent,
            ...theme.elevation.floating,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  icon: { alignItems: 'center' },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
