import { db } from './database';
import type { TravelEntry, NewTravelEntry } from '../models/TravelEntry';

export async function createTravelEntry(input: NewTravelEntry): Promise<TravelEntry> {
  const entry: TravelEntry = { ...input, id: crypto.randomUUID() };
  await db.travelEntries.add(entry);
  return entry;
}

export function getTravelEntry(id: string): Promise<TravelEntry | undefined> {
  return db.travelEntries.get(id);
}

export function listTravelEntriesByJob(jobId: string): Promise<TravelEntry[]> {
  return db.travelEntries.where('job_id').equals(jobId).toArray();
}

export async function updateTravelEntry(id: string, changes: Partial<Omit<TravelEntry, 'id'>>): Promise<void> {
  await db.travelEntries.update(id, changes);
}

export function deleteTravelEntry(id: string): Promise<void> {
  return db.travelEntries.delete(id);
}
