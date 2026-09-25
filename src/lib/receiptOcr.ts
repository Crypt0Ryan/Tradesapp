import { createWorker, PSM } from 'tesseract.js';
import { prepareForOcr } from './imagePrep';
import { rowsFromLines, type OcrLine } from './receiptParser';

export { parseReceiptText, rowsFromLines } from './receiptParser';
export type { ParsedReceipt, ParsedReceiptItem } from './receiptParser';

export interface OcrResult {
  /** The text the scanner read, one visual row per line (price columns stay on their item's row). */
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
 *
 * Settings chosen by measurement, not guesswork: on synthetic receipts,
 * Tesseract's default automatic page segmentation scored 15.8/35 on clean
 * images where single-block mode (PSM 6) scored 33.7/35 - a receipt is one
 * block of rows, and "auto" tends to carve it into separate columns.
 */
export async function runOcr(imageDataUrl: string): Promise<OcrResult> {
  const image = await prepareForOcr(imageDataUrl);

  const worker = await createWorker('eng');
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      // Keep the wide gaps between a description and its price - the parser relies on them.
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    const { data } = await worker.recognize(image, {}, { text: true, blocks: true });

    const lines: OcrLine[] = [];
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          lines.push({
            words: line.words.map((w) => ({ text: w.text, confidence: w.confidence, bbox: w.bbox })),
            bbox: line.bbox,
            baseline: line.baseline,
          });
        }
      }
    }

    const rows = rowsFromLines(lines);
    return { rawText: rows.length > 0 ? rows.join('\n') : data.text, confidence: data.confidence };
  } finally {
    await worker.terminate();
  }
}
