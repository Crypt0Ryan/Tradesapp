import { db } from './database';
import type { ContractorLog, NewContractorLog } from '../models/ContractorLog';

export async function createContractorLog(input: NewContractorLog): Promise<ContractorLog> {
  const entry: ContractorLog = { ...input, id: crypto.randomUUID() };
  await db.contractorLogs.add(entry);
  return entry;
}

export function listContractorLogsByJob(jobId: string): Promise<ContractorLog[]> {
  return db.contractorLogs.where('job_id').equals(jobId).toArray();
}

export async function updateContractorLog(id: string, changes: Partial<Omit<ContractorLog, 'id'>>): Promise<void> {
  await db.contractorLogs.update(id, changes);
}

export function deleteContractorLog(id: string): Promise<void> {
  return db.contractorLogs.delete(id);
}
