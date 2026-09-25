import { useState } from 'react';
import { createReceipt } from '../../db/receiptRepository';
import { scanReceipt } from './scanReceipt';
import { Input } from '@/components/ui/input';

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
      await scanReceipt(receipt.id, imageUrl);
    } catch {
      setOcrError('Could not read this receipt automatically - add the details by hand below.');
    } finally {
      setIsOcrRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <Input type="file" accept="image/*" capture="environment" onChange={handleFileSelected} />
      <p className="text-xs text-muted-foreground">
        For the best scan: lay the receipt flat, in good light with no shadow across it, and fill the frame. Whatever gets
        read is a guess - always check the numbers.
      </p>
      {isOcrRunning && <p className="text-sm text-muted-foreground">Reading receipt…</p>}
      {ocrError && <p className="text-sm text-destructive">{ocrError}</p>}
    </div>
  );
}
