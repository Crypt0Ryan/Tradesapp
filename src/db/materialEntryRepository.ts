import { db } from './database';
import type { MaterialEntry, NewMaterialEntry } from '../models/MaterialEntry';

export async function createMaterialEntry(input: NewMaterialEntry): Promise<MaterialEntry> {
  const entry: MaterialEntry = { ...input, id: crypto.randomUUID() };
  await db.materialEntries.add(entry);
  return entry;
}

export function getMaterialEntry(id: string): Promise<MaterialEntry | undefined> {
  return db.materialEntries.get(id);
}

export function listMaterialEntriesByJob(jobId: string): Promise<MaterialEntry[]> {
  return db.materialEntries.where('job_id').equals(jobId).toArray();
}

export async function updateMaterialEntry(id: string, changes: Partial<Omit<MaterialEntry, 'id'>>): Promise<void> {
  await db.materialEntries.update(id, changes);
}

export function deleteMaterialEntry(id: string): Promise<void> {
  return db.materialEntries.delete(id);
}
