import { db } from './database';
import type { Job, NewJob } from '../models/Job';

export async function createJob(input: NewJob): Promise<Job> {
  const now = new Date().toISOString();
  const job: Job = {
    ...input,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  await db.jobs.add(job);
  return job;
}

export function getJob(id: string): Promise<Job | undefined> {
  return db.jobs.get(id);
}

export function listJobs(): Promise<Job[]> {
  return db.jobs.toArray();
}

export function listJobsByClient(clientId: string): Promise<Job[]> {
  return db.jobs.where('client_id').equals(clientId).toArray();
}

export async function updateJob(id: string, changes: Partial<Omit<Job, 'id' | 'created_at'>>): Promise<void> {
  await db.jobs.update(id, { ...changes, updated_at: new Date().toISOString() });
}

/** Deletes a job and everything logged against it - otherwise those records would be orphaned garbage, unreachable from any screen. */
export function deleteJob(id: string): Promise<void> {
  return db.transaction(
    'rw',
    [db.jobs, db.timeEntries, db.materialEntries, db.travelEntries, db.photos, db.voiceNotes],
    async () => {
      await db.timeEntries.where('job_id').equals(id).delete();
      await db.materialEntries.where('job_id').equals(id).delete();
      await db.travelEntries.where('job_id').equals(id).delete();
      await db.photos.where('job_id').equals(id).delete();
      await db.voiceNotes.where('job_id').equals(id).delete();
      await db.jobs.delete(id);
    },
  );
}
