import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text } from 'react-native';

import { useCurrencies } from '@/features/expenses/hooks';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { TextField } from './TextField';

/** Shown while the live list loads (or if it fails) so the picker still works offline. */
const FALLBACK_CURRENCIES: Record<string, string> = {
  EUR: 'Euro',
  USD: 'US Dollar',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  MXN: 'Mexican Peso',
  BRL: 'Brazilian Real',
  CNY: 'Chinese Yuan',
};

/** A picker over real ISO currency codes — no free text, so there's no way to end up converting against a currency that doesn't exist. */
export function CurrencyField({
  label,
  value,
  onChange,
  name,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  name?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data } = useCurrencies();
  const currencies = data ?? FALLBACK_CURRENCIES;
  const trigger = useHoverable();

  const entries = useMemo(() => {
    const all = Object.entries(currencies).sort((a, b) => a[0].localeCompare(b[0]));
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      ([code, name]) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q),
    );
  }, [currencies, query]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        nativeID={name}
        onHoverIn={trigger.onHoverIn}
        onHoverOut={trigger.onHoverOut}
        style={({ pressed }) => ({
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.75 : trigger.hovered ? 0.88 : 1,
        })}
      >
        <Text style={[theme.type.body, { color: theme.colors.text }]}>{value}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(23,17,11,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.space.lg,
          }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              maxHeight: '70%',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.space.md,
              gap: theme.space.sm,
            }}
          >
            <Text style={[theme.type.title, { color: theme.colors.text }]}>{label}</Text>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Search currency…"
              autoFocus
              name="currency-search"
            />
            <ScrollView>
              {entries.map(([code, name]) => (
                <CurrencyOption
                  key={code}
                  code={code}
                  name={name}
                  selected={code === value}
                  onPress={() => {
                    onChange(code);
                    setQuery('');
                    setOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function CurrencyOption({
  code,
  name,
  selected,
  onPress,
}: {
  code: string;
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.space.sm,
        paddingHorizontal: theme.space.xs,
        borderRadius: theme.radius.sm,
        backgroundColor: selected ? theme.colors.surfaceAlt : 'transparent',
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      <Text style={[theme.type.data, { color: theme.colors.text }]}>{code}</Text>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{name}</Text>
    </Pressable>
  );
}
