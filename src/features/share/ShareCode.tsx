import qrcodeGenerator from 'qrcode-generator';
import { useMemo } from 'react';
import { Image, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';

import { formatCode } from './crypto';
import { receiveUrl, shareHost } from './receiveUrl';

const QR_CELL_PX = 7;

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
  const host = shareHost();
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
        <View style={{ alignItems: 'center', gap: theme.space.xs }}>
          <Text style={[theme.type.data, { color: theme.colors.accent }]}>
            Valid for {mmss} · works for everyone who uses it in time
          </Text>
          {host ? (
            <Text style={[theme.type.caption, { color: theme.colors.textFaint }]}>
              Opens {host}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
