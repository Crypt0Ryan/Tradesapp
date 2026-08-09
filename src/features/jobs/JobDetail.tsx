import { useState } from 'react';
import { updateJob } from '../../db/jobRepository';
import type { Job, JobStatus } from '../../models/Job';
import { JobSummary } from './JobSummary';
import { InvoiceView } from './InvoiceView';
import { TimePanel } from '../time/TimePanel';
import { MaterialsPanel } from '../materials/MaterialsPanel';
import { TravelPanel } from '../travel/TravelPanel';
import { PhotosPanel } from '../photos/PhotosPanel';
import { VoiceNotesPanel } from '../voice/VoiceNotesPanel';
import { ReceiptsPanel } from '../receipts/ReceiptsPanel';

const JOB_STATUSES: JobStatus[] = ['quoted', 'active', 'paused', 'complete', 'invoiced'];

function JobEditForm({ job, onDone }: { job: Job; onDone: () => void }) {
  const [title, setTitle] = useState(job.title);
  const [quotedAmount, setQuotedAmount] = useState(job.quoted_amount?.toString() ?? '');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await updateJob(job.id, {
      title: title.trim(),
      quoted_amount: quotedAmount === '' ? null : Number(quotedAmount),
    });
    onDone();
  }

  return (
    <form onSubmit={handleSave}>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input
        type="number"
        min="0"
        step="any"
        placeholder="Quoted $"
        value={quotedAmount}
        onChange={(e) => setQuotedAmount(e.target.value)}
      />
      <button type="submit">Save</button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}

export function JobDetail({ job, clientName, onClose }: { job: Job; clientName: string; onClose: () => void }) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (showInvoice) {
    return <InvoiceView job={job} onClose={() => setShowInvoice(false)} />;
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateJob(job.id, { status: e.target.value as JobStatus });
  }

  return (
    <section>
      {isEditing ? (
        <JobEditForm job={job} onDone={() => setIsEditing(false)} />
      ) : (
        <h3>
          {job.title} — {clientName}
          {job.quoted_amount !== null && ` (quoted $${job.quoted_amount.toFixed(2)})`}{' '}
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        </h3>
      )}

      <label>
        Status{' '}
        <select value={job.status} onChange={handleStatusChange}>
          {JOB_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <button type="button" onClick={onClose}>
        Close
      </button>
      <button type="button" onClick={() => setShowInvoice(true)}>
        View / Print Invoice
      </button>

      <JobSummary job={job} />
      <TimePanel job={job} />
      <MaterialsPanel jobId={job.id} />
      <TravelPanel jobId={job.id} />
      <PhotosPanel jobId={job.id} />
      <VoiceNotesPanel jobId={job.id} />
      <ReceiptsPanel jobId={job.id} />
    </section>
  );
}
