import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createPhoto, updatePhotoCaption, deletePhoto } from '../../db/photoRepository';
import { formatDate } from '../../lib/date';
import type { Photo } from '../../models/Photo';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function PhotoCard({ photo }: { photo: Photo }) {
  const [caption, setCaption] = useState(photo.caption);

  async function commitCaption() {
    if (caption !== photo.caption) await updatePhotoCaption(photo.id, caption);
  }

  return (
    <figure style={{ display: 'inline-block', margin: '8px', width: '150px' }}>
      <img src={photo.image_url} alt={photo.caption || 'Job photo'} style={{ width: '100%' }} />
      <figcaption>
        {formatDate(photo.taken_at)}
        <br />
        <input
          type="text"
          placeholder="Caption (e.g. before, after)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={commitCaption}
        />
        <button type="button" onClick={() => deletePhoto(photo.id)}>
          Remove
        </button>
      </figcaption>
    </figure>
  );
}

export function PhotosPanel({ jobId }: { jobId: string }) {
  const photos = useLiveQuery(() => db.photos.where('job_id').equals(jobId).toArray(), [jobId]);

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    const form = e.currentTarget;

    const imageUrl = await readFileAsDataUrl(file);
    await createPhoto({
      job_id: jobId,
      image_url: imageUrl,
      caption: caption.trim(),
      taken_at: new Date().toISOString(),
    });

    setFile(null);
    setCaption('');
    form.reset();
  }

  return (
    <section>
      <h3>Photos</h3>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <input
          type="text"
          placeholder="Caption (e.g. before, after)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button type="submit" disabled={!file}>
          Add photo
        </button>
      </form>

      <div>
        {photos?.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
        {photos?.length === 0 && <p>No photos yet.</p>}
      </div>
    </section>
  );
}
