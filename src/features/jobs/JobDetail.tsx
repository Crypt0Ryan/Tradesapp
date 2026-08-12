import { useState } from 'react';
import { ArrowLeft, FileText, Pencil } from 'lucide-react';
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
import { ContractorsPanel } from '../contractors/ContractorsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOB_STATUS_STYLES } from '../../lib/jobStatusStyles';
import { cn } from '@/lib/utils';

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
    <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-xs" />
      <Input
        type="number"
        min="0"
        step="any"
        placeholder="Quoted $"
        value={quotedAmount}
        onChange={(e) => setQuotedAmount(e.target.value)}
        className="max-w-32"
      />
      <Button type="submit" size="sm">
        Save
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        Cancel
      </Button>
    </form>
  );
}

export function JobDetail({ job, clientName, onClose }: { job: Job; clientName: string; onClose: () => void }) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (showInvoice) {
    return <InvoiceView job={job} onClose={() => setShowInvoice(false)} />;
  }

  async function handleStatusChange(value: string) {
    await updateJob(job.id, { status: value as JobStatus });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="w-fit gap-1.5 text-muted-foreground">
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {isEditing ? (
              <JobEditForm job={job} onDone={() => setIsEditing(false)} />
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsEditing(true)} aria-label="Edit job">
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">
              {clientName}
              {job.quoted_amount !== null && ` · Quoted $${job.quoted_amount.toFixed(2)}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={job.status} onValueChange={handleStatusChange}>
              <SelectTrigger className={cn('w-36 border-none font-medium capitalize', JOB_STATUS_STYLES[job.status])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => setShowInvoice(true)} className="gap-2">
              <FileText className="size-4" />
              Invoice
            </Button>
          </div>
        </div>
      </div>

      <JobSummary job={job} />
      <TimePanel job={job} />
      <ContractorsPanel jobId={job.id} />
      <MaterialsPanel jobId={job.id} />
      <TravelPanel jobId={job.id} />
      <PhotosPanel jobId={job.id} />
      <VoiceNotesPanel jobId={job.id} />
      <ReceiptsPanel jobId={job.id} />
    </div>
  );
}
