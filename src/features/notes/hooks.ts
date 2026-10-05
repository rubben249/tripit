import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addNotePhoto, deleteNotePhoto, listNotePhotos, renameNotePhoto } from './api';
import type { NewNotePhotoInput } from './types';

const photosKey = (noteId: string) => ['notes', noteId, 'photos'] as const;

export function useNotePhotos(noteId: string) {
  return useQuery({
    queryKey: photosKey(noteId),
    queryFn: () => listNotePhotos(noteId),
    enabled: !!noteId,
  });
}

export function useAddNotePhoto(noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewNotePhotoInput) => addNotePhoto(noteId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photosKey(noteId) }),
  });
}

export function useRenameNotePhoto(noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameNotePhoto(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photosKey(noteId) }),
  });
}

export function useDeleteNotePhoto(noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotePhoto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photosKey(noteId) }),
  });
}
