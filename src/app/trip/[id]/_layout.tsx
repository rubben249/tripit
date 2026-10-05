import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, Slot, Stack, usePathname, useLocalSearchParams } from 'expo-router';

import { useTrip } from '@/features/trips/hooks';
import { useTheme } from '@/theme/ThemeProvider';

const SECTIONS = [
  { href: '', label: 'Overview' },
  { href: '/itinerary', label: 'Itinerary' },
  { href: '/people', label: 'People' },
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
          const active =
            section.href === '' ? pathname === `/trip/${id}` : pathname.endsWith(section.href);
          return (
            <Link key={section.href} href={target as never} asChild>
              <Pressable style={{ paddingVertical: theme.space.sm }}>
                <Text
                  style={[
                    theme.type.data,
                    { color: active ? theme.colors.accent : theme.colors.textMuted },
                  ]}
                >
                  {section.label.toUpperCase()}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
      <Slot />
    </View>
  );
}
