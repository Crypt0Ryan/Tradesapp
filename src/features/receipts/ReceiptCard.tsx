import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, PackagePlus, ReceiptText, Plus, X, RefreshCw, CircleCheck, TriangleAlert } from 'lucide-react';
import { db } from '../../db/database';
import { updateReceipt, assignReceiptToJob, deleteReceipt } from '../../db/receiptRepository';
import { createMaterialEntry } from '../../db/materialEntryRepository';
import { upsertMaterialLibraryItem } from '../../db/materialLibraryRepository';
import { formatDate } from '../../lib/date';
import { formatCurrency } from '../../lib/currency';
import { scanReceipt } from './scanReceipt';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import { SubJobSelect } from '@/components/SubJobSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Receipt, ReceiptLineItem } from '../../models/Receipt';
import type { Job } from '../../models/Job';
import type { SubJob } from '../../models/SubJob';

interface LineItemDraft extends ReceiptLineItem {
  selected: boolean;
}

const GST_RATE = 1.1;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** Only real rows are saved - a half-typed empty "new line" stays local until it has something in it. */
function toSaved(drafts: LineItemDraft[]): ReceiptLineItem[] {
  return drafts
    .filter((d) => d.description.trim() !== '' || d.amount !== 0)
    .map(({ description, amount, quantity, unit_price }) => ({
      description,
      amount,
      ...(quantity !== undefined && { quantity }),
      ...(unit_price !== undefined && { unit_price }),
    }));
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
  const [drafts, setDrafts] = useState<LineItemDraft[]>(() => receipt.line_items.map((i) => ({ ...i, selected: true })));
  const [subJobId, setSubJobId] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanError, setRescanError] = useState<string | null>(null);

  const jobId = receipt.job_id;
  const subJobs = useLiveQuery(
    () => (jobId ? db.subJobs.where('job_id').equals(jobId).sortBy('created_at') : Promise.resolve<SubJob[]>([])),
    [jobId],
  );
  const addedMaterials = useLiveQuery(() => db.materialEntries.where('receipt_id').equals(receipt.id).toArray(), [receipt.id]);

  // Unknown GST status is treated as "included" - true of most retail receipts, and the safer error
  // (slightly under-costing) than charging GST on GST.
  const gstIncluded = receipt.gst_included ?? true;

  // OCR fills these in asynchronously after this card has already rendered
  // with nulls - re-sync once it lands, so the guesses actually show up.
  useEffect(() => {
    setVendor(receipt.vendor ?? '');
    setDate(receipt.date ?? '');
    setTotal(receipt.total?.toString() ?? '');
  }, [receipt.vendor, receipt.date, receipt.total]);

  // Re-sync the item rows only when the saved items really differ from what's on screen, so saving an
  // edit doesn't reset which rows are ticked.
  useEffect(() => {
    setDrafts((current) =>
      JSON.stringify(toSaved(current)) === JSON.stringify(receipt.line_items)
        ? current
        : receipt.line_items.map((i) => ({ ...i, selected: true })),
    );
  }, [receipt.line_items]);

  async function commitField(changes: Partial<Pick<Receipt, 'vendor' | 'date' | 'total'>>) {
    await updateReceipt(receipt.id, changes);
  }

  async function handleAssign(id: string) {
    await assignReceiptToJob(receipt.id, id);
  }

  async function handleDelete() {
    await deleteReceipt(receipt.id);
  }

  async function handleRescan() {
    setRescanError(null);
    setIsRescanning(true);
    try {
      await scanReceipt(receipt.id, receipt.image_url);
    } catch {
      setRescanError('Could not read this receipt - check your connection and try again.');
    } finally {
      setIsRescanning(false);
    }
  }

  function updateDraft(index: number, changes: Partial<LineItemDraft>) {
    setDrafts((current) => current.map((d, i) => (i === index ? { ...d, ...changes } : d)));
  }

  function commitDrafts(next: LineItemDraft[] = drafts) {
    return updateReceipt(receipt.id, { line_items: toSaved(next) });
  }

  function removeDraft(index: number) {
    const next = drafts.filter((_, i) => i !== index);
    setDrafts(next);
    void commitDrafts(next);
  }

  /** Ex-GST cost for a printed price. Trade invoices that list prices ex-GST need no conversion. */
  const exGst = (printed: number) => (gstIncluded ? printed / GST_RATE : printed);

  async function handleAddWholeReceipt() {
    if (!jobId || !receipt.total) return;
    // On an ex-GST invoice the printed total already has GST added on top - take that back off.
    const exTotal =
      receipt.gst_included === false ? (receipt.gst != null ? receipt.total - receipt.gst : receipt.total / GST_RATE) : receipt.total / GST_RATE;
    const label = receipt.vendor?.trim() || 'Receipt';
    await createMaterialEntry({
      job_id: jobId,
      name: receipt.date ? `${label} receipt ${formatDate(receipt.date)}` : `${label} receipt`,
      quantity: 1,
      unit: 'receipt',
      unit_cost: round4(exTotal),
      markup_pct: 0,
      source: 'receipt_ocr',
      receipt_id: receipt.id,
      sub_job_id: subJobId,
    });
  }

  async function handleAddSelected() {
    if (!jobId) return;
    const toAdd = drafts.filter((d) => d.selected && d.amount > 0);
    if (toAdd.length === 0) return;

    for (const item of toAdd) {
      const description = item.description.trim() || 'Receipt item';
      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const unitCost = round4(exGst(item.amount) / quantity);
      await createMaterialEntry({
        job_id: jobId,
        name: description,
        quantity,
        unit: 'ea',
        unit_cost: unitCost,
        markup_pct: 0,
        source: 'receipt_ocr',
        receipt_id: receipt.id,
        sub_job_id: subJobId,
      });
      await upsertMaterialLibraryItem({ name: description, unit: 'ea', unit_cost: unitCost });
    }

    // Items now live in the job's materials - take them off the receipt's pending list so they can't be added twice.
    await commitDrafts(drafts.filter((d) => !d.selected));
  }

  const itemsSum = drafts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const expectedItemsSum =
    receipt.total == null ? null : receipt.gst_included === false && receipt.gst != null ? receipt.total - receipt.gst : receipt.total;
  const difference = expectedItemsSum == null || drafts.length === 0 ? null : expectedItemsSum - itemsSum;
  const selectedCount = drafts.filter((d) => d.selected && d.amount > 0).length;
  const hasRawText = Boolean(receipt.raw_text?.trim());

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex gap-3">
        <img src={receipt.image_url} alt="Receipt" className="h-24 w-20 shrink-0 rounded-md object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(receipt.created_at)}
              {receipt.ocr_confidence !== null && ` · scan confidence ${receipt.ocr_confidence.toFixed(0)}%`}
            </span>
            <ConfirmDeleteButton
              onConfirm={handleDelete}
              title="Delete this receipt?"
              description="This will permanently remove the receipt photo and any details captured from it. This can't be undone."
              variant="ghost"
              size="icon-sm"
              aria-label="Delete receipt"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </ConfirmDeleteButton>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Input
              type="text"
              placeholder="Vendor"
              aria-label="Vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              onBlur={() => commitField({ vendor: vendor.trim() || null })}
              className="min-w-28 flex-1"
            />
            <Input
              type="date"
              aria-label="Receipt date"
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
              aria-label="Receipt total"
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
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Items on this receipt</span>
          <Label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={gstIncluded}
              onCheckedChange={(checked) => updateReceipt(receipt.id, { gst_included: checked === true })}
            />
            Prices include GST
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Materials are costed ex-GST, so 10% is taken off when this is ticked (retail receipts). Untick it for trade tax
          invoices that list prices before GST.
        </p>

        {isRescanning && <p className="text-sm text-muted-foreground">Reading receipt…</p>}
        {drafts.length === 0 && !isRescanning && (
          <p className="text-sm text-muted-foreground">
            No items were picked up. Add them by hand below, or add the whole receipt as one material.
          </p>
        )}

        {drafts.map((item, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            <Checkbox
              checked={item.selected}
              onCheckedChange={(checked) => updateDraft(i, { selected: checked === true })}
              aria-label={`Include ${item.description || 'item'}`}
              className="shrink-0"
            />
            <Input
              value={item.description}
              placeholder="Item"
              aria-label="Item description"
              onChange={(e) => updateDraft(i, { description: e.target.value })}
              onBlur={() => commitDrafts()}
              className="min-w-0 flex-1 basis-40"
            />
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="Qty"
              aria-label="Quantity"
              value={item.quantity ?? ''}
              onChange={(e) => updateDraft(i, { quantity: e.target.value === '' ? undefined : Number(e.target.value) })}
              onBlur={() => commitDrafts()}
              className="w-16"
            />
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="$"
              aria-label="Line amount"
              value={item.amount || ''}
              onChange={(e) => updateDraft(i, { amount: Number(e.target.value) || 0 })}
              onBlur={() => commitDrafts()}
              className="w-24"
            />
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeDraft(i)} aria-label="Remove line">
              <X className="size-3.5" />
            </Button>
          </div>
        ))}

        {difference !== null && (
          <p
            className={
              Math.abs(difference) < 0.05
                ? 'flex items-center gap-1.5 text-sm text-success'
                : 'flex items-center gap-1.5 text-sm text-foreground'
            }
          >
            {Math.abs(difference) < 0.05 ? (
              <>
                <CircleCheck className="size-4 shrink-0" />
                Items add up to the receipt total ({formatCurrency(itemsSum)}).
              </>
            ) : (
              <>
                <TriangleAlert className="size-4 shrink-0 text-accent" />
                Items add up to {formatCurrency(itemsSum)} but the receipt says {formatCurrency(expectedItemsSum ?? 0)} (
                {formatCurrency(Math.abs(difference))} {difference > 0 ? 'missing' : 'over'}) - check for a missed or misread
                line.
              </>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setDrafts((d) => [...d, { description: '', amount: 0, selected: true }])}
          >
            <Plus className="size-3.5" />
            Add line
          </Button>
          <ConfirmDeleteButton
            onConfirm={handleRescan}
            title="Scan this receipt again?"
            description="This reads the photo again and replaces the vendor, date, total and items above with a fresh scan. Anything you've edited will be overwritten."
            confirmLabel="Re-scan"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            disabled={isRescanning}
          >
            <RefreshCw className="size-3.5" />
            Re-scan
          </ConfirmDeleteButton>
        </div>

        {jobId ? (
          <div className="flex flex-col gap-2 border-t border-border pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <SubJobSelect subJobs={subJobs} value={subJobId} onChange={setSubJobId} className="h-9 w-40" />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1.5"
                disabled={selectedCount === 0}
                onClick={handleAddSelected}
              >
                <PackagePlus className="size-4" />
                Add {selectedCount > 0 ? selectedCount : 'checked'} {selectedCount === 1 ? 'item' : 'items'} to materials
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={!receipt.total}
                onClick={handleAddWholeReceipt}
              >
                <ReceiptText className="size-4" />
                Add whole receipt{receipt.total ? ` (${formatCurrency(receipt.total)})` : ''} as one item
              </Button>
            </div>
            {addedMaterials && addedMaterials.length > 0 && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <CircleCheck className="size-4 shrink-0" />
                {addedMaterials.length} {addedMaterials.length === 1 ? 'material' : 'materials'} already added to this job from
                this receipt.
              </p>
            )}
          </div>
        ) : (
          <p className="border-t border-border pt-2 text-sm text-muted-foreground">
            Assign this receipt to a job to add its items to that job's materials.
          </p>
        )}

        {rescanError && <p className="text-sm text-destructive">{rescanError}</p>}

        {hasRawText && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">What the scanner read</summary>
            <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre">{receipt.raw_text}</pre>
          </details>
        )}
      </div>
    </li>
  );
}
