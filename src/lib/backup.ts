import { db } from '../db/database';
import { getBusinessSettings, saveBusinessSettings, type BusinessSettings } from './businessSettings';
import type { Client } from '../models/Client';
import type { Job } from '../models/Job';
import type { TimeEntry } from '../models/TimeEntry';
import type { MaterialEntry } from '../models/MaterialEntry';
import type { MaterialLibraryItem } from '../models/MaterialLibraryItem';
import type { TravelEntry } from '../models/TravelEntry';
import type { Photo } from '../models/Photo';
import type { VoiceNote } from '../models/VoiceNote';
import type { Receipt } from '../models/Receipt';
import type { ContractorLog } from '../models/ContractorLog';
import type { SubJob } from '../models/SubJob';

const BACKUP_FORMAT = 'tradesapp-backup';
const BACKUP_VERSION = 1;

export interface BackupData {
  format: typeof BACKUP_FORMAT;
  version: number;
  exported_at: string;
  businessSettings: BusinessSettings;
  tables: {
    clients: Client[];
    jobs: Job[];
    timeEntries: TimeEntry[];
    materialEntries: MaterialEntry[];
    materialLibrary: MaterialLibraryItem[];
    travelEntries: TravelEntry[];
    photos: Photo[];
    voiceNotes: VoiceNote[];
    receipts: Receipt[];
    contractorLogs: ContractorLog[];
    /** Absent in backups made before sub-jobs existed. */
    subJobs?: SubJob[];
  };
}

export interface BackupSummary {
  clients: number;
  jobs: number;
  timeEntries: number;
  materialEntries: number;
  materialLibrary: number;
  travelEntries: number;
  photos: number;
  voiceNotes: number;
  receipts: number;
  contractorLogs: number;
  subJobs: number;
}

/**
 * Everything in this app lives only in this browser's IndexedDB - there's no
 * server copy, so this is the only real safety net against a cleared cache,
 * a browser reinstall, or Safari's storage-eviction policy on inactive sites.
 * Downloads a single JSON file with every table plus business settings.
 */
export async function exportBackup(): Promise<void> {
  const [clients, jobs, timeEntries, materialEntries, materialLibrary, travelEntries, photos, voiceNotes, receipts, contractorLogs, subJobs] =
    await Promise.all([
      db.clients.toArray(),
      db.jobs.toArray(),
      db.timeEntries.toArray(),
      db.materialEntries.toArray(),
      db.materialLibrary.toArray(),
      db.travelEntries.toArray(),
      db.photos.toArray(),
      db.voiceNotes.toArray(),
      db.receipts.toArray(),
      db.contractorLogs.toArray(),
      db.subJobs.toArray(),
    ]);

  const backup: BackupData = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    businessSettings: getBusinessSettings(),
    tables: {
      clients,
      jobs,
      timeEntries,
      materialEntries,
      materialLibrary,
      travelEntries,
      photos,
      voiceNotes,
      receipts,
      contractorLogs,
      subJobs,
    },
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tradesapp_backup_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function summarizeBackup(backup: BackupData): BackupSummary {
  return {
    clients: backup.tables.clients.length,
    jobs: backup.tables.jobs.length,
    timeEntries: backup.tables.timeEntries.length,
    materialEntries: backup.tables.materialEntries.length,
    materialLibrary: backup.tables.materialLibrary?.length ?? 0,
    travelEntries: backup.tables.travelEntries.length,
    photos: backup.tables.photos.length,
    voiceNotes: backup.tables.voiceNotes.length,
    receipts: backup.tables.receipts.length,
    contractorLogs: backup.tables.contractorLogs.length,
    subJobs: backup.tables.subJobs?.length ?? 0,
  };
}

export async function readBackupFile(file: File): Promise<BackupData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON - it doesn't look like a Tradesapp backup.");
  }

  const candidate = parsed as Partial<BackupData>;
  if (candidate?.format !== BACKUP_FORMAT || !candidate.tables) {
    throw new Error("This doesn't look like a Tradesapp backup file.");
  }

  return candidate as BackupData;
}

/**
 * Replaces every table with the backup's contents - destructive, the caller
 * must get explicit confirmation first (see BackupView).
 */
export async function restoreBackup(backup: BackupData): Promise<void> {
  const t = backup.tables;
  await db.transaction(
    'rw',
    [
      db.clients,
      db.jobs,
      db.timeEntries,
      db.materialEntries,
      db.materialLibrary,
      db.travelEntries,
      db.photos,
      db.voiceNotes,
      db.receipts,
      db.contractorLogs,
      db.subJobs,
    ],
    async () => {
      await Promise.all([
        db.clients.clear(),
        db.jobs.clear(),
        db.timeEntries.clear(),
        db.materialEntries.clear(),
        db.materialLibrary.clear(),
        db.travelEntries.clear(),
        db.photos.clear(),
        db.voiceNotes.clear(),
        db.receipts.clear(),
        db.contractorLogs.clear(),
        db.subJobs.clear(),
      ]);
      await Promise.all([
        db.clients.bulkAdd(t.clients ?? []),
        db.jobs.bulkAdd(t.jobs ?? []),
        db.timeEntries.bulkAdd(t.timeEntries ?? []),
        db.materialEntries.bulkAdd(t.materialEntries ?? []),
        db.materialLibrary.bulkAdd(t.materialLibrary ?? []),
        db.travelEntries.bulkAdd(t.travelEntries ?? []),
        db.photos.bulkAdd(t.photos ?? []),
        db.voiceNotes.bulkAdd(t.voiceNotes ?? []),
        db.receipts.bulkAdd(t.receipts ?? []),
        db.contractorLogs.bulkAdd(t.contractorLogs ?? []),
        db.subJobs.bulkAdd(t.subJobs ?? []),
      ]);
    },
  );

  if (backup.businessSettings) {
    saveBusinessSettings(backup.businessSettings);
  }
}
