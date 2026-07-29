import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createMaterialEntry, updateMaterialEntry, deleteMaterialEntry } from '../../db/materialEntryRepository';
import { gstAmount, incGstAmount } from '../../lib/gst';
import { materialLineTotal as lineTotal } from '../../lib/materials';
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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
      <li>
        <form onSubmit={handleSave}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <input type="number" min="0" step="any" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
          <input type="number" min="0" step="any" value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      {entry.quantity} {entry.unit} {entry.name} @ ${entry.unit_cost.toFixed(2)}
      {entry.markup_pct > 0 && ` (+${entry.markup_pct}%)`} — ${lineTotal(entry.quantity, entry.unit_cost, entry.markup_pct).toFixed(2)}{' '}
      <button type="button" onClick={startEdit}>
        Edit
      </button>
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
    </li>
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
    <section>
      <h3>Materials</h3>

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Item" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <input type="text" placeholder="Unit (e.g. m, box)" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Unit cost $"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
        />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Markup %"
          value={markupPct}
          onChange={(e) => setMarkupPct(e.target.value)}
        />
        <button type="submit">Add material</button>
      </form>

      <ul>
        {entries?.map((entry) => (
          <MaterialEntryRow key={entry.id} entry={entry} />
        ))}
        {entries?.length === 0 && <li>No materials logged yet.</li>}
      </ul>
      {entries && entries.length > 0 && (
        <p>
          <strong>Materials (ex GST): ${total.toFixed(2)}</strong>
          {' — '}
          GST: ${gstAmount(total).toFixed(2)}
          {' — '}
          <strong>Total (inc GST): ${incGstAmount(total).toFixed(2)}</strong>
        </p>
      )}
    </section>
  );
}
