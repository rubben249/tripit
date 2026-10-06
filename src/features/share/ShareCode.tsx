import * as Linking from 'expo-linking';
import qrcodeGenerator from 'qrcode-generator';
import { useMemo } from 'react';
import { Image, Platform, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { env } from '@/config/env';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';

import { formatCode } from './crypto';

const QR_CELL_PX = 7;

/** The link a phone camera opens straight into the Receive screen, code filled in. On web,
 * expo-linking's createURL ignores the base path the app is served under (when it's served under a
 * sub-path), so the URL is built from the current origin plus that base instead. */
export function receiveUrl(code: string): string {
  if (Platform.OS === 'web') {
    return `${window.location.origin}${env.webBaseUrl}/receive?code=${code}`;
  }
  return Linking.createURL('/receive', { queryParams: { code } });
}

function qrDataUrl(text: string): string {
  const qr = qrcodeGenerator(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createDataURL(QR_CELL_PX, 2);
}

/** QR + short code with a live countdown; once the 3 minutes are up, offers a fresh code. */
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
  const url = receiveUrl(code);
  const qr = useMemo(() => qrDataUrl(url), [url]);
  const secondsLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / 1000));
  const expired = secondsLeft === 0;
  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <View style={{ alignItems: 'center', gap: theme.space.md }}>
      <View
        style={{
          padding: theme.space.sm,
          borderRadius: theme.radius.md,
          backgroundColor: '#FFFFFF',
          opacity: expired ? 0.15 : 1,
        }}
      >
        <Image
          source={{ uri: qr }}
          accessibilityLabel={`QR code for ${formatCode(code)}`}
          style={{ width: 240, height: 240 }}
          resizeMode="contain"
        />
      </View>

      <Text
        selectable
        style={[
          theme.type.display,
          {
            fontFamily: theme.fontFamily.monoMedium,
            letterSpacing: 4,
            color: expired ? theme.colors.textMuted : theme.colors.text,
            textDecorationLine: expired ? 'line-through' : 'none',
          },
        ]}
      >
        {formatCode(code)}
      </Text>

      {expired ? (
        <>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            This code has expired.
          </Text>
          <Button variant="primary" onPress={onRenew}>
            Create a new code
          </Button>
        </>
      ) : (
        <Text style={[theme.type.data, { color: theme.colors.accent }]}>
          Valid for {mmss} · works for everyone who uses it in time
        </Text>
      )}
    </View>
  );
}
