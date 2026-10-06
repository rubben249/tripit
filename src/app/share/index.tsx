import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionTitle } from '@/components/SectionTitle';
import { formatDateRange } from '@/lib/dates';
import { usePressFeedback, stagger } from '@/lib/motion';
import { useTrips } from '@/features/trips/hooks';
import type { Trip } from '@/features/trips/types';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * One door for both halves of sharing. Every entry point that has no trip in
 * context — the trips list, the + menu — lands here, because from there
 * "share" is as likely to mean "someone is reading me a code" as "take mine".
 * A trip's own screen keeps sending that trip directly: there, the question
 * has already been answered.
 */
export default function ShareHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: trips } = useTrips();
  const [sending, setSending] = useState(false);

  const sendable = (trips ?? []).filter((trip) => !trip.deletedAt);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Share a trip', presentation: 'modal' }} />
      <ScreenTitle subtitle="Trips travel as a copy: a code good for three minutes, and nothing syncs afterwards.">
        Share a trip
      </ScreenTitle>

      <View style={{ gap: theme.space.sm }}>
        <ChoiceCard
          icon="arrow-up-circle-outline"
          title="Send a trip"
          subtitle="Create a code for someone standing next to you"
          selected={sending}
          onPress={() => setSending((open) => !open)}
        />
        <ChoiceCard
          icon="keypad-outline"
          title="Receive a trip"
          subtitle="Type the 8-character code they read out"
          onPress={() => router.push('/receive')}
        />
      </View>

      {sending ? (
        <View style={{ gap: theme.space.sm }}>
          <SectionTitle>Which trip?</SectionTitle>
          {sendable.length === 0 ? (
            <View style={{ gap: theme.space.sm }}>
              <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
                You have no trips to send yet.
              </Text>
              <Button
                variant="secondary"
                icon="airplane-outline"
                onPress={() => router.push('/trip/new')}
              >
                Plan a new trip
              </Button>
            </View>
          ) : (
            sendable.map((trip, i) => (
              <Animated.View key={trip.id} entering={FadeInDown.duration(220).delay(stagger(i))}>
                <TripRow trip={trip} onPress={() => router.push(`/share/${trip.id}`)} />
              </Animated.View>
            ))
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function ChoiceCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: 'arrow-up-circle-outline' | 'keypad-outline';
  title: string;
  subtitle: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const press = usePressFeedback(theme.motion.pressScale.surface);
  const lit = press.hovered || selected;

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded: selected }}
      onHoverIn={press.onHoverIn}
      onHoverOut={press.onHoverOut}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        press.animatedStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          padding: theme.space.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: lit ? theme.colors.accent : theme.colors.border,
          backgroundColor: theme.colors.surface,
          ...(lit ? theme.elevation.raised : null),
        },
      ]}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: lit ? theme.colors.accent : theme.colors.accentSoft,
        }}
      >
        <Ionicons name={icon} size={21} color={lit ? theme.colors.onInk : theme.colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      </View>
      <Ionicons
        name={selected ? 'chevron-down' : 'chevron-forward'}
        size={18}
        color={theme.colors.textFaint}
      />
    </AnimatedPressable>
  );
}

function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const theme = useTheme();
  const press = usePressFeedback(theme.motion.pressScale.surface);

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Send ${trip.name}`}
      onHoverIn={press.onHoverIn}
      onHoverOut={press.onHoverOut}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        press.animatedStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          minHeight: 56,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: press.hovered ? theme.colors.surfaceAlt : theme.colors.surface,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>{trip.name}</Text>
        {trip.startDate && trip.endDate ? (
          <Text style={[theme.type.data, { fontSize: 12, color: theme.colors.textMuted }]}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
    </AnimatedPressable>
  );
}
