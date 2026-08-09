import { recognize } from 'tesseract.js';

export interface OcrResult {
  rawText: string;
  confidence: number;
}

/**
 * Runs free, in-browser OCR (Tesseract.js, no backend/API key/cost). The
 * recognition model is fetched from a CDN on first use and cached by the
 * browser after that - needs internet the first time, same tradeoff as the
 * voice notes feature's live transcription. Callers must treat OCR as
 * best-effort: on any failure (most commonly: offline on first use), save
 * the raw photo regardless and let the user fill fields in by hand.
 */
export async function runOcr(imageDataUrl: string): Promise<OcrResult> {
  const {
    data: { text, confidence },
  } = await recognize(imageDataUrl, 'eng');
  return { rawText: text, confidence };
}

export interface ParsedReceiptFields {
  vendor: string | null;
  date: string | null;
  total: number | null;
}

const DATE_PATTERN = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/;
const MONEY_PATTERN = /\$?\s?(\d{1,4}(?:[.,]\d{2}))\b/g;

/**
 * Rough heuristics for pulling vendor/date/total out of raw OCR text - not
 * an LLM, just pattern-matching a typical receipt layout. Always wrong
 * often enough that this must stay editable, never auto-confirmed.
 */
export function parseReceiptFields(rawText: string): ParsedReceiptFields {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const vendor = lines.find((line) => /[a-zA-Z]{3,}/.test(line)) ?? null;

  const dateMatch = rawText.match(DATE_PATTERN);
  let date: string | null = null;
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    let year = Number(dateMatch[3]);
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const totalLine = lines.find((line) => /total/i.test(line) && !/sub\s*total/i.test(line));
  const searchText = totalLine ?? rawText;
  const amounts = [...searchText.matchAll(MONEY_PATTERN)].map((m) => Number(m[1].replace(',', '.')));
  const total = amounts.length > 0 ? Math.max(...amounts) : null;

  return { vendor, date, total };
}
