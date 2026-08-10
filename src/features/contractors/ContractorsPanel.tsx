import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import {
  createContractorLog,
  updateContractorLog,
  deleteContractorLog,
} from '../../db/contractorLogRepository';
import { formatDate, dateToInputValue } from '../../lib/date';
import type { ContractorLog, ContractorRole } from '../../models/ContractorLog';

const ROLES: ContractorRole[] = ['subcontractor', 'apprentice', 'other'];

function ContractorLogRow({ entry }: { entry: ContractorLog }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(entry.name);
  const [role, setRole] = useState(entry.role);
  const [date, setDate] = useState(entry.date);
  const [hours, setHours] = useState(entry.hours?.toString() ?? '');
  const [notes, setNotes] = useState(entry.notes);

  function startEdit() {
    setName(entry.name);
    setRole(entry.role);
    setDate(entry.date);
    setHours(entry.hours?.toString() ?? '');
    setNotes(entry.notes);
    setIsEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await updateContractorLog(entry.id, {
      name: name.trim(),
      role,
      date,
      hours: hours === '' ? null : Number(hours),
      notes: notes.trim(),
    });
    setIsEditing(false);
  }

  async function handleDelete() {
    await deleteContractorLog(entry.id);
  }

  if (isEditing) {
    return (
      <li>
        <form onSubmit={handleSave}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value as ContractorRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="number" min="0" step="any" placeholder="Hours" value={hours} onChange={(e) => setHours(e.target.value)} />
          <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
      {formatDate(entry.date)} — <strong>{entry.name}</strong> ({entry.role})
      {entry.hours !== null && ` — ${entry.hours.toFixed(2)} hrs`}
      {entry.notes && ` — ${entry.notes}`}{' '}
      <button type="button" onClick={startEdit}>
        Edit
      </button>
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
    </li>
  );
}

export function ContractorsPanel({ jobId }: { jobId: string }) {
  const entries = useLiveQuery(() => db.contractorLogs.where('job_id').equals(jobId).toArray(), [jobId]);

  const [name, setName] = useState('');
  const [role, setRole] = useState<ContractorRole>('subcontractor');
  const [date, setDate] = useState(() => dateToInputValue(new Date()));
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await createContractorLog({
      job_id: jobId,
      name: name.trim(),
      role,
      date,
      hours: hours === '' ? null : Number(hours),
      notes: notes.trim(),
    });

    setName('');
    setHours('');
    setNotes('');
  }

  return (
    <section>
      <h3>Contractors on Site</h3>

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value as ContractorRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Hours (optional)"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
        <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <ul>
        {entries?.map((entry) => (
          <ContractorLogRow key={entry.id} entry={entry} />
        ))}
        {entries?.length === 0 && <li>No contractors logged on site for this job yet.</li>}
      </ul>
    </section>
  );
}
