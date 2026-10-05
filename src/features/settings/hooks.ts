import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getSettings, setSetting } from './api';
import { settingsSchema, type Settings } from './types';

const settingsKey = ['settings'] as const;

const DEFAULT_SETTINGS = settingsSchema.parse({});

/** Always returns a full Settings object — defaults until the local database has answered. */
export function useSettings(): Settings {
  const { data } = useQuery({ queryKey: settingsKey, queryFn: getSettings });
  return data ?? DEFAULT_SETTINGS;
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setSetting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKey }),
  });
}
