import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { listUnassignedVoiceNotes } from '../../db/voiceNoteRepository';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceNoteCard } from './VoiceNoteCard';

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
    <section>
      <h2>Voice Notes</h2>
      <p>Capture a quick note before you know which job it belongs to - assign it later.</p>

      <VoiceRecorder jobId={null} />

      <ul>
        {notes?.map((note) => (
          <VoiceNoteCard key={note.id} note={note} assignableJobs={jobsForAssignment} />
        ))}
        {notes?.length === 0 && <li>No unassigned voice notes.</li>}
      </ul>
    </section>
  );
}
