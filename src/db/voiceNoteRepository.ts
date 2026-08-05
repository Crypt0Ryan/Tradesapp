import { db } from './database';
import type { VoiceNote, NewVoiceNote } from '../models/VoiceNote';

export async function createVoiceNote(input: NewVoiceNote): Promise<VoiceNote> {
  const note: VoiceNote = { ...input, id: crypto.randomUUID() };
  await db.voiceNotes.add(note);
  return note;
}

/**
 * `null` isn't a valid IndexedDB key, so this can't use the job_id index via
 * .where().equals() - falls back to a full-table filter instead, which is
 * fine at this app's scale (one tradesperson's local data, not a server).
 */
export function listUnassignedVoiceNotes(): Promise<VoiceNote[]> {
  return db.voiceNotes.filter((note) => note.job_id === null).toArray();
}

export function listVoiceNotesByJob(jobId: string): Promise<VoiceNote[]> {
  return db.voiceNotes.where('job_id').equals(jobId).toArray();
}

export async function updateVoiceNote(id: string, changes: Partial<Omit<VoiceNote, 'id'>>): Promise<void> {
  await db.voiceNotes.update(id, changes);
}

export function assignVoiceNoteToJob(id: string, jobId: string): Promise<void> {
  return updateVoiceNote(id, { job_id: jobId, status: 'confirmed' });
}

export function deleteVoiceNote(id: string): Promise<void> {
  return db.voiceNotes.delete(id);
}
