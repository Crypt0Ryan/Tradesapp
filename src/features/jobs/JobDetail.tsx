import { useState } from 'react';
import type { Job } from '../../models/Job';
import { JobSummary } from './JobSummary';
import { InvoiceView } from './InvoiceView';
import { TimePanel } from '../time/TimePanel';
import { MaterialsPanel } from '../materials/MaterialsPanel';
import { TravelPanel } from '../travel/TravelPanel';
import { PhotosPanel } from '../photos/PhotosPanel';
import { VoiceNotesPanel } from '../voice/VoiceNotesPanel';

export function JobDetail({ job, clientName, onClose }: { job: Job; clientName: string; onClose: () => void }) {
  const [showInvoice, setShowInvoice] = useState(false);

  if (showInvoice) {
    return <InvoiceView job={job} onClose={() => setShowInvoice(false)} />;
  }

  return (
    <section>
      <h3>
        {job.title} — {clientName}
      </h3>
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
    </section>
  );
}
