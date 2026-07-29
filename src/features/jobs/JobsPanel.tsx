import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createJob } from '../../db/jobRepository';
import { JobDetail } from './JobDetail';

export function JobsPanel() {
  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const jobs = useLiveQuery(() => db.jobs.toArray(), []);

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    await createJob({
      client_id: clientId,
      title: title.trim(),
      status: 'quoted',
      quoted_amount: null,
      hourly_rate: null,
      start_date: new Date().toISOString().slice(0, 10),
      notes: '',
    });

    setTitle('');
  }

  function clientName(clientIdToFind: string) {
    return clients?.find((c) => c.id === clientIdToFind)?.name ?? 'Unknown client';
  }

  const hasClients = (clients?.length ?? 0) > 0;
  const selectedJob = jobs?.find((job) => job.id === selectedJobId) ?? null;

  return (
    <section>
      <h2>Jobs</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!hasClients}
        />
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={!hasClients}>
          <option value="">Select client…</option>
          {clients?.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!hasClients}>
          Add job
        </button>
      </form>
      {!hasClients && <p>Add a client first before creating a job.</p>}

      <ul>
        {jobs?.map((job) => (
          <li key={job.id}>
            <button type="button" onClick={() => setSelectedJobId(job.id)}>
              {job.title} — {clientName(job.client_id)} — <em>{job.status}</em>
            </button>
          </li>
        ))}
        {jobs?.length === 0 && <li>No jobs yet.</li>}
      </ul>

      {selectedJob && (
        <JobDetail
          job={selectedJob}
          clientName={clientName(selectedJob.client_id)}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </section>
  );
}
