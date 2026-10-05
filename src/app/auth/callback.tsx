import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

export default function AuthCallback() {
  const theme = useTheme();
  const { code, error_description: errorDescription } = useLocalSearchParams<{
    code?: string;
    error_description?: string;
  }>();
  const [status, setStatus] = useState<'exchanging' | 'done' | 'error'>(
    code ? 'exchanging' : 'error',
  );

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      setStatus(error ? 'error' : 'done');
    });
  }, [code]);

  if (status === 'done') {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <Text style={[theme.type.body, { color: theme.colors.text }]}>
        {status === 'error'
          ? (errorDescription ?? 'This sign-in link is invalid or has expired.')
          : 'Signing you in…'}
      </Text>
    </Screen>
  );
}
