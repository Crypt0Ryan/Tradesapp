import { db } from './database';
import type { Receipt, NewReceipt } from '../models/Receipt';

export async function createReceipt(input: NewReceipt): Promise<Receipt> {
  const receipt: Receipt = { ...input, id: crypto.randomUUID() };
  await db.receipts.add(receipt);
  return receipt;
}

/** `null` isn't a valid IndexedDB key for .where().equals() - full-table filter instead (fine at this scale). */
export function listUnassignedReceipts(): Promise<Receipt[]> {
  return db.receipts.filter((receipt) => receipt.job_id === null).toArray();
}

export function listReceiptsByJob(jobId: string): Promise<Receipt[]> {
  return db.receipts.where('job_id').equals(jobId).toArray();
}

export async function updateReceipt(id: string, changes: Partial<Omit<Receipt, 'id'>>): Promise<void> {
  await db.receipts.update(id, changes);
}

export function assignReceiptToJob(id: string, jobId: string): Promise<void> {
  return updateReceipt(id, { job_id: jobId, status: 'confirmed' });
}

export function deleteReceipt(id: string): Promise<void> {
  return db.receipts.delete(id);
}
