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
  { href: '/tasks', label: 'Tasks' },
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
        style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSoft }}
        contentContainerStyle={{
          paddingHorizontal: theme.space.lg,
          gap: theme.space.xs,
          width: '100%',
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: 'center',
        }}
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

/**
 * Section tabs carry an underline, not just a color change: an accent-tinted
 * label against paper is a weak "you are here", and it disappears entirely for
 * anyone who can't separate the two hues.
 */
const TripTabLink = forwardRef<
  View,
  Omit<PressableProps, 'style'> & { label: string; active: boolean }
>(function TripTabLink({ label, active, ...pressableProps }, ref) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        paddingHorizontal: theme.space.sm,
        paddingTop: theme.space.sm,
        paddingBottom: theme.space.sm,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={[
          theme.type.data,
          {
            fontSize: 14,
            letterSpacing: 0.6,
            fontFamily: active ? theme.fontFamily.monoMedium : theme.fontFamily.mono,
            color: active
              ? theme.colors.text
              : hovered
                ? theme.colors.text
                : theme.colors.textMuted,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          height: 2,
          borderRadius: 1,
          marginTop: theme.space.sm,
          backgroundColor: active
            ? theme.colors.accent
            : hovered
              ? theme.colors.border
              : 'transparent',
        }}
      />
    </Pressable>
  );
});
