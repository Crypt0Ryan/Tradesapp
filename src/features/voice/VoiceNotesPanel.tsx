import { useLiveQuery } from 'dexie-react-hooks';
import { Mic } from 'lucide-react';
import { db } from '../../db/database';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceNoteCard } from './VoiceNoteCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function VoiceNotesPanel({ jobId }: { jobId: string }) {
  const notes = useLiveQuery(() => db.voiceNotes.where('job_id').equals(jobId).toArray(), [jobId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="size-4.5 text-accent" />
          Voice Notes
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <VoiceRecorder jobId={jobId} />

        <ul className="flex flex-col gap-2">
          {notes?.map((note) => (
            <VoiceNoteCard key={note.id} note={note} />
          ))}
          {notes?.length === 0 && <li className="text-sm text-muted-foreground">No voice notes for this job yet.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
