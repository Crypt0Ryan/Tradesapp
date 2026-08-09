import { useEffect, useState } from 'react';
import { updateReceipt, assignReceiptToJob, deleteReceipt } from '../../db/receiptRepository';
import { formatDate } from '../../lib/date';
import type { Receipt } from '../../models/Receipt';
import type { Job } from '../../models/Job';

export function ReceiptCard({
  receipt,
  assignableJobs,
}: {
  receipt: Receipt;
  /** Jobs to offer in an "assign to job" dropdown - only relevant for unassigned (inbox) receipts. */
  assignableJobs?: Job[];
}) {
  const [vendor, setVendor] = useState(receipt.vendor ?? '');
  const [date, setDate] = useState(receipt.date ?? '');
  const [total, setTotal] = useState(receipt.total?.toString() ?? '');

  // OCR fills these in asynchronously after this card has already rendered
  // with nulls - re-sync once it lands, so the guesses actually show up.
  useEffect(() => {
    setVendor(receipt.vendor ?? '');
    setDate(receipt.date ?? '');
    setTotal(receipt.total?.toString() ?? '');
  }, [receipt.vendor, receipt.date, receipt.total]);

  async function commitField(changes: Partial<Pick<Receipt, 'vendor' | 'date' | 'total'>>) {
    await updateReceipt(receipt.id, changes);
  }

  async function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const jobId = e.target.value;
    if (jobId) await assignReceiptToJob(receipt.id, jobId);
  }

  async function handleDelete() {
    await deleteReceipt(receipt.id);
  }

  return (
    <li>
      <div>
        {formatDate(receipt.created_at)}
        {receipt.ocr_confidence !== null && ` — OCR confidence: ${receipt.ocr_confidence.toFixed(0)}%`}
      </div>
      <img src={receipt.image_url} alt="Receipt" style={{ width: '150px' }} />
      <br />
      <input
        type="text"
        placeholder="Vendor"
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
        onBlur={() => commitField({ vendor: vendor.trim() || null })}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        onBlur={() => commitField({ date: date || null })}
      />
      <input
        type="number"
        min="0"
        step="any"
        placeholder="Total $"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        onBlur={() => commitField({ total: total === '' ? null : Number(total) })}
      />
      {assignableJobs && (
        <select defaultValue="" onChange={handleAssign}>
          <option value="" disabled>
            Assign to job…
          </option>
          {assignableJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      )}
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
    </li>
  );
}
