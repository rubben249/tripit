import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const sendMagicLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: Linking.createURL('/auth/callback') },
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      return;
    }
    setStatus('sent');
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.space.lg }}>
        <View style={{ gap: theme.space.xs }}>
          <Text style={[theme.type.display, { color: theme.colors.text }]}>{env.appName}</Text>
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            Invite-only. Enter your email and we&rsquo;ll send you a sign-in link.
          </Text>
        </View>

        {status === 'sent' ? (
          <Text style={[theme.type.body, { color: theme.colors.good }]}>
            Check your inbox — tap the link we sent to {email.trim()} to finish signing in.
          </Text>
        ) : (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={[
                theme.type.body,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: theme.radius.sm,
                  paddingHorizontal: theme.space.md,
                  paddingVertical: theme.space.sm,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            />

            {status === 'error' ? (
              <Text style={[theme.type.caption, { color: theme.colors.warn }]}>{errorMessage}</Text>
            ) : null}

            <Button
              variant="primary"
              icon="mail-outline"
              fullWidth
              loading={status === 'sending'}
              onPress={sendMagicLink}
            >
              {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </Button>
          </>
        )}
      </View>
    </Screen>
  );
}
