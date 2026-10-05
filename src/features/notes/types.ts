import { z } from 'zod';

export const notePhotoSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  name: z.string(),
  data: z.string(),
  createdAt: z.string(),
});
export type NotePhoto = z.infer<typeof notePhotoSchema>;

export const newNotePhotoInputSchema = z.object({
  name: z.string().min(1),
  data: z.string().min(1),
});
export type NewNotePhotoInput = z.infer<typeof newNotePhotoInputSchema>;
