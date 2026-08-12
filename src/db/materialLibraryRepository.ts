import { db } from './database';
import { CURRENT_USER_ID } from '../features/currentUser';
import type { MaterialLibraryItem } from '../models/MaterialLibraryItem';

export function listMaterialLibrary(): Promise<MaterialLibraryItem[]> {
  return db.materialLibrary.where('user_id').equals(CURRENT_USER_ID).sortBy('name');
}

/**
 * Remembers a material for next time - called every time a material line is
 * added to a job, so the library builds itself up from real usage instead of
 * needing separate data entry. Matches by name (case-insensitive) so the
 * same item just keeps its price/unit up to date rather than duplicating.
 */
export async function upsertMaterialLibraryItem(input: { name: string; unit: string; unit_cost: number }): Promise<void> {
  const name = input.name.trim();
  if (!name) return;

  const existing = await db.materialLibrary
    .where('user_id')
    .equals(CURRENT_USER_ID)
    .filter((item) => item.name.toLowerCase() === name.toLowerCase())
    .first();

  const updated_at = new Date().toISOString();
  if (existing) {
    await db.materialLibrary.update(existing.id, { unit: input.unit, unit_cost: input.unit_cost, updated_at });
  } else {
    await db.materialLibrary.add({
      id: crypto.randomUUID(),
      user_id: CURRENT_USER_ID,
      name,
      unit: input.unit,
      unit_cost: input.unit_cost,
      updated_at,
    });
  }
}

export function deleteMaterialLibraryItem(id: string): Promise<void> {
  return db.materialLibrary.delete(id);
}
