import { db } from './database';
import type { Client, NewClient } from '../models/Client';

export async function createClient(input: NewClient): Promise<Client> {
  const client: Client = { ...input, id: crypto.randomUUID() };
  await db.clients.add(client);
  return client;
}

export function getClient(id: string): Promise<Client | undefined> {
  return db.clients.get(id);
}

export function listClientsByUser(userId: string): Promise<Client[]> {
  return db.clients.where('user_id').equals(userId).toArray();
}

export async function updateClient(id: string, changes: Partial<Omit<Client, 'id'>>): Promise<void> {
  await db.clients.update(id, changes);
}

export function deleteClient(id: string): Promise<void> {
  return db.clients.delete(id);
}
