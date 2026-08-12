import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { updateVoiceNote, assignVoiceNoteToJob, deleteVoiceNote } from '../../db/voiceNoteRepository';
import { formatDate } from '../../lib/date';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  async function handleAssign(jobId: string) {
    await assignVoiceNoteToJob(note.id, jobId);
  }

  async function handleDelete() {
    await deleteVoiceNote(note.id);
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          aria-label="Delete voice note"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <audio controls src={note.audio_url} className="h-10 w-full" />
      <Textarea
        rows={2}
        placeholder={note.raw_transcript === null ? 'No transcript captured - type one manually if you like' : ''}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        onBlur={commitTranscript}
      />
      {assignableJobs && (
        <Select onValueChange={handleAssign}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Assign to job…" />
          </SelectTrigger>
          <SelectContent>
            {assignableJobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </li>
  );
}
