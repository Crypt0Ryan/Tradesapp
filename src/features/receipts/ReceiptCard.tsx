import { useEffect, useState } from 'react';
import { Trash2, PackagePlus } from 'lucide-react';
import { updateReceipt, assignReceiptToJob, deleteReceipt } from '../../db/receiptRepository';
import { createMaterialEntry } from '../../db/materialEntryRepository';
import { upsertMaterialLibraryItem } from '../../db/materialLibraryRepository';
import { formatDate } from '../../lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Receipt, ReceiptLineItem } from '../../models/Receipt';
import type { Job } from '../../models/Job';

interface LineItemDraft extends ReceiptLineItem {
  selected: boolean;
}

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
  const [lineItemDrafts, setLineItemDrafts] = useState<LineItemDraft[]>(() =>
    receipt.line_items.map((item) => ({ ...item, selected: true })),
  );

  // OCR fills these in asynchronously after this card has already rendered
  // with nulls - re-sync once it lands, so the guesses actually show up.
  useEffect(() => {
    setVendor(receipt.vendor ?? '');
    setDate(receipt.date ?? '');
    setTotal(receipt.total?.toString() ?? '');
  }, [receipt.vendor, receipt.date, receipt.total]);

  useEffect(() => {
    setLineItemDrafts(receipt.line_items.map((item) => ({ ...item, selected: true })));
  }, [receipt.line_items]);

  async function commitField(changes: Partial<Pick<Receipt, 'vendor' | 'date' | 'total'>>) {
    await updateReceipt(receipt.id, changes);
  }

  async function handleAssign(jobId: string) {
    await assignReceiptToJob(receipt.id, jobId);
  }

  async function handleDelete() {
    await deleteReceipt(receipt.id);
  }

  function updateLineItemDraft(index: number, changes: Partial<LineItemDraft>) {
    setLineItemDrafts((drafts) => drafts.map((draft, i) => (i === index ? { ...draft, ...changes } : draft)));
  }

  async function handleAddSelectedToMaterials() {
    const jobId = receipt.job_id;
    if (!jobId) return;

    const toAdd = lineItemDrafts.filter((item) => item.selected);
    if (toAdd.length === 0) return;

    for (const item of toAdd) {
      const description = item.description.trim() || 'Receipt item';
      await createMaterialEntry({
        job_id: jobId,
        name: description,
        quantity: 1,
        unit: 'item',
        unit_cost: item.amount,
        markup_pct: 0,
        source: 'receipt_ocr',
        receipt_id: receipt.id,
      });
      await upsertMaterialLibraryItem({ name: description, unit: 'item', unit_cost: item.amount });
    }

    const remaining = lineItemDrafts.filter((item) => !item.selected).map(({ description, amount }) => ({ description, amount }));
    await updateReceipt(receipt.id, { line_items: remaining });
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

        {receipt.job_id && lineItemDrafts.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border p-2">
            <span className="text-xs font-medium text-muted-foreground">Parsed items - add to materials?</span>
            {lineItemDrafts.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={(checked) => updateLineItemDraft(i, { selected: checked === true })}
                  aria-label={`Include ${item.description || 'item'}`}
                />
                <Input
                  value={item.description}
                  onChange={(e) => updateLineItemDraft(i, { description: e.target.value })}
                  className="min-w-0 flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={item.amount}
                  onChange={(e) => updateLineItemDraft(i, { amount: Number(e.target.value) || 0 })}
                  className="w-24"
                />
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={handleAddSelectedToMaterials} className="w-fit gap-1.5">
              <PackagePlus className="size-4" />
              Add checked to materials
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
