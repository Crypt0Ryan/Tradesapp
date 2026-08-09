import { useState } from 'react';
import { createReceipt, updateReceipt } from '../../db/receiptRepository';
import { runOcr, parseReceiptFields } from '../../lib/receiptOcr';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ReceiptCapture({ jobId }: { jobId: string | null }) {
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    setOcrError(null);
    const imageUrl = await readFileAsDataUrl(file);

    // Save the raw photo immediately, before OCR runs - OCR is a best-effort
    // enhancement that can fail (e.g. no internet for the model on first
    // use), but the receipt itself must never be lost.
    const receipt = await createReceipt({
      job_id: jobId,
      image_url: imageUrl,
      vendor: null,
      date: null,
      total: null,
      line_items: [],
      ocr_confidence: null,
      status: 'pending_review',
      created_at: new Date().toISOString(),
    });

    setIsOcrRunning(true);
    try {
      const { rawText, confidence } = await runOcr(imageUrl);
      const { vendor, date, total } = parseReceiptFields(rawText);
      await updateReceipt(receipt.id, { vendor, date, total, ocr_confidence: confidence });
    } catch {
      setOcrError('Could not read this receipt automatically - add the details by hand below.');
    } finally {
      setIsOcrRunning(false);
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" capture="environment" onChange={handleFileSelected} />
      {isOcrRunning && <p>Reading receipt…</p>}
      {ocrError && <p role="alert">{ocrError}</p>}
    </div>
  );
}
