import { recognize } from 'tesseract.js';
import type { ReceiptLineItem } from '../models/Receipt';

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

// Lines that are receipt boilerplate rather than a purchased item, even
// though they often end in a dollar amount too (e.g. "GST $4.50").
const NON_ITEM_LINE_PATTERN =
  /\b(sub ?total|total|gst|tax|change|cash|eftpos|visa|mastercard|amex|card|balance|amount due|thank you|receipt|invoice|tel|phone|abn|acn|www\.|\.com|date|time|qty|approved|auth|ref)\b/i;
const ITEM_LINE_PATTERN = /^(.{2,60}?)\s+\$?\s?(\d{1,4}(?:[.,]\d{2}))\s*$/;

/**
 * Best-effort split of a receipt's raw OCR text into candidate purchased
 * items (description + amount), one per line that looks like "name ... price"
 * and isn't an obvious total/tax/payment-method line. Same heuristic
 * philosophy as parseReceiptFields - never auto-confirmed, always shown to
 * the user to check/edit/deselect before anything is added to a job.
 */
export function parseReceiptLineItems(rawText: string): ReceiptLineItem[] {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const items: ReceiptLineItem[] = [];
  for (const line of lines) {
    if (NON_ITEM_LINE_PATTERN.test(line)) continue;

    const match = line.match(ITEM_LINE_PATTERN);
    if (!match) continue;

    const description = match[1].replace(/\s{2,}/g, ' ').trim();
    const amount = Number(match[2].replace(',', '.'));
    if (description.length < 2 || !/[a-zA-Z]/.test(description)) continue;
    if (!(amount > 0) || amount > 100000) continue;

    items.push({ description, amount });
  }

  return items.slice(0, 25);
}
