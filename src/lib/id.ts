import { randomUUID } from 'expo-crypto';

/** Client-generated ID for every local row — see CLAUDE.md "Modelo local-first": no server assigns these. */
export function generateId(): string {
  return randomUUID();
}
