import { useLiveQuery } from 'dexie-react-hooks';
import { Mic } from 'lucide-react';
import { db } from '../../db/database';
import { listUnassignedVoiceNotes } from '../../db/voiceNoteRepository';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceNoteCard } from './VoiceNoteCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function VoiceInboxPanel() {
  const notes = useLiveQuery(() => listUnassignedVoiceNotes(), []);
  const jobs = useLiveQuery(() => db.jobs.toArray(), []);
  const clients = useLiveQuery(() => db.clients.toArray(), []);

  const jobsForAssignment =
    jobs?.map((job) => ({
      ...job,
      title: `${job.title} — ${clients?.find((c) => c.id === job.client_id)?.name ?? 'Unknown client'}`,
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="size-4.5 text-accent" />
          Voice Notes
        </CardTitle>
        <CardDescription>Capture a quick note before you know which job it belongs to - assign it later.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <VoiceRecorder jobId={null} />

        <ul className="flex flex-col gap-2">
          {notes?.map((note) => (
            <VoiceNoteCard key={note.id} note={note} assignableJobs={jobsForAssignment} />
          ))}
          {notes?.length === 0 && <li className="text-sm text-muted-foreground">No unassigned voice notes.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
