import { db } from './database';
import type { TimeEntry, NewTimeEntry } from '../models/TimeEntry';

export async function createTimeEntry(input: NewTimeEntry): Promise<TimeEntry> {
  const entry: TimeEntry = { ...input, id: crypto.randomUUID() };
  await db.timeEntries.add(entry);
  return entry;
}

export function getTimeEntry(id: string): Promise<TimeEntry | undefined> {
  return db.timeEntries.get(id);
}

export function listTimeEntriesByJob(jobId: string): Promise<TimeEntry[]> {
  return db.timeEntries.where('job_id').equals(jobId).toArray();
}

export async function updateTimeEntry(id: string, changes: Partial<Omit<TimeEntry, 'id'>>): Promise<void> {
  await db.timeEntries.update(id, changes);
}

export function deleteTimeEntry(id: string): Promise<void> {
  return db.timeEntries.delete(id);
}

/** Starts a running timer (end_time null) for a job. */
export function startTimer(jobId: string, userId: string, billable = true): Promise<TimeEntry> {
  return createTimeEntry({
    job_id: jobId,
    user_id: userId,
    start_time: new Date().toISOString(),
    end_time: null,
    duration_minutes: null,
    billable,
    source: 'timer',
    notes: '',
  });
}

/** Stops a running timer and computes duration_minutes from start_time. */
export async function stopTimer(id: string): Promise<void> {
  const entry = await db.timeEntries.get(id);
  if (!entry || entry.end_time) return;

  const end = new Date();
  const durationMinutes = Math.round((end.getTime() - new Date(entry.start_time).getTime()) / 60000);

  await db.timeEntries.update(id, {
    end_time: end.toISOString(),
    duration_minutes: durationMinutes,
  });
}
