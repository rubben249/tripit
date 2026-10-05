import { forwardRef } from 'react';
import { Pressable, ScrollView, Text, View, type PressableProps } from 'react-native';
import { Link, Slot, Stack, usePathname, useLocalSearchParams } from 'expo-router';

import { useTrip } from '@/features/trips/hooks';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

const SECTIONS = [
  { href: '', label: 'Overview' },
  { href: '/itinerary', label: 'Itinerary', alsoActiveOn: '/day/' },
  { href: '/reservations', label: 'Reservations' },
  { href: '/people', label: 'People' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/notes', label: 'Notes' },
] as const;

export default function TripLayout() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pathname = usePathname();
  const { data: trip } = useTrip(id);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: trip?.name ?? 'Trip' }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
        contentContainerStyle={{ paddingHorizontal: theme.space.md, gap: theme.space.md }}
      >
        {SECTIONS.map((section) => {
          const target = `/trip/${id}${section.href}`;
          const alsoActiveOn = 'alsoActiveOn' in section ? section.alsoActiveOn : undefined;
          const active =
            section.href === ''
              ? pathname === `/trip/${id}`
              : pathname.includes(section.href) ||
                (!!alsoActiveOn && pathname.includes(alsoActiveOn));
          return (
            <Link key={section.href} href={target as never} asChild>
              <TripTabLink label={section.label} active={active} />
            </Link>
          );
        })}
      </ScrollView>
      <Slot />
    </View>
  );
}

const TripTabLink = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { label: string; active: boolean }
>(function TripTabLink({ label, active, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      ref={ref}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        paddingHorizontal: theme.space.sm,
        paddingVertical: theme.space.xs,
        borderRadius: theme.radius.sm,
        backgroundColor: active ? theme.colors.surfaceAlt : 'transparent',
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
      {...pressableProps}
    >
      <Text
        style={[theme.type.data, { color: active ? theme.colors.accent : theme.colors.textMuted }]}
      >
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
});
