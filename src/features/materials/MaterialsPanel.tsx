import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createMaterialEntry } from '../../db/materialEntryRepository';
import { gstAmount, incGstAmount } from '../../lib/gst';

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

  function lineTotal(quantity: number, unitCost: number, markupPct: number) {
    return quantity * unitCost * (1 + markupPct / 100);
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
          <li key={entry.id}>
            {entry.quantity} {entry.unit} {entry.name} @ ${entry.unit_cost.toFixed(2)}
            {entry.markup_pct > 0 && ` (+${entry.markup_pct}%)`} — $
            {lineTotal(entry.quantity, entry.unit_cost, entry.markup_pct).toFixed(2)}
          </li>
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
