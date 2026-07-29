import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { gstAmount, incGstAmount } from '../../lib/gst';
import { materialLineTotal } from '../../lib/materials';
import { formatDate } from '../../lib/date';
import { getBusinessSettings, saveBusinessSettings } from '../../lib/businessSettings';
import type { Job } from '../../models/Job';

function BusinessDetailsHeader() {
  const [settings, setSettings] = useState(getBusinessSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [abn, setAbn] = useState(settings.abn);

  function startEdit() {
    setBusinessName(settings.businessName);
    setAbn(settings.abn);
    setIsEditing(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const updated = { businessName: businessName.trim(), abn: abn.trim() };
    saveBusinessSettings(updated);
    setSettings(updated);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="no-print">
        <input
          type="text"
          placeholder="Your business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <input type="text" placeholder="ABN" value={abn} onChange={(e) => setAbn(e.target.value)} />
        <button type="submit">Save</button>
        <button type="button" onClick={() => setIsEditing(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div>
      <strong>{settings.businessName || 'Your Business Name'}</strong>
      {settings.abn && <div>ABN: {settings.abn}</div>}
      <button type="button" className="no-print" onClick={startEdit}>
        Edit business details
      </button>
    </div>
  );
}

export function InvoiceView({ job, onClose }: { job: Job; onClose: () => void }) {
  const client = useLiveQuery(() => db.clients.get(job.client_id), [job.client_id]);
  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(job.id).toArray(), [job.id]);
  const materialEntries = useLiveQuery(() => db.materialEntries.where('job_id').equals(job.id).toArray(), [job.id]);

  const billableMinutes = timeEntries?.reduce((sum, e) => sum + (e.billable ? (e.duration_minutes ?? 0) : 0), 0) ?? 0;
  const billableHours = billableMinutes / 60;
  const labourCost = job.hourly_rate ? billableHours * job.hourly_rate : 0;
  const materialsCost =
    materialEntries?.reduce((sum, e) => sum + materialLineTotal(e.quantity, e.unit_cost, e.markup_pct), 0) ?? 0;
  const subtotal = labourCost + materialsCost;

  const invoiceNumber = `INV-${job.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = formatDate(new Date().toISOString());

  return (
    <div className="invoice-print-area">
      <div className="no-print">
        <button type="button" onClick={() => window.print()}>
          Print Invoice
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <h2>Tax Invoice</h2>
      <BusinessDetailsHeader />

      <p>
        Invoice #: {invoiceNumber}
        <br />
        Date: {invoiceDate}
      </p>

      <h3>Bill To</h3>
      <p>
        {client?.name}
        <br />
        {client?.contact_info}
        <br />
        {client?.address}
      </p>

      <h3>{job.title}</h3>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty / Hours</th>
            <th>Rate</th>
            <th>Amount (ex GST)</th>
          </tr>
        </thead>
        <tbody>
          {job.hourly_rate && billableHours > 0 && (
            <tr>
              <td>Labour</td>
              <td>{billableHours.toFixed(2)} hrs</td>
              <td>${job.hourly_rate.toFixed(2)}/hr</td>
              <td>${labourCost.toFixed(2)}</td>
            </tr>
          )}
          {materialEntries?.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.name}</td>
              <td>
                {entry.quantity} {entry.unit}
              </td>
              <td>
                ${entry.unit_cost.toFixed(2)}
                {entry.markup_pct > 0 && ` (+${entry.markup_pct}%)`}
              </td>
              <td>${materialLineTotal(entry.quantity, entry.unit_cost, entry.markup_pct).toFixed(2)}</td>
            </tr>
          ))}
          {!job.hourly_rate && materialEntries?.length === 0 && (
            <tr>
              <td colSpan={4}>Nothing logged against this job yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td>Subtotal (ex GST)</td>
            <td>${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>GST (10%)</td>
            <td>${gstAmount(subtotal).toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <strong>Total (inc GST)</strong>
            </td>
            <td>
              <strong>${incGstAmount(subtotal).toFixed(2)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
