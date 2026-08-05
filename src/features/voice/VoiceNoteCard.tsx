import { useState } from 'react';
import { updateVoiceNote, assignVoiceNoteToJob, deleteVoiceNote } from '../../db/voiceNoteRepository';
import { formatDate } from '../../lib/date';
import type { VoiceNote } from '../../models/VoiceNote';
import type { Job } from '../../models/Job';

export function VoiceNoteCard({
  note,
  assignableJobs,
}: {
  note: VoiceNote;
  /** Jobs to offer in an "assign to job" dropdown - only relevant for unassigned (inbox) notes. */
  assignableJobs?: Job[];
}) {
  const [transcript, setTranscript] = useState(note.raw_transcript ?? '');

  async function commitTranscript() {
    if (transcript !== (note.raw_transcript ?? '')) {
      await updateVoiceNote(note.id, { raw_transcript: transcript.trim() || null });
    }
  }

  async function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const jobId = e.target.value;
    if (jobId) await assignVoiceNoteToJob(note.id, jobId);
  }

  async function handleDelete() {
    await deleteVoiceNote(note.id);
  }

  return (
    <li>
      <div>{formatDate(note.created_at)}</div>
      <audio controls src={note.audio_url} />
      <br />
      <textarea
        rows={2}
        placeholder={note.raw_transcript === null ? 'No transcript captured - type one manually if you like' : ''}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        onBlur={commitTranscript}
      />
      {assignableJobs && (
        <select defaultValue="" onChange={handleAssign}>
          <option value="" disabled>
            Assign to job…
          </option>
          {assignableJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      )}
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
    </li>
  );
}
