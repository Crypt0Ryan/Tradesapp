import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { updateClient, deleteClient } from '../../db/clientRepository';
import { createJob, deleteJob } from '../../db/jobRepository';
import type { Client } from '../../models/Client';

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
      start_date: new Date().toISOString().slice(0, 10),
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
      <li>
        <form onSubmit={handleSaveClient}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="Phone / email" />
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditingClient(false)}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <strong>{client.name}</strong>
      {client.contact_info && ` — ${client.contact_info}`}{' '}
      <button type="button" onClick={startEditClient}>
        Edit
      </button>
      <button type="button" onClick={handleDeleteClient}>
        Delete
      </button>
      {clientError && <p role="alert">{clientError}</p>}

      <ul>
        {jobs?.map((job) => (
          <li key={job.id}>
            <button
              type="button"
              onClick={() => onSelectJob(job.id)}
              aria-current={job.id === selectedJobId ? 'true' : undefined}
              style={job.id === selectedJobId ? { fontWeight: 'bold' } : undefined}
            >
              {job.title} — <em>{job.status}</em>
            </button>{' '}
            <button type="button" onClick={() => handleDeleteJob(job.id)}>
              Delete
            </button>
          </li>
        ))}

        {isAddingJob ? (
          <li>
            <form onSubmit={handleAddJob}>
              <input
                type="text"
                placeholder="Job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Quoted $ (optional)"
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(e.target.value)}
              />
              <button type="submit">Add</button>
              <button type="button" onClick={() => setIsAddingJob(false)}>
                Cancel
              </button>
            </form>
          </li>
        ) : (
          <li>
            <button type="button" onClick={() => setIsAddingJob(true)}>
              + Add job
            </button>
          </li>
        )}
      </ul>
    </li>
  );
}
