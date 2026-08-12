import { useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { createVoiceNote } from '../../db/voiceNoteRepository';
import { Button } from '@/components/ui/button';

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export const isTranscriptionSupported = typeof window !== 'undefined' && !!getSpeechRecognitionCtor();

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function VoiceRecorder({ jobId }: { jobId: string | null }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  async function handleStart() {
    setError(null);
    setTranscript('');
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Could not access the microphone - check permissions and try again.');
      return;
    }
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0].transcript;
        }
        setTranscript(combined);
      };
      recognition.onerror = () => {
        // Transcription is a best-effort bonus - failures here must never block the audio save.
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        // Some browsers throw if recognition is already running; audio recording is unaffected.
      }
    }

    setIsRecording(true);
  }

  async function handleStop() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setIsRecording(false);
    setIsSaving(true);

    recognitionRef.current?.stop();

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());

    const audioUrl = await blobToDataUrl(blob);

    await createVoiceNote({
      job_id: jobId,
      audio_url: audioUrl,
      raw_transcript: transcript.trim() || null,
      parsed_result: null,
      status: 'pending_review',
      created_at: new Date().toISOString(),
    });

    setIsSaving(false);
    setTranscript('');
  }

  return (
    <div className="flex flex-col gap-2">
      {isRecording ? (
        <Button type="button" variant="destructive" onClick={handleStop} className="w-fit gap-2">
          <Square className="size-4 animate-pulse" />
          Stop recording
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleStart}
          disabled={isSaving}
          className="w-fit gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Mic className="size-4" />
          {isSaving ? 'Saving…' : 'Record voice note'}
        </Button>
      )}
      {isRecording && (
        <p className="text-sm text-muted-foreground">
          Recording…{' '}
          {isTranscriptionSupported ? (
            <span className="italic">{transcript || 'listening…'}</span>
          ) : (
            <span className="italic">(live transcription not supported in this browser - audio will still be saved)</span>
          )}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
