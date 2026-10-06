import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { SectionTitle } from '@/components/SectionTitle';
import { downloadJson, filesSupported, pickJsonFile } from '@/lib/files';
import { plural } from '@/lib/plural';
import { useTheme } from '@/theme/ThemeProvider';

import { exportAll, importBundle } from './api';
import { bundleSchema, summarizeBundle } from './bundle';

/** Everything lives only on this device (local-first), so a backup file is the way to survive a
 * new phone or a cleared browser. Restoring adds what's missing and never overwrites. */
export function BackupSection() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setMessage('');
    const bundle = await exportAll();
    downloadJson(`tripit-backup-${format(new Date(), 'yyyy-MM-dd')}.json`, bundle);
    const s = summarizeBundle(bundle.tables);
    setMessage(
      `Backup saved: ${plural(s.trips, 'trip')}, ${plural(s.notes, 'note')}, ${plural(s.photos, 'photo')}.`,
    );
  };

  const onImport = async () => {
    setMessage('');
    try {
      const raw = await pickJsonFile();
      if (raw == null) return;
      const parsed = bundleSchema.safeParse(raw);
      if (!parsed.success) {
        setMessage('That file is not a TripIt backup.');
        return;
      }
      const s = summarizeBundle(parsed.data.tables);
      const ok = await confirm({
        title: 'Restore this backup?',
        message: `It has ${plural(s.trips, 'trip')}, ${plural(s.reservations, 'reservation')}, ${plural(s.notes, 'note')}, ${plural(s.tasks, 'task')} and ${plural(s.photos, 'photo')}. Anything already on this device stays as it is — only what's missing is added.`,
        confirmLabel: 'Restore',
      });
      if (!ok) return;
      setBusy(true);
      await importBundle(parsed.data.tables, 'keepIds');
      await queryClient.invalidateQueries();
      setMessage('Backup restored.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not restore that file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <SectionTitle hint="Your trips live only on this device. Save a backup file now and then, and restore it on a new phone or browser.">
        Backup
      </SectionTitle>
      {filesSupported ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          <Button
            variant="primary"
            icon="download-outline"
            style={{ flexGrow: 1 }}
            onPress={onExport}
          >
            Download backup
          </Button>
          <Button
            variant="secondary"
            icon="refresh-outline"
            loading={busy}
            style={{ flexGrow: 1 }}
            onPress={onImport}
          >
            Restore from file
          </Button>
        </View>
      ) : (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          Backups are available in the web app for now.
        </Text>
      )}
      {message ? (
        <Text style={[theme.type.caption, { color: theme.colors.accent }]}>{message}</Text>
      ) : null}
      {dialog}
    </View>
  );
}
