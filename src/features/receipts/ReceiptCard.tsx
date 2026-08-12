import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { updateReceipt, assignReceiptToJob, deleteReceipt } from '../../db/receiptRepository';
import { formatDate } from '../../lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  async function handleAssign(jobId: string) {
    await assignReceiptToJob(receipt.id, jobId);
  }

  async function handleDelete() {
    await deleteReceipt(receipt.id);
  }

  return (
    <li className="flex gap-3 rounded-lg border border-border p-3">
      <img src={receipt.image_url} alt="Receipt" className="h-24 w-20 shrink-0 rounded-md object-cover" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDate(receipt.created_at)}
            {receipt.ocr_confidence !== null && ` · OCR ${receipt.ocr_confidence.toFixed(0)}%`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            aria-label="Delete receipt"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Input
            type="text"
            placeholder="Vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            onBlur={() => commitField({ vendor: vendor.trim() || null })}
            className="min-w-28 flex-1"
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onBlur={() => commitField({ date: date || null })}
            className="w-40"
          />
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Total $"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            onBlur={() => commitField({ total: total === '' ? null : Number(total) })}
            className="w-28"
          />
        </div>
        {assignableJobs && (
          <Select onValueChange={handleAssign}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Assign to job…" />
            </SelectTrigger>
            <SelectContent>
              {assignableJobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </li>
  );
}
