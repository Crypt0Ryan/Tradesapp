export type VoiceNoteStatus = 'pending_review' | 'confirmed';

export interface VoiceNoteParsedResult {
  hours: number | null;
  materials: string[];
  notes: string;
}

export interface VoiceNote {
  id: string;
  job_id: string | null;
  audio_url: string;
  raw_transcript: string | null;
  parsed_result: VoiceNoteParsedResult | null;
  status: VoiceNoteStatus;
  created_at: string;
}

export type NewVoiceNote = Omit<VoiceNote, 'id'>;
