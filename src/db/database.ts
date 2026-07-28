import Dexie, { type EntityTable } from 'dexie';
import type { Job } from '../models/Job';
import type { TimeEntry } from '../models/TimeEntry';

export class TradesAppDB extends Dexie {
  jobs!: EntityTable<Job, 'id'>;
  timeEntries!: EntityTable<TimeEntry, 'id'>;

  constructor() {
    super('TradesAppDB');
    this.version(1).stores({
      jobs: 'id, client_id, status, start_date',
      timeEntries: 'id, job_id, user_id, start_time, end_time',
    });
  }
}

export const db = new TradesAppDB();
