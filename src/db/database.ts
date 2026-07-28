import Dexie, { type EntityTable } from 'dexie';
import type { Client } from '../models/Client';
import type { Job } from '../models/Job';
import type { TimeEntry } from '../models/TimeEntry';

export class TradesAppDB extends Dexie {
  clients!: EntityTable<Client, 'id'>;
  jobs!: EntityTable<Job, 'id'>;
  timeEntries!: EntityTable<TimeEntry, 'id'>;

  constructor() {
    super('TradesAppDB');
    this.version(1).stores({
      clients: 'id, user_id, name',
      jobs: 'id, client_id, status, start_date',
      timeEntries: 'id, job_id, user_id, start_time, end_time',
    });
  }
}

export const db = new TradesAppDB();
