import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addParticipant,
  createTrip,
  getTrip,
  listParticipants,
  listTrips,
  listTrashedTrips,
  permanentlyDeleteTrip,
  removeParticipant,
  restoreTrip,
  trashTrip,
  updateTrip,
  type TripUpdate,
} from './api';
import type { NewTripInput } from './types';

const tripsKey = ['trips'] as const;
const tripKey = (id: string) => ['trips', id] as const;
const trashKey = ['trips', 'trash'] as const;
const participantsKey = (tripId: string) => ['trips', tripId, 'participants'] as const;

export function useTrips() {
  return useQuery({ queryKey: tripsKey, queryFn: listTrips });
}

export function useTrashedTrips() {
  return useQuery({ queryKey: trashKey, queryFn: listTrashedTrips });
}

export function useTrip(id: string) {
  return useQuery({ queryKey: tripKey(id), queryFn: () => getTrip(id), enabled: !!id });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTripInput) => createTrip(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripsKey }),
  });
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: TripUpdate) => updateTrip(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsKey });
      queryClient.invalidateQueries({ queryKey: tripKey(id) });
    },
  });
}

export function useTrashTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trashTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsKey });
      queryClient.invalidateQueries({ queryKey: trashKey });
    },
  });
}

export function useRestoreTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsKey });
      queryClient.invalidateQueries({ queryKey: trashKey });
    },
  });
}

export function usePermanentlyDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permanentlyDeleteTrip(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trashKey }),
  });
}

export function useParticipants(tripId: string) {
  return useQuery({
    queryKey: participantsKey(tripId),
    queryFn: () => listParticipants(tripId),
    enabled: !!tripId,
  });
}

export function useAddParticipant(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) => addParticipant(tripId, displayName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantsKey(tripId) }),
  });
}

export function useRemoveParticipant(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeParticipant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantsKey(tripId) }),
  });
}
