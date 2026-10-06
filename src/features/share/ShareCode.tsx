import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';

import { formatCode } from './crypto';

/** How long the button stays on "Copied" before going back to "Copy". */
const COPIED_FOR_MS = 2000;

/**
 * The code, big enough to read out across a table, with a live countdown.
 *
 * There was a QR here. It encoded a link to the web app, and on the receiving
 * phone that link could only ever open the browser — which on iOS holds storage
 * separate from the app added to the home screen, where the trips actually live.
 * So a scan either imported the trip into the wrong place or, when the app was
 * already open, failed outright: the local database is wa-sqlite over OPFS, and
 * only one context per origin can hold it (see CLAUDE.md). Typing the code
 * inside the app someone already uses has neither problem.
 */
export function ShareCode({
  code,
  expiresAt,
  onRenew,
}: {
  code: string;
  expiresAt: Date;
  onRenew: () => void;
}) {
  const theme = useTheme();
  const now = useNow(1000);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const onCopy = async () => {
    // A browser can refuse the clipboard (permissions, an insecure origin). Saying
    // so beats a button that looks like it did nothing.
    let state: 'copied' | 'failed' = 'copied';
    try {
      await Clipboard.setStringAsync(formatCode(code));
    } catch {
      state = 'failed';
    }
    setCopyState(state);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopyState('idle'), COPIED_FOR_MS);
  };

  const secondsLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / 1000));
  const expired = secondsLeft === 0;
  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <View style={{ alignItems: 'center', gap: theme.space.md }}>
      <View
        style={{
          alignSelf: 'stretch',
          alignItems: 'center',
          paddingVertical: theme.space.xl,
          paddingHorizontal: theme.space.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: expired ? theme.colors.border : theme.colors.accent,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text
          selectable
          accessibilityLabel={`Share code ${formatCode(code).split('').join(' ')}`}
          style={[
            theme.type.display,
            {
              fontFamily: theme.fontFamily.monoMedium,
              letterSpacing: 4,
              color: expired ? theme.colors.textFaint : theme.colors.text,
              textDecorationLine: expired ? 'line-through' : 'none',
            },
          ]}
        >
          {formatCode(code)}
        </Text>
      </View>

      {expired ? (
        <>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            This code has expired.
          </Text>
          <Button variant="primary" icon="refresh-outline" onPress={onRenew}>
            Create a new code
          </Button>
        </>
      ) : (
        <>
          <Button
            variant={copyState === 'copied' ? 'primary' : 'secondary'}
            icon={
              copyState === 'copied'
                ? 'checkmark'
                : copyState === 'failed'
                  ? 'alert-circle-outline'
                  : 'copy-outline'
            }
            onPress={onCopy}
            accessibilityLabel={copyState === 'copied' ? 'Code copied' : 'Copy code'}
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy by hand' : 'Copy'}
          </Button>
          <Text style={[theme.type.data, { color: theme.colors.accent, textAlign: 'center' }]}>
            Valid for {mmss} · works for everyone who uses it in time
          </Text>
        </>
      )}
    </View>
  );
}
