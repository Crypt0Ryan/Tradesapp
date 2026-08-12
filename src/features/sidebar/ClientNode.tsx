import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { db } from '../../db/database';
import { updateClient, deleteClient } from '../../db/clientRepository';
import { createJob, deleteJob } from '../../db/jobRepository';
import { dateToInputValue } from '../../lib/date';
import { JOB_STATUS_STYLES } from '../../lib/jobStatusStyles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Client } from '../../models/Client';

const sidebarInputClass =
  'bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50';

export function ClientNode({
  client,
  selectedJobId,
  onSelectJob,
}: {
  client: Client;
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
}) {
  const jobs = useLiveQuery(() => db.jobs.where('client_id').equals(client.id).toArray(), [client.id]);

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [name, setName] = useState(client.name);
  const [contactInfo, setContactInfo] = useState(client.contact_info);
  const [address, setAddress] = useState(client.address);
  const [clientError, setClientError] = useState<string | null>(null);

  const [isAddingJob, setIsAddingJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');

  function startEditClient() {
    setName(client.name);
    setContactInfo(client.contact_info);
    setAddress(client.address);
    setIsEditingClient(true);
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await updateClient(client.id, { name: name.trim(), contact_info: contactInfo.trim(), address: address.trim() });
    setIsEditingClient(false);
  }

  async function handleDeleteClient() {
    setClientError(null);
    try {
      await deleteClient(client.id);
    } catch (err) {
      setClientError(err instanceof Error ? err.message : 'Could not delete client.');
    }
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    const job = await createJob({
      client_id: client.id,
      title: jobTitle.trim(),
      status: 'quoted',
      quoted_amount: quotedAmount === '' ? null : Number(quotedAmount),
      hourly_rate: null,
      start_date: dateToInputValue(new Date()),
      notes: '',
    });

    setJobTitle('');
    setQuotedAmount('');
    setIsAddingJob(false);
    onSelectJob(job.id);
  }

  async function handleDeleteJob(jobId: string) {
    await deleteJob(jobId);
    if (jobId === selectedJobId) onSelectJob(null);
  }

  if (isEditingClient) {
    return (
      <li className="rounded-lg bg-sidebar-accent p-3">
        <form onSubmit={handleSaveClient} className="flex flex-col gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className={sidebarInputClass} />
          <Input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Phone / email"
            className={sidebarInputClass}
          />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
            className={sidebarInputClass}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" size="sm" className="flex-1">
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingClient(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="group flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sidebar-foreground">{client.name}</div>
          {client.contact_info && (
            <div className="truncate text-xs text-sidebar-foreground/60">{client.contact_info}</div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={startEditClient}
          aria-label="Edit client"
          className="text-sidebar-foreground/60 hover:bg-sidebar-border hover:text-sidebar-foreground"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDeleteClient}
          aria-label="Delete client"
          className="text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {clientError && <p className="px-2 text-xs text-destructive">{clientError}</p>}

      <ul className="ml-3 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
        {jobs?.map((job) => (
          <li key={job.id} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectJob(job.id)}
              aria-current={job.id === selectedJobId ? 'true' : undefined}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent',
                job.id === selectedJobId && 'bg-sidebar-accent font-semibold text-sidebar-foreground',
              )}
            >
              <span className="truncate">{job.title}</span>
              <span
                className={cn(
                  'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize',
                  JOB_STATUS_STYLES[job.status],
                )}
              >
                {job.status}
              </span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDeleteJob(job.id)}
              aria-label={`Delete ${job.title}`}
              className="shrink-0 text-sidebar-foreground/50 hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}

        {isAddingJob ? (
          <li className="rounded-lg bg-sidebar-accent p-3">
            <form onSubmit={handleAddJob} className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={sidebarInputClass}
              />
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Quoted $ (optional)"
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(e.target.value)}
                className={sidebarInputClass}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="sm" className="flex-1">
                  Add
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsAddingJob(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            </form>
          </li>
        ) : (
          <li>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingJob(true)}
              className="gap-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Plus className="size-3.5" />
              Add job
            </Button>
          </li>
        )}
      </ul>
    </li>
  );
}
