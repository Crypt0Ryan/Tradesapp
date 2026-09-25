import { db } from './database';
import type { SubJob, NewSubJob } from '../models/SubJob';

export async function createSubJob(input: NewSubJob): Promise<SubJob> {
  const subJob: SubJob = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  await db.subJobs.add(subJob);
  return subJob;
}

export async function renameSubJob(id: string, name: string): Promise<void> {
  await db.subJobs.update(id, { name });
}

/** Removes the sub-job and un-assigns its time/materials (they fall back to "General") - never deletes the entries themselves. */
export function deleteSubJob(id: string, jobId: string): Promise<void> {
  return db.transaction('rw', [db.subJobs, db.timeEntries, db.materialEntries], async () => {
    await db.timeEntries
      .where('job_id')
      .equals(jobId)
      .modify((entry) => {
        if (entry.sub_job_id === id) entry.sub_job_id = null;
      });
    await db.materialEntries
      .where('job_id')
      .equals(jobId)
      .modify((entry) => {
        if (entry.sub_job_id === id) entry.sub_job_id = null;
      });
    await db.subJobs.delete(id);
  });
}
