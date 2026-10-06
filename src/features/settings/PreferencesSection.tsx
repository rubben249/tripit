import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CurrencyField } from '@/components/CurrencyField';
import { FieldLabel, SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { useHoverable } from '@/lib/useHoverable';
import { useTheme } from '@/theme/ThemeProvider';

import { useSettings, useUpdateSetting } from './hooks';
import { THEME_OPTIONS, type Settings } from './types';

export function PreferencesSection() {
  const theme = useTheme();
  const settings = useSettings();
  const update = useUpdateSetting();

  return (
    <View style={{ gap: theme.space.md }}>
      <SectionTitle>Preferences</SectionTitle>

      <Field label="YOUR NAME" hint="Shown to people you share a trip with.">
        {/* Keyed by the saved value so the field resets once settings finish loading. */}
        <NameField key={settings.displayName} initial={settings.displayName} />
      </Field>

      <Field label="DEFAULT CURRENCY" hint="Used for new trips and your travel totals.">
        <CurrencyField
          label="Default currency"
          value={settings.defaultCurrency}
          onChange={(code) => update.mutate({ key: 'defaultCurrency', value: code })}
          name="default-currency"
        />
      </Field>

      <Field label="APPEARANCE">
        <View style={{ flexDirection: 'row', gap: theme.space.xs }}>
          {THEME_OPTIONS.map((option) => (
            <ThemeChip
              key={option.key}
              label={option.label}
              selected={settings.theme === option.key}
              onPress={() => update.mutate({ key: 'theme', value: option.key })}
            />
          ))}
        </View>
      </Field>
    </View>
  );
}

function NameField({ initial }: { initial: Settings['displayName'] }) {
  const update = useUpdateSetting();
  const [name, setName] = useState(initial);
  return (
    <TextField
      value={name}
      onChangeText={setName}
      onBlur={() => {
        if (name.trim() !== initial) update.mutate({ key: 'displayName', value: name.trim() });
      }}
      placeholder="e.g. Rubén"
      name="display-name"
    />
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.xs }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint ? (
        <Text style={[theme.type.caption, { color: theme.colors.textFaint }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

function ThemeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        minHeight: 40,
        justifyContent: 'center',
        paddingHorizontal: theme.space.lg,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        backgroundColor: selected ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      <Text
        style={[
          theme.type.body,
          { fontSize: 15, color: selected ? theme.colors.onInk : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
