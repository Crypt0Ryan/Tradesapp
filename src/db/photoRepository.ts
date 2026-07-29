import { db } from './database';
import type { Photo, NewPhoto } from '../models/Photo';

export async function createPhoto(input: NewPhoto): Promise<Photo> {
  const photo: Photo = { ...input, id: crypto.randomUUID() };
  await db.photos.add(photo);
  return photo;
}

export function listPhotosByJob(jobId: string): Promise<Photo[]> {
  return db.photos.where('job_id').equals(jobId).toArray();
}

export async function updatePhotoCaption(id: string, caption: string): Promise<void> {
  await db.photos.update(id, { caption });
}

export function deletePhoto(id: string): Promise<void> {
  return db.photos.delete(id);
}
