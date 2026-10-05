import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();

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
          borderTopColor: theme.colors.border,
          height: 58 + theme.space.sm,
          paddingTop: theme.space.xs,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily.mono,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function AddTabIcon() {
  const theme = useTheme();
  return <Ionicons name="add" size={24} color={theme.colors.onInk} />;
}

interface AddTabButtonProps {
  children?: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
}

function AddTabButton({ children, onPress }: AddTabButtonProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.wrap}>
      {({ pressed }) => (
        <View
          style={[
            styles.button,
            { backgroundColor: theme.colors.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.25)',
    elevation: 4,
  },
});
