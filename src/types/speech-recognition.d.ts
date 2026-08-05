/**
 * Minimal ambient types for the (non-standard, not in TS's DOM lib) Web
 * Speech API - just enough of the shape this app actually uses.
 * Supported in Chrome/Edge/Android via the vendor-prefixed
 * webkitSpeechRecognition; absent entirely in Safari/iOS.
 */
interface SpeechRecognitionResult {
  readonly [index: number]: { transcript: string };
  readonly length: number;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}
