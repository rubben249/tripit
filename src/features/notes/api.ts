import { getDb } from '@/lib/db/client';
import { generateId } from '@/lib/id';

import type { NewNotePhotoInput, NotePhoto } from './types';

interface NotePhotoRow {
  id: string;
  note_id: string;
  name: string;
  data: string;
  created_at: string;
}

function rowToNotePhoto(row: NotePhotoRow): NotePhoto {
  return {
    id: row.id,
    noteId: row.note_id,
    name: row.name,
    data: row.data,
    createdAt: row.created_at,
  };
}

export async function listNotePhotos(noteId: string): Promise<NotePhoto[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NotePhotoRow>(
    'select * from note_photos where note_id = ? order by created_at asc',
    noteId,
  );
  return rows.map(rowToNotePhoto);
}

export async function addNotePhoto(noteId: string, input: NewNotePhotoInput): Promise<NotePhoto> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    'insert into note_photos (id, note_id, name, data, created_at) values (?, ?, ?, ?, ?)',
    id,
    noteId,
    input.name,
    input.data,
    now,
  );
  return { id, noteId, name: input.name, data: input.data, createdAt: now };
}

export async function renameNotePhoto(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('update note_photos set name = ? where id = ?', name, id);
}

export async function deleteNotePhoto(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('delete from note_photos where id = ?', id);
}
