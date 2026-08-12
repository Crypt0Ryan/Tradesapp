import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Images, X } from 'lucide-react';
import { db } from '../../db/database';
import { createPhoto, updatePhotoCaption, deletePhoto } from '../../db/photoRepository';
import { formatDate } from '../../lib/date';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <figure className="flex flex-col gap-1.5 overflow-hidden rounded-lg border border-border">
      <div className="relative aspect-square bg-muted">
        <img src={photo.image_url} alt={photo.caption || 'Job photo'} className="size-full object-cover" />
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          onClick={() => deletePhoto(photo.id)}
          aria-label="Remove photo"
          className="absolute top-1.5 right-1.5 bg-background/90 text-foreground hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <figcaption className="flex flex-col gap-1 px-2 pb-2">
        <span className="text-xs text-muted-foreground">{formatDate(photo.taken_at)}</span>
        <Input
          type="text"
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={commitCaption}
          className="h-9 text-sm"
        />
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Images className="size-4.5 text-accent" />
          Photos
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="flex-1"
          />
          <Input
            type="text"
            placeholder="Caption (e.g. before, after)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-48"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={!file}>
            Add photo
          </Button>
        </form>

        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No photos yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
