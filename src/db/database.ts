import Dexie, { type EntityTable } from 'dexie';
import type { Client } from '../models/Client';
import type { ContractorLog } from '../models/ContractorLog';
import type { Job } from '../models/Job';
import type { MaterialEntry } from '../models/MaterialEntry';
import type { Photo } from '../models/Photo';
import type { Receipt } from '../models/Receipt';
import type { TimeEntry } from '../models/TimeEntry';
import type { TravelEntry } from '../models/TravelEntry';
import type { VoiceNote } from '../models/VoiceNote';

export class TradesAppDB extends Dexie {
  clients!: EntityTable<Client, 'id'>;
  jobs!: EntityTable<Job, 'id'>;
  timeEntries!: EntityTable<TimeEntry, 'id'>;
  materialEntries!: EntityTable<MaterialEntry, 'id'>;
  travelEntries!: EntityTable<TravelEntry, 'id'>;
  photos!: EntityTable<Photo, 'id'>;
  voiceNotes!: EntityTable<VoiceNote, 'id'>;
  receipts!: EntityTable<Receipt, 'id'>;
  contractorLogs!: EntityTable<ContractorLog, 'id'>;

  constructor() {
    super('TradesAppDB');
    this.version(1).stores({
      clients: 'id, user_id, name',
      jobs: 'id, client_id, status, start_date',
      timeEntries: 'id, job_id, user_id, start_time, end_time',
      materialEntries: 'id, job_id, receipt_id',
      travelEntries: 'id, job_id, user_id, date',
      photos: 'id, job_id, taken_at',
      voiceNotes: 'id, job_id, status, created_at',
      receipts: 'id, job_id, status, created_at',
      contractorLogs: 'id, job_id, date',
    });
  }
}

export const db = new TradesAppDB();
