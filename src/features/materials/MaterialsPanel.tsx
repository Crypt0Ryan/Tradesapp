import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Package, Pencil, Trash2, Plus } from 'lucide-react';
import { db } from '../../db/database';
import { createMaterialEntry, updateMaterialEntry, deleteMaterialEntry } from '../../db/materialEntryRepository';
import { gstAmount, incGstAmount } from '../../lib/gst';
import { materialLineTotal as lineTotal } from '../../lib/materials';
import { formatCurrency } from '../../lib/currency';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { MaterialEntry } from '../../models/MaterialEntry';

function MaterialEntryRow({ entry }: { entry: MaterialEntry }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(entry.name);
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [unit, setUnit] = useState(entry.unit);
  const [unitCost, setUnitCost] = useState(String(entry.unit_cost));
  const [markupPct, setMarkupPct] = useState(String(entry.markup_pct));

  function startEdit() {
    setName(entry.name);
    setQuantity(String(entry.quantity));
    setUnit(entry.unit);
    setUnitCost(String(entry.unit_cost));
    setMarkupPct(String(entry.markup_pct));
    setIsEditing(true);
  }

  async function handleSave() {
    await updateMaterialEntry(entry.id, {
      name: name.trim(),
      quantity: Number(quantity) || 0,
      unit: unit.trim(),
      unit_cost: Number(unitCost) || 0,
      markup_pct: Number(markupPct) || 0,
    });
    setIsEditing(false);
  }

  async function handleDelete() {
    await deleteMaterialEntry(entry.id);
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="min-w-32" />
        </TableCell>
        <TableCell className="flex gap-1.5">
          <Input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-16" />
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-16" />
        </TableCell>
        <TableCell>
          <Input type="number" min="0" step="any" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-24" />
        </TableCell>
        <TableCell>
          <Input type="number" min="0" step="any" value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} className="w-20" />
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(lineTotal(Number(quantity) || 0, Number(unitCost) || 0, Number(markupPct) || 0))}
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button type="button" size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{entry.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {entry.quantity} {entry.unit}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatCurrency(entry.unit_cost)}</TableCell>
      <TableCell className="text-muted-foreground">{entry.markup_pct > 0 ? `${entry.markup_pct}%` : '—'}</TableCell>
      <TableCell className="text-right font-medium text-foreground">
        {formatCurrency(lineTotal(entry.quantity, entry.unit_cost, entry.markup_pct))}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="icon-sm" onClick={startEdit} aria-label="Edit material">
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            aria-label="Delete material"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function MaterialsPanel({ jobId }: { jobId: string }) {
  const entries = useLiveQuery(() => db.materialEntries.where('job_id').equals(jobId).toArray(), [jobId]);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [markupPct, setMarkupPct] = useState('0');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !unitCost) return;

    await createMaterialEntry({
      job_id: jobId,
      name: name.trim(),
      quantity: Number(quantity) || 0,
      unit: unit.trim(),
      unit_cost: Number(unitCost) || 0,
      markup_pct: Number(markupPct) || 0,
      source: 'manual',
      receipt_id: null,
    });

    setName('');
    setQuantity('1');
    setUnit('');
    setUnitCost('');
    setMarkupPct('0');
  }

  const total = entries?.reduce((sum, e) => sum + lineTotal(e.quantity, e.unit_cost, e.markup_pct), 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="size-4.5 text-accent" />
          Materials
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <Input type="text" placeholder="Item" value={name} onChange={(e) => setName(e.target.value)} className="min-w-32 flex-1" />
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20"
          />
          <Input
            type="text"
            placeholder="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-24"
          />
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Unit cost $"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="w-28"
          />
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Markup %"
            value={markupPct}
            onChange={(e) => setMarkupPct(e.target.value)}
            className="w-24"
          />
          <Button type="submit" size="sm" variant="secondary" className="gap-1.5">
            <Plus className="size-4" />
            Add
          </Button>
        </form>

        {entries && entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit cost</TableHead>
                <TableHead>Markup</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <MaterialEntryRow key={entry.id} entry={entry} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No materials logged yet.</p>
        )}
      </CardContent>

      {entries && entries.length > 0 && (
        <CardFooter className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            Materials (ex GST) <span className="font-medium text-foreground">{formatCurrency(total)}</span>
          </span>
          <span className="text-muted-foreground">
            GST <span className="font-medium text-foreground">{formatCurrency(gstAmount(total))}</span>
          </span>
          <span className="text-muted-foreground">
            Total (inc GST) <span className="font-semibold text-foreground">{formatCurrency(incGstAmount(total))}</span>
          </span>
        </CardFooter>
      )}
    </Card>
  );
}
