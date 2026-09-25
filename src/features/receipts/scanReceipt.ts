import { updateReceipt } from '../../db/receiptRepository';
import { runOcr, parseReceiptText } from '../../lib/receiptOcr';

/**
 * Reads a saved receipt photo and fills in whatever it can find (vendor, date,
 * total, GST, line items), keeping the raw text so it can be inspected later.
 * Every result is a guess the user edits - this only ever writes suggestions.
 * Throws if the OCR engine itself fails (e.g. offline on first use).
 */
export async function scanReceipt(receiptId: string, imageUrl: string): Promise<void> {
  const { rawText, confidence } = await runOcr(imageUrl);
  const parsed = parseReceiptText(rawText);

  await updateReceipt(receiptId, {
    vendor: parsed.vendor,
    date: parsed.date,
    total: parsed.total,
    gst: parsed.gst,
    gst_included: parsed.gstIncluded,
    line_items: parsed.items.map(({ description, amount, quantity, unit_price }) => ({
      description,
      amount,
      ...(quantity !== undefined && { quantity }),
      ...(unit_price !== undefined && { unit_price }),
    })),
    ocr_confidence: confidence,
    raw_text: rawText,
  });
}
