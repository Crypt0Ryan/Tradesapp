import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceNoteCard } from './VoiceNoteCard';

export function VoiceNotesPanel({ jobId }: { jobId: string }) {
  const notes = useLiveQuery(() => db.voiceNotes.where('job_id').equals(jobId).toArray(), [jobId]);

  return (
    <section>
      <h3>Voice Notes</h3>

      <VoiceRecorder jobId={jobId} />

      <ul>
        {notes?.map((note) => (
          <VoiceNoteCard key={note.id} note={note} />
        ))}
        {notes?.length === 0 && <li>No voice notes for this job yet.</li>}
      </ul>
    </section>
  );
}
